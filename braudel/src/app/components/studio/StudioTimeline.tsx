// app/components/studio/StudioTimeline.tsx

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Music, 
  Mic, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus, 
  Film, 
  Layers, 
  X, 
  Download, 
  Sliders,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Copy,
  ClipboardPaste,
  Image as ImageIcon,
  Video as VideoIcon,
  CheckCircle2,
  Save,
  FileDown,
  FolderOpen
} from 'lucide-react';
import { StoryProject, StoryScene } from '../../../core/schema/story';
import { 
  EditTimeline, 
  VideoClip, 
  createDefaultEditTimeline, 
  computeTotalTimelineDuration 
} from '../../../services/export/studio-types';
import { getEffectiveStyleBearing } from '../../../core/styles.config';
import { 
  resolveTrackOverlaps, 
  getVideoClipAtTime 
} from '../../../services/export/TimelineScheduler';
import { 
  createAudioClipFromFile, 
  drawWaveformOnCanvas, 
  getSharedAudioContext,
  playAudioPreview 
} from '../../../services/export/audio-import';
import { importMediaFile } from '../../../services/export/media-import';
import { 
  splitClipAtTime, 
  copyClip, 
  cutClip, 
  pasteClip, 
  StudioClipboardItem 
} from '../../../services/export/timeline-editor-actions';
import { saveStoryToStorage } from '../../../services/export/story-export';
import { useStore } from '../../state/store';
import { StudioWorkspaceMonitor } from './StudioWorkspaceMonitor';
import { StudioProgramMonitor } from './StudioProgramMonitor';

interface StudioTimelineProps {
  isOpen: boolean;
  story: StoryProject;
  worldName: string;
  map: any;
  currentTime: number;
  setCurrentTime: (year: number) => void;
  onClose: () => void;
  onExportTimeline: (timeline: EditTimeline, fps: number, includeLegend: boolean) => void;
  onSaveProject?: (timeline: EditTimeline) => void;
}

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  isOpen,
  story,
  worldName,
  map,
  setCurrentTime,
  onClose,
  onExportTimeline,
  onSaveProject,
}) => {
  // Timeline state
  const [timeline, setTimeline] = useState<EditTimeline>(() => {
    return (story as any).editTimeline || createDefaultEditTimeline(story);
  });

  const [playheadMs, setPlayheadMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(60); // Pixels par seconde (20 à 150)
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Studio Clipboard & Toast Notification
  const [clipboard, setClipboard] = useState<StudioClipboardItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2400);
  }, []);

  // Audio preview references
  const audioHandlesRef = useRef<{ stop: () => void }[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartPlayheadRef = useRef<number>(0);

  // Timeline viewport & ruler refs
  const timelineTracksRef = useRef<HTMLDivElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state for clips and resize
  const [resizingClip, setResizingClip] = useState<{
    id: string;
    type: 'video' | 'audio';
    side: 'left' | 'right';
    startX: number;
    initialStartMs: number;
    initialDurationMs: number;
    initialTrimStartMs?: number;
    initialTrimEndMs?: number;
  } | null>(null);

  const [movingClip, setMovingClip] = useState<{
    id: string;
    type: 'video' | 'audio';
    startX: number;
    initialStartMs: number;
  } | null>(null);

  const totalDurationMs = useMemo(() => {
    return computeTotalTimelineDuration(timeline);
  }, [timeline]);

  const { studioLayoutMode, setStudioLayoutMode, world, basemapStyle } = useStore();
  const liveEntities = world?.entities || [];

  const [includeLegend, setIncludeLegend] = useState<boolean>(true);
  const [show16x9Guides, setShow16x9Guides] = useState<boolean>(false);

  const activeClip = useMemo(() => {
    return getVideoClipAtTime(timeline, playheadMs, true);
  }, [timeline, playheadMs]);

  const selectedClip = useMemo(() => {
    if (selectedClipId) {
      const found = timeline.videoTracks.find(c => c.id === selectedClipId);
      if (found) return found;
    }
    return activeClip;
  }, [selectedClipId, timeline.videoTracks, activeClip]);

  const handleSaveClipCamera = useCallback((clipId: string, mapState: any) => {
    setTimeline(prev => ({
      ...prev,
      videoTracks: prev.videoTracks.map(c => c.id === clipId ? { ...c, mapState } : c)
    }));
    showToast('Cadrage enregistré pour ce plan !');
  }, [showToast]);

  const handleResetClipCamera = useCallback((clipId: string) => {
    const clip = timeline.videoTracks.find(c => c.id === clipId);
    if (!clip || !map) return;
    const scene = story.scenes.find(s => s.id === clip.sceneId);
    const targetMapState = scene?.mapState || clip.mapState;
    if (targetMapState && typeof map.jumpTo === 'function') {
      const targetBearing = getEffectiveStyleBearing(targetMapState.basemapStyle || clip.mapState?.basemapStyle || basemapStyle, targetMapState.bearing);
      map.jumpTo({
        center: targetMapState.center,
        zoom: targetMapState.zoom,
        bearing: targetBearing,
        pitch: targetMapState.pitch ?? 0,
      });
      showToast(`Cadrage réinitialisé${targetBearing === 180 ? ' (Orientation Sud 180°)' : ''}.`);
    }
  }, [timeline.videoTracks, story.scenes, map, basemapStyle, showToast]);

  // Synchronise le cadrage de la carte lorsque le playhead change
  const syncMapToPlayhead = useCallback((timeMs: number) => {
    const clip = getVideoClipAtTime(timeline, timeMs);
    if (!clip || !map) return;

    if (clip.timelineYear !== undefined) {
      setCurrentTime(clip.timelineYear);
    }

    if (clip.mapState) {
      if (typeof map.jumpTo === 'function') {
        const targetBearing = getEffectiveStyleBearing(clip.mapState.basemapStyle || basemapStyle, clip.mapState.bearing);
        map.jumpTo({
          center: clip.mapState.center,
          zoom: clip.mapState.zoom,
          bearing: targetBearing,
          pitch: clip.mapState.pitch ?? 0,
        });
      }
    }
  }, [timeline, map, setCurrentTime, basemapStyle]);

  // Préservation orientation Al-Idrisi (180° Sud en haut) à l'ouverture du mode CapCut / Studio
  useEffect(() => {
    if (!isOpen || !map) return;
    if (basemapStyle === 'al_idrisi') {
      const currentBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0;
      if (Math.abs(Math.abs(currentBearing) - 180) > 5) {
        if (typeof map.rotateTo === 'function') {
          map.rotateTo(180, { duration: 400 });
        } else if (typeof map.setBearing === 'function') {
          map.setBearing(180);
        }
      }
    }
  }, [isOpen, map, basemapStyle]);

  // Sauvegarde du projet vidéo dans le LocalStorage et mise à jour de l'état parent
  const handleSaveProject = useCallback(() => {
    try {
      const updatedStory: StoryProject = {
        ...story,
        editTimeline: timeline,
      };
      saveStoryToStorage(updatedStory);
      if (onSaveProject) {
        onSaveProject(timeline);
      }
      showToast('💾 Projet vidéo sauvegardé avec succès !');
    } catch (err) {
      console.error('Erreur sauvegarde projet vidéo:', err);
      showToast('❌ Échec de la sauvegarde du projet.');
    }
  }, [story, timeline, onSaveProject, showToast]);

  // Exporte le projet au format fichier JSON (.json)
  const handleExportProjectFile = useCallback(() => {
    try {
      const exportData = {
        format: 'braudel-studio-project',
        version: 1,
        exportedAt: new Date().toISOString(),
        worldName,
        storyId: story.id,
        storyTitle: story.title,
        timeline,
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeWorld = worldName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      a.href = url;
      a.download = `projet_video_${safeWorld}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📥 Fichier projet vidéo exporté (.json) !');
    } catch (err) {
      console.error('Erreur export fichier projet:', err);
      showToast('❌ Échec de l\'export du fichier projet.');
    }
  }, [worldName, story.id, story.title, timeline, showToast]);

  // Chargement d'un projet vidéo depuis un fichier JSON
  const handleImportProjectFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const importedTimeline: EditTimeline = parsed.timeline || parsed.editTimeline || (Array.isArray(parsed.videoTracks) ? parsed : null);
        if (!importedTimeline || !Array.isArray(importedTimeline.videoTracks)) {
          throw new Error('Structure de projet vidéo invalide.');
        }

        setTimeline(importedTimeline);
        setPlayheadMs(0);
        syncMapToPlayhead(0);

        const updatedStory: StoryProject = {
          ...story,
          editTimeline: importedTimeline,
        };
        saveStoryToStorage(updatedStory);
        if (onSaveProject) {
          onSaveProject(importedTimeline);
        }

        showToast(`📂 Projet vidéo chargé (${importedTimeline.videoTracks.length} plans) !`);
      } catch (err) {
        console.error('Erreur import projet JSON:', err);
        showToast('❌ Fichier projet JSON invalide ou corrompu.');
      } finally {
        if (projectFileInputRef.current) {
          projectFileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  }, [story, onSaveProject, syncMapToPlayhead, showToast]);

  // Arrêt de toute prévisualisation audio
  const stopAllAudioPreviews = useCallback(() => {
    for (const handle of audioHandlesRef.current) {
      try { handle.stop(); } catch { /* ignore */ }
    }
    audioHandlesRef.current = [];
  }, []);

  // Démarre la prévisualisation audio synchronisée au point d'écoute
  const startAudioPreviewsAt = useCallback((timeMs: number) => {
    stopAllAudioPreviews();
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    for (const aClip of timeline.audioTracks) {
      if (aClip.muted || !aClip.audioBuffer) continue;
      const start = aClip.startMs ?? 0;
      if (timeMs >= start && timeMs < start + aClip.durationMs) {
        const handle = playAudioPreview(aClip, aClip.audioBuffer, timeMs, undefined, ctx);
        audioHandlesRef.current.push(handle);
      }
    }
  }, [timeline.audioTracks, stopAllAudioPreviews]);

  // Lecture / Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAllAudioPreviews();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      let startFromMs = playheadMs;
      if (startFromMs >= totalDurationMs) {
        startFromMs = 0;
        setPlayheadMs(0);
      }
      setIsPlaying(true);
      playbackStartTimeRef.current = performance.now();
      playbackStartPlayheadRef.current = startFromMs;
      startAudioPreviewsAt(startFromMs);

      const loop = (now: number) => {
        const elapsed = now - playbackStartTimeRef.current;
        const nextMs = playbackStartPlayheadRef.current + elapsed;

        if (nextMs >= totalDurationMs) {
          setPlayheadMs(totalDurationMs);
          setIsPlaying(false);
          stopAllAudioPreviews();
          syncMapToPlayhead(totalDurationMs);
          return;
        }

        setPlayheadMs(nextMs);
        syncMapToPlayhead(nextMs);
        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);
    }
  }, [isPlaying, playheadMs, totalDurationMs, startAudioPreviewsAt, stopAllAudioPreviews, syncMapToPlayhead]);

  const handleRewind = useCallback(() => {
    setIsPlaying(false);
    stopAllAudioPreviews();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setPlayheadMs(0);
    syncMapToPlayhead(0);
  }, [stopAllAudioPreviews, syncMapToPlayhead]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopAllAudioPreviews();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stopAllAudioPreviews]);

  // Opérations de Montage : Split (Scinder)
  const handleSplitAtPlayhead = useCallback(() => {
    let targetClipId = selectedClipId;
    if (!targetClipId) {
      const activeClip = getVideoClipAtTime(timeline, playheadMs);
      if (activeClip) {
        targetClipId = activeClip.id;
      }
    }

    if (!targetClipId) {
      showToast('Sélectionnez un clip ou placez le playhead dessus pour scinder');
      return;
    }

    const updated = splitClipAtTime(timeline, targetClipId, playheadMs);
    if (updated !== timeline) {
      setTimeline(updated);
      showToast('✂️ Clip scindé en 2');
    } else {
      showToast('Positionnez le playhead à l\'intérieur du clip pour le scinder');
    }
  }, [timeline, selectedClipId, playheadMs, showToast]);

  // Opérations de Montage : Copier
  const handleCopy = useCallback(() => {
    if (!selectedClipId) {
      showToast('Sélectionnez un clip pour le copier');
      return;
    }
    const item = copyClip(timeline, selectedClipId);
    if (item) {
      setClipboard(item);
      const title = (item.clip as any).title || (item.clip as any).name || 'Clip';
      showToast(`📋 Copié : ${title}`);
    }
  }, [timeline, selectedClipId, showToast]);

  // Opérations de Montage : Couper
  const handleCut = useCallback(() => {
    if (!selectedClipId) {
      showToast('Sélectionnez un clip pour le couper');
      return;
    }
    const { updatedTimeline, clipboardItem } = cutClip(timeline, selectedClipId);
    if (clipboardItem) {
      setTimeline(updatedTimeline);
      setClipboard(clipboardItem);
      setSelectedClipId(null);
      const title = (clipboardItem.clip as any).title || (clipboardItem.clip as any).name || 'Clip';
      showToast(`✂️ Coupé : ${title}`);
    }
  }, [timeline, selectedClipId, showToast]);

  // Opérations de Montage : Coller
  const handlePaste = useCallback(() => {
    if (!clipboard) {
      showToast('Presse-papiers vide (Copiez ou Coupez d\'abord un élément)');
      return;
    }
    const updated = pasteClip(timeline, playheadMs, clipboard);
    setTimeline(updated);
    showToast(`📥 Collé à la position courante`);
  }, [timeline, playheadMs, clipboard, showToast]);

  // Suppression d'un clip
  const handleDeleteClip = useCallback((id: string, type: 'video' | 'audio') => {
    if (type === 'video') {
      if (timeline.videoTracks.length <= 1) {
        alert('La timeline doit conserver au moins une période ou un média vidéo.');
        return;
      }
      setTimeline(prev => {
        const updated = prev.videoTracks.filter(c => c.id !== id);
        return {
          ...prev,
          videoTracks: resolveTrackOverlaps(updated),
          totalDurationMs: computeTotalTimelineDuration({ ...prev, videoTracks: updated })
        };
      });
    } else {
      setTimeline(prev => {
        const updated = prev.audioTracks.filter(a => a.id !== id);
        return {
          ...prev,
          audioTracks: updated,
          totalDurationMs: computeTotalTimelineDuration({ ...prev, audioTracks: updated })
        };
      });
    }
    if (selectedClipId === id) setSelectedClipId(null);
    showToast('🗑️ Clip supprimé');
  }, [timeline.videoTracks.length, selectedClipId, showToast]);

  // Raccourcis clavier globaux
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          handleSaveProject();
        } else {
          handleSplitAtPlayhead();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          const isV = timeline.videoTracks.some(c => c.id === selectedClipId);
          handleDeleteClip(selectedClipId, isV ? 'video' : 'audio');
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSaveProject, handleSplitAtPlayhead, handleCopy, handleCut, handlePaste, selectedClipId, timeline.videoTracks, handleDeleteClip, togglePlay]);

  // Écouteurs globaux de souris pour le drag & resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingClip) {
        const deltaX = e.clientX - resizingClip.startX;
        const deltaMs = Math.round((deltaX / zoomScale) * 1000);

        if (resizingClip.type === 'video') {
          setTimeline(prev => {
            const updated = prev.videoTracks.map(c => {
              if (c.id !== resizingClip.id) return c;
              if (resizingClip.side === 'right') {
                const newDuration = Math.max(500, resizingClip.initialDurationMs + deltaMs);
                const trimDelta = resizingClip.initialDurationMs - newDuration;
                const newTrimEnd = Math.max(0, (resizingClip.initialTrimEndMs || 0) + trimDelta);
                return { ...c, durationMs: newDuration, trimEndMs: newTrimEnd };
              } else {
                // Resize left (Crop In)
                const clampedDeltaMs = Math.min(deltaMs, resizingClip.initialDurationMs - 500);
                const newStart = Math.max(0, resizingClip.initialStartMs + clampedDeltaMs);
                const newDuration = Math.max(500, resizingClip.initialDurationMs - clampedDeltaMs);
                const newTrimStart = Math.max(0, (resizingClip.initialTrimStartMs || 0) + clampedDeltaMs);
                return { ...c, startMs: newStart, durationMs: newDuration, trimStartMs: newTrimStart };
              }
            });
            return {
              ...prev,
              videoTracks: resolveTrackOverlaps(updated),
              totalDurationMs: computeTotalTimelineDuration({ ...prev, videoTracks: updated })
            };
          });
        } else if (resizingClip.type === 'audio') {
          setTimeline(prev => {
            const updated = prev.audioTracks.map(a => {
              if (a.id !== resizingClip.id) return a;
              if (resizingClip.side === 'right') {
                const newDuration = Math.max(300, resizingClip.initialDurationMs + deltaMs);
                const trimDelta = resizingClip.initialDurationMs - newDuration;
                const newTrimEnd = Math.max(0, (resizingClip.initialTrimEndMs || 0) + trimDelta);
                return { ...a, durationMs: newDuration, trimEndMs: newTrimEnd };
              } else {
                const clampedDeltaMs = Math.min(deltaMs, resizingClip.initialDurationMs - 300);
                const newStart = Math.max(0, resizingClip.initialStartMs + clampedDeltaMs);
                const newDuration = Math.max(300, resizingClip.initialDurationMs - clampedDeltaMs);
                const newTrimStart = Math.max(0, (resizingClip.initialTrimStartMs || 0) + clampedDeltaMs);
                return { ...a, startMs: newStart, durationMs: newDuration, trimStartMs: newTrimStart };
              }
            });
            return {
              ...prev,
              audioTracks: updated,
              totalDurationMs: computeTotalTimelineDuration({ ...prev, audioTracks: updated })
            };
          });
        }
      } else if (movingClip) {
        const deltaX = e.clientX - movingClip.startX;
        const deltaMs = Math.round((deltaX / zoomScale) * 1000);
        const newStartMs = Math.max(0, movingClip.initialStartMs + deltaMs);

        if (movingClip.type === 'video') {
          setTimeline(prev => {
            const updated = prev.videoTracks.map(c => {
              if (c.id !== movingClip.id) return c;
              return { ...c, startMs: newStartMs };
            });
            return {
              ...prev,
              videoTracks: resolveTrackOverlaps(updated),
              totalDurationMs: computeTotalTimelineDuration({ ...prev, videoTracks: updated })
            };
          });
        } else if (movingClip.type === 'audio') {
          setTimeline(prev => {
            const updated = prev.audioTracks.map(a => {
              if (a.id !== movingClip.id) return a;
              return { ...a, startMs: newStartMs };
            });
            return {
              ...prev,
              audioTracks: updated,
              totalDurationMs: computeTotalTimelineDuration({ ...prev, audioTracks: updated })
            };
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (resizingClip || movingClip) {
        setResizingClip(null);
        setMovingClip(null);
      }
    };

    if (resizingClip || movingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingClip, movingClip, zoomScale]);

  // Importation de fichier audio
  const handleAudioFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const isVoice = file.name.toLowerCase().includes('voix') || file.name.toLowerCase().includes('voice');
      const newClip = await createAudioClipFromFile(file, isVoice ? 'voice' : 'music', playheadMs);

      setTimeline(prev => {
        const updatedAudio = [...prev.audioTracks, newClip];
        return {
          ...prev,
          audioTracks: updatedAudio,
          totalDurationMs: computeTotalTimelineDuration({ ...prev, audioTracks: updatedAudio })
        };
      });
      setSelectedClipId(newClip.id);
      showToast(`Piste audio importée : ${file.name}`);
    } catch (err) {
      alert(`Erreur d'importation audio : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    }
  };

  // Importation d'images ou vidéos externes
  const handleMediaFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const newClip = await importMediaFile(file, playheadMs);
      setTimeline(prev => {
        const updated = [...prev.videoTracks, newClip];
        const resolved = resolveTrackOverlaps(updated);
        return {
          ...prev,
          videoTracks: resolved,
          totalDurationMs: computeTotalTimelineDuration({ ...prev, videoTracks: resolved })
        };
      });
      setSelectedClipId(newClip.id);
      showToast(`Média importé : ${file.name}`);
    } catch (err) {
      alert(`Erreur d'importation média : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
    }
  };

  // Insertion d'une scène depuis la bibliothèque
  const handleInsertScene = (scene: StoryScene) => {
    const endOfVideo = timeline.videoTracks.reduce((max, c) => Math.max(max, (c.startMs ?? 0) + c.durationMs), 0);
    const pNum = timeline.videoTracks.length + 1;
    const newClip: VideoClip = {
      id: `clip-${scene.id}-${Date.now()}`,
      sceneId: scene.id,
      trackIndex: 0,
      startMs: endOfVideo,
      durationMs: 3500,
      title: scene.title || `Période ${pNum}`,
      periodNumber: pNum,
      totalPeriods: pNum,
      timelineYear: scene.mapState?.timelineYear,
      mapState: scene.mapState,
      transition: scene.transition,
      mediaType: 'map',
      trimStartMs: 0,
      trimEndMs: 0
    };

    setTimeline(prev => {
      const updated = [...prev.videoTracks, newClip];
      return {
        ...prev,
        videoTracks: resolveTrackOverlaps(updated),
        totalDurationMs: computeTotalTimelineDuration({ ...prev, videoTracks: updated })
      };
    });
    showToast(`Scène insérée : ${scene.title || 'Nouvelle période'}`);
  };

  // Mise à jour du volume audio
  const handleUpdateVolume = (clipId: string, volume: number) => {
    setTimeline(prev => ({
      ...prev,
      audioTracks: prev.audioTracks.map(a => a.id === clipId ? { ...a, volume } : a)
    }));
  };

  // Toggle Mute audio
  const handleToggleMute = (clipId: string) => {
    setTimeline(prev => ({
      ...prev,
      audioTracks: prev.audioTracks.map(a => a.id === clipId ? { ...a, muted: !a.muted } : a)
    }));
  };

  if (!isOpen) return null;

  const formatMs = (ms: number) => {
    const totalSec = Math.max(0, ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    const dec = Math.floor((totalSec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${dec}`;
  };

  const timelineWidthPx = Math.max(1200, (totalDurationMs / 1000) * zoomScale + 300);

  const content = (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      pointerEvents: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* 1. Barre Flottante Supérieure (HUD Top Bar) */}
      <div style={{
        pointerEvents: 'auto',
        margin: '14px 20px 0 20px',
        height: '52px',
        padding: '0 18px',
        background: 'rgba(9, 13, 24, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Titre & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(56,189,248,0.25))',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(168,85,247,0.5)'
          }}>
            <Film size={18} color="#c084fc" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px', color: '#f8fafc' }}>
              STUDIO RÉALISATION
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Récit : <strong style={{ color: '#f8fafc' }}>{worldName}</strong>
          </span>
        </div>

        {/* Transport & Timecode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '5px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontFamily: 'monospace',
            fontSize: '0.95rem'
          }}>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{formatMs(playheadMs)}</span>
            <span style={{ color: '#64748b' }}>/</span>
            <span style={{ color: '#94a3b8' }}>{formatMs(totalDurationMs)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleRewind}
              className="btn btn-secondary"
              title="Retour au début (0:00)"
              style={{ padding: '8px', borderRadius: '8px', color: '#f8fafc' }}
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={togglePlay}
              className="btn btn-primary"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isPlaying ? '#ea580c' : 'linear-gradient(135deg, #9333ea, #7c3aed)',
                borderColor: isPlaying ? '#c2410c' : '#7e22ce',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#ffffff',
                boxShadow: isPlaying ? '0 0 12px rgba(234, 88, 12, 0.5)' : '0 0 12px rgba(147, 51, 234, 0.5)'
              }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
            <button
              onClick={() => setZoomScale(prev => Math.max(20, prev - 15))}
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '6px' }}
              title="Dézoomer la timeline"
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              min="20"
              max="150"
              value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
              style={{ width: '70px', accentColor: '#a855f7', cursor: 'pointer' }}
              title="Échelle temporelle"
            />
            <button
              onClick={() => setZoomScale(prev => Math.min(150, prev + 15))}
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '6px' }}
              title="Zoomer la timeline"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* Actions d'Import, Export & Bouton Croix Retour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* File input pour audio */}
          <input
            type="file"
            ref={audioFileInputRef}
            onChange={handleAudioFileSelected}
            accept="audio/*"
            style={{ display: 'none' }}
          />

          {/* File input pour images & vidéos externes */}
          <input
            type="file"
            ref={mediaFileInputRef}
            onChange={handleMediaFileSelected}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />

          <button
            onClick={() => mediaFileInputRef.current?.click()}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              borderRadius: '8px'
            }}
            title="Importer une image (PNG/JPEG/WebP) ou une vidéo (MP4/WebM)"
          >
            <ImageIcon size={14} /> Importer Média
          </button>

          <button
            onClick={() => audioFileInputRef.current?.click()}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#c084fc',
              borderRadius: '8px'
            }}
            title="Importer une musique de fond ou une voix off"
          >
            <Music size={14} /> Audio
          </button>

          <button
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
          >
            <Layers size={14} /> Scènes ({story.scenes.length})
            {isLibraryOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button
            onClick={() => setStudioLayoutMode(studioLayoutMode === 'dual' ? 'single' : 'dual')}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              color: '#38bdf8',
            }}
            title={studioLayoutMode === 'dual' ? 'Passer en Moniteur Unique Plein Format' : 'Basculer en 2 Écrans (Atelier + Programme)'}
          >
            {studioLayoutMode === 'dual' ? '2 Écrans' : '1 Écran'}
          </button>

          {/* Groupe Sauvegarde & Fichiers Projet Vidéo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleSaveProject}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Sauvegarder le projet vidéo dans le navigateur (Ctrl+S)"
            >
              <Save size={14} /> Sauvegarder Projet
            </button>

            <button
              onClick={handleExportProjectFile}
              className="btn btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#cbd5e1',
                cursor: 'pointer'
              }}
              title="Télécharger une copie de sauvegarde .json du projet vidéo"
            >
              <FileDown size={14} /> Export JSON
            </button>

            <button
              onClick={() => projectFileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#cbd5e1',
                cursor: 'pointer'
              }}
              title="Ouvrir un projet vidéo depuis un fichier .json"
            >
              <FolderOpen size={14} /> Ouvrir JSON
            </button>
            <input
              ref={projectFileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportProjectFile}
            />
          </div>

          <button
            onClick={() => onExportTimeline(timeline, 30, true)}
            className="btn btn-primary"
            style={{
              padding: '6px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#047857',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ffffff',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Download size={15} /> Générer Vidéo ({timeline.videoTracks.length} plans)
          </button>

          {/* Bouton CROIX pour retour à la carte normale */}
          <button
            onClick={onClose}
            className="btn"
            title="Quitter le Mode Studio (Échap)"
            style={{
              padding: '7px 9px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.35)';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.15)';
              (e.currentTarget as HTMLElement).style.color = '#f87171';
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Zone Centrale : 2 Écrans Horizontaux (Atelier de Cadrage à Gauche + Résultat du Montage à Droite) */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: studioLayoutMode === 'single' ? '1fr' : '1fr 1fr',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
        height: 'calc(100vh - 52px - 340px)',
        minHeight: '260px'
      }}>
        {/* Écran 1 (Gauche) : Atelier de Cadrage & Source */}
        {studioLayoutMode === 'dual' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <StudioWorkspaceMonitor
              selectedClip={selectedClip ?? null}
              map={map}
              onSaveCamera={handleSaveClipCamera}
              onResetCamera={handleResetClipCamera}
            />
          </div>
        )}

        {/* Écran 2 (Droite) : Moniteur Programme 16:9 WYSIWYG */}
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'auto' }}>
          <StudioProgramMonitor
            activeClip={activeClip ?? null}
            playheadMs={playheadMs}
            isPlaying={isPlaying}
            map={map}
            entities={liveEntities}
            includeLegend={includeLegend}
            onToggleIncludeLegend={() => setIncludeLegend(prev => !prev)}
            show16x9Guides={show16x9Guides}
            onToggle16x9Guides={() => setShow16x9Guides(prev => !prev)}
            studioLayoutMode={studioLayoutMode}
            onToggleLayoutMode={() => setStudioLayoutMode(studioLayoutMode === 'dual' ? 'single' : 'dual')}
          />
        </div>
      </div>

      {/* 2. Panneau Flottant Bibliothèque de Scènes (si ouvert) */}
      {isLibraryOpen && (
        <div style={{
          pointerEvents: 'auto',
          position: 'fixed',
          right: '20px',
          bottom: '365px',
          width: '320px',
          maxHeight: '380px',
          background: 'rgba(9, 14, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Bibliothèque des Scènes</span>
            <button
              onClick={() => setIsLibraryOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {story.scenes.map((sc, idx) => (
              <div
                key={sc.id || idx}
                style={{
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>
                    Période #{sc.periodNumber || (idx + 1)}
                  </span>
                  <button
                    onClick={() => handleInsertScene(sc)}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#38bdf8' }}
                    title="Ajouter cette scène à la fin de la timeline"
                  >
                    <Plus size={12} /> Insérer
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sc.title || `Scène ${idx + 1}`}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  {sc.mapState?.timelineYear !== undefined ? `An ${sc.mapState.timelineYear}` : 'Sans date'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Dock Inférieur Pleine Largeur (Bottom Dock Timeline) */}
      <div style={{
        pointerEvents: 'auto',
        height: '340px',
        width: '100%',
        background: 'rgba(9, 13, 24, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '2px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 -16px 40px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 30
      }}>
        {/* En-tête du Dock & Barre d'Outils de Montage */}
        <div style={{
          height: '36px',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#070b14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#94a3b8',
          flexShrink: 0
        }}>
          {/* Outils de Montage : Split, Copier, Couper, Coller, Supprimer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#c084fc', marginRight: '6px' }}>MONTAGE :</span>

            {/* Bouton Scinder / Split */}
            <button
              onClick={handleSplitAtPlayhead}
              className="btn btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#38bdf8',
                borderRadius: '6px'
              }}
              title="Scinder le clip à la position du playhead (Raccourci: S)"
            >
              <Scissors size={13} /> Scinder (S)
            </button>

            {/* Bouton Copier */}
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '6px',
                opacity: selectedClipId ? 1 : 0.6
              }}
              title="Copier le clip sélectionné (Ctrl+C)"
            >
              <Copy size={13} /> Copier
            </button>

            {/* Bouton Couper */}
            <button
              onClick={handleCut}
              className="btn btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '6px',
                opacity: selectedClipId ? 1 : 0.6
              }}
              title="Couper le clip sélectionné (Ctrl+X)"
            >
              <Scissors size={13} /> Couper
            </button>

            {/* Bouton Coller */}
            <button
              onClick={handlePaste}
              className="btn btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: clipboard ? '#10b981' : '#64748b',
                borderColor: clipboard ? 'rgba(16, 185, 129, 0.4)' : undefined,
                borderRadius: '6px',
                opacity: clipboard ? 1 : 0.5
              }}
              title={clipboard ? `Coller ${clipboard.type} au playhead (Ctrl+V)` : 'Presse-papiers vide'}
            >
              <ClipboardPaste size={13} /> Coller {clipboard ? `(${clipboard.type})` : ''}
            </button>

            {/* Bouton Supprimer */}
            <button
              onClick={() => {
                if (selectedClipId) {
                  const isV = timeline.videoTracks.some(c => c.id === selectedClipId);
                  handleDeleteClip(selectedClipId, isV ? 'video' : 'audio');
                }
              }}
              className="btn btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: selectedClipId ? '#ef4444' : '#64748b',
                borderRadius: '6px',
                opacity: selectedClipId ? 1 : 0.5
              }}
              title="Supprimer le clip sélectionné (Suppr)"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>

          {/* Toast de confirmation au centre ou à droite */}
          {toastMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              padding: '2px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              <CheckCircle2 size={13} />
              <span>{toastMessage}</span>
            </div>
          )}

          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Raccourcis : <strong>S</strong> scinder • <strong>Ctrl+C/X/V</strong> copier/coller • <strong>Espace</strong> lecture • <strong>Échap</strong> fermer
          </div>
        </div>

        {/* Timeline Scrollable Canvas */}
        <div 
          ref={timelineTracksRef}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            background: '#0b1120',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => {
            const rect = timelineTracksRef.current?.getBoundingClientRect();
            if (!rect) return;
            const clickX = e.clientX - rect.left + (timelineTracksRef.current?.scrollLeft || 0) - 180;
            if (clickX >= 0) {
              const clickedMs = Math.round((clickX / zoomScale) * 1000);
              const clampedMs = Math.max(0, Math.min(totalDurationMs, clickedMs));
              setPlayheadMs(clampedMs);
              syncMapToPlayhead(clampedMs);
              if (isPlaying) {
                playbackStartTimeRef.current = performance.now();
                playbackStartPlayheadRef.current = clampedMs;
                startAudioPreviewsAt(clampedMs);
              }
            }
          }}
        >
          <div style={{ width: `${timelineWidthPx}px`, minHeight: '100%', position: 'relative' }}>
            {/* Règle temporelle (Time Ruler) */}
            <div style={{
              height: '30px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#090e1a',
              display: 'flex',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              paddingLeft: '180px'
            }}>
              {Array.from({ length: Math.ceil(totalDurationMs / 1000) + 10 }).map((_, sec) => {
                const x = sec * zoomScale;
                return (
                  <div
                    key={sec}
                    style={{
                      position: 'absolute',
                      left: `${x + 180}px`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      borderLeft: sec % 5 === 0 ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.65rem',
                      color: '#64748b',
                      paddingLeft: '4px',
                      paddingTop: '2px',
                    }}
                  >
                    {sec % (zoomScale < 40 ? 5 : 1) === 0 ? `${sec}s` : ''}
                  </div>
                );
              })}
            </div>

            {/* Curseur de lecture (Playhead Indicator) */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${180 + (playheadMs / 1000) * zoomScale}px`,
              width: '2px',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
              zIndex: 50,
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-6px',
                width: '14px',
                height: '14px',
                background: '#38bdf8',
                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
              }} />
            </div>

            {/* Piste Vidéo Principale (Cartes, Images & Vidéos Externes) */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              minHeight: '102px',
              background: 'rgba(255, 255, 255, 0.01)',
              position: 'relative'
            }}>
              {/* En-tête fixe de piste */}
              <div style={{
                width: '180px',
                padding: '8px 12px',
                background: '#0d1527',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 20
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#c084fc' }}>
                    <Film size={14} /> Piste Vidéo
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                    {timeline.videoTracks.length} plans (cartes, images, vidéos)
                  </div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  Étirer les bords pour crop / durée
                </div>
              </div>

              {/* Voie des clips vidéo */}
              <div style={{ flex: 1, position: 'relative', height: '102px', padding: '8px 0' }}>
                {timeline.videoTracks.map((clip) => {
                  const clipStart = clip.startMs ?? 0;
                  const clipLeft = (clipStart / 1000) * zoomScale;
                  const clipWidth = Math.max(30, (clip.durationMs / 1000) * zoomScale);
                  const isSelected = selectedClipId === clip.id;
                  const mType = clip.mediaType || 'map';

                  // Couleurs et icônes différenciées par type de média
                  let typeColor = '#c084fc';
                  let typeBorder = isSelected ? '#38bdf8' : 'rgba(168, 85, 247, 0.5)';
                  let typeIcon = <Film size={12} color="#c084fc" />;
                  let typeLabel = clip.periodNumber ? `#${clip.periodNumber}` : 'Carte';

                  if (mType === 'image') {
                    typeColor = '#38bdf8';
                    typeBorder = isSelected ? '#ffffff' : 'rgba(56, 189, 248, 0.6)';
                    typeIcon = <ImageIcon size={12} color="#38bdf8" />;
                    typeLabel = 'Image';
                  } else if (mType === 'video') {
                    typeColor = '#fbbf24';
                    typeBorder = isSelected ? '#ffffff' : 'rgba(251, 191, 36, 0.6)';
                    typeIcon = <VideoIcon size={12} color="#fbbf24" />;
                    typeLabel = 'Vidéo';
                  }

                  const hasTrim = (clip.trimStartMs && clip.trimStartMs > 0) || (clip.trimEndMs && clip.trimEndMs > 0);

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(clip.id);
                        setPlayheadMs(clipStart);
                        syncMapToPlayhead(clipStart);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                        height: '84px',
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(15, 23, 42, 0.98))'
                          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.98))',
                        border: `1.5px solid ${typeBorder}`,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        cursor: 'grab',
                        boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.5)' : '0 4px 8px rgba(0,0,0,0.35)',
                        overflow: 'hidden',
                        transition: 'border-color 0.15s ease, background 0.15s ease',
                      }}
                      onMouseDown={(e) => {
                        if ((e.target as HTMLElement).dataset.handle) return;
                        setMovingClip({
                          id: clip.id,
                          type: 'video',
                          startX: e.clientX,
                          initialStartMs: clipStart
                        });
                      }}
                    >
                      {/* Poignée Redimensionnement / Crop In (Bord Gauche) */}
                      <div
                        data-handle="left"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingClip({
                            id: clip.id,
                            type: 'video',
                            side: 'left',
                            startX: e.clientX,
                            initialStartMs: clipStart,
                            initialDurationMs: clip.durationMs,
                            initialTrimStartMs: clip.trimStartMs,
                            initialTrimEndMs: clip.trimEndMs
                          });
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '10px',
                          cursor: 'ew-resize',
                          background: 'rgba(168, 85, 247, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Crop temporel d'entrée (In-point)"
                      >
                        <div style={{ width: '2px', height: '22px', background: typeColor, borderRadius: '1px' }} />
                      </div>

                      {/* En-tête du bloc */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {typeIcon}
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: typeColor }}>
                            {typeLabel}
                          </span>
                        </div>
                        {clip.timelineYear !== undefined && (
                          <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', color: '#94a3b8' }}>
                            {clip.timelineYear < 0 ? `${Math.abs(clip.timelineYear)} av. J.-C.` : `An ${clip.timelineYear}`}
                          </span>
                        )}
                      </div>

                      {/* Titre & Aperçu Miniature si image/vidéo */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0 8px',
                        overflow: 'hidden'
                      }}>
                        {mType === 'image' && clip.mediaUrl && (
                          <img 
                            src={clip.mediaUrl} 
                            alt="" 
                            style={{ width: '24px', height: '18px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} 
                          />
                        )}
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {clip.title || clip.name || 'Plan vidéo'}
                        </span>
                      </div>

                      {/* Bas du clip : Durée + Crop badge + Bouton suppression */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px', fontSize: '0.65rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{(clip.durationMs / 1000).toFixed(1)}s</span>
                          {hasTrim && (
                            <span style={{ fontSize: '0.6rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                              Crop: {((clip.trimStartMs || 0) / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                        <span
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClip(clip.id, 'video');
                          }}
                          title="Supprimer ce clip"
                        >
                          <Trash2 size={12} color="#ef4444" />
                        </span>
                      </div>

                      {/* Poignée Redimensionnement / Crop Out (Bord Droit) */}
                      <div
                        data-handle="right"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingClip({
                            id: clip.id,
                            type: 'video',
                            side: 'right',
                            startX: e.clientX,
                            initialStartMs: clipStart,
                            initialDurationMs: clip.durationMs,
                            initialTrimStartMs: clip.trimStartMs,
                            initialTrimEndMs: clip.trimEndMs
                          });
                        }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '10px',
                          cursor: 'ew-resize',
                          background: 'rgba(168, 85, 247, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Crop temporel de sortie (Out-point)"
                      >
                        <div style={{ width: '2px', height: '22px', background: typeColor, borderRadius: '1px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pistes Audio (Musique et Voix) */}
            {timeline.audioTracks.map((audioTrack) => {
              const aStart = audioTrack.startMs ?? 0;
              const aLeft = (aStart / 1000) * zoomScale;
              const aWidth = Math.max(30, (audioTrack.durationMs / 1000) * zoomScale);
              const isSelected = selectedClipId === audioTrack.id;

              return (
                <div
                  key={audioTrack.id}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    height: '80px',
                    background: 'rgba(0, 0, 0, 0.15)',
                    position: 'relative'
                  }}
                >
                  {/* En-tête piste audio */}
                  <div style={{
                    width: '180px',
                    padding: '8px 12px',
                    background: '#090e1b',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    position: 'sticky',
                    left: 0,
                    zIndex: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: audioTrack.type === 'music' ? '#c084fc' : '#38bdf8' }}>
                        {audioTrack.type === 'music' ? <Music size={13} /> : <Mic size={13} />}
                        <span>{audioTrack.type === 'music' ? 'Musique' : 'Voix off'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleToggleMute(audioTrack.id)}
                          style={{ background: 'transparent', border: 'none', color: audioTrack.muted ? '#ef4444' : '#94a3b8', cursor: 'pointer', padding: '2px' }}
                          title={audioTrack.muted ? 'Activer le son' : 'Couper le son'}
                        >
                          {audioTrack.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>
                        <button
                          onClick={() => handleDeleteClip(audioTrack.id, 'audio')}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          title="Supprimer la piste audio"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={11} color="#64748b" />
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={audioTrack.volume ?? 1}
                        onChange={(e) => handleUpdateVolume(audioTrack.id, Number(e.target.value))}
                        style={{ width: '100%', height: '4px', accentColor: '#38bdf8', cursor: 'pointer' }}
                        title={`Volume : ${Math.round((audioTrack.volume ?? 1) * 100)}%`}
                      />
                    </div>
                  </div>

                  {/* Voie du clip audio avec Forme d'onde et poignées Crop / Trim */}
                  <div style={{ flex: 1, position: 'relative', height: '80px', padding: '8px 0' }}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(audioTrack.id);
                        setPlayheadMs(aStart);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${aLeft}px`,
                        width: `${aWidth}px`,
                        height: '64px',
                        background: audioTrack.type === 'music'
                          ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.45), rgba(59, 7, 100, 0.65))'
                          : 'linear-gradient(135deg, rgba(3, 105, 161, 0.45), rgba(12, 74, 110, 0.65))',
                        border: `1.5px solid ${isSelected ? '#38bdf8' : audioTrack.type === 'music' ? 'rgba(168, 85, 247, 0.6)' : 'rgba(56, 189, 248, 0.6)'}`,
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        cursor: 'grab',
                        overflow: 'hidden'
                      }}
                      onMouseDown={(e) => {
                        if ((e.target as HTMLElement).dataset.handle) return;
                        setMovingClip({
                          id: audioTrack.id,
                          type: 'audio',
                          startX: e.clientX,
                          initialStartMs: aStart
                        });
                      }}
                    >
                      {/* Poignée Trim Gauche (Crop In) */}
                      <div
                        data-handle="left"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingClip({
                            id: audioTrack.id,
                            type: 'audio',
                            side: 'left',
                            startX: e.clientX,
                            initialStartMs: aStart,
                            initialDurationMs: audioTrack.durationMs,
                            initialTrimStartMs: audioTrack.trimStartMs,
                            initialTrimEndMs: audioTrack.trimEndMs
                          });
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '8px',
                          cursor: 'ew-resize',
                          background: 'rgba(255,255,255,0.2)'
                        }}
                        title="Crop temporel d'entrée (In-point)"
                      />

                      {/* En-tête du clip sonore */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', paddingLeft: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {audioTrack.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {audioTrack.trimStartMs && audioTrack.trimStartMs > 0 && (
                            <span style={{ fontSize: '0.6rem', color: '#38bdf8' }}>
                              +{(audioTrack.trimStartMs / 1000).toFixed(1)}s
                            </span>
                          )}
                          <span style={{ color: '#94a3b8' }}>
                            {(audioTrack.durationMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>

                      {/* Canvas de forme d'onde */}
                      <AudioWaveformView
                        waveformData={audioTrack.waveformData || []}
                        width={Math.max(20, aWidth - 16)}
                        height={30}
                        color={audioTrack.type === 'music' ? '#c084fc' : '#38bdf8'}
                      />

                      {/* Poignée Trim Droite (Crop Out) */}
                      <div
                        data-handle="right"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingClip({
                            id: audioTrack.id,
                            type: 'audio',
                            side: 'right',
                            startX: e.clientX,
                            initialStartMs: aStart,
                            initialDurationMs: audioTrack.durationMs,
                            initialTrimStartMs: audioTrack.trimStartMs,
                            initialTrimEndMs: audioTrack.trimEndMs
                          });
                        }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '8px',
                          cursor: 'ew-resize',
                          background: 'rgba(255,255,255,0.2)'
                        }}
                        title="Crop temporel de sortie (Out-point)"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bouton d'ajout de piste audio si aucune */}
            {timeline.audioTracks.length === 0 && (
              <div style={{
                padding: '12px 20px',
                paddingLeft: '200px',
                fontSize: '0.8rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>Aucune piste audio synchronisée.</span>
                <button
                  onClick={() => audioFileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#38bdf8' }}
                >
                  <Plus size={13} /> Ajouter de la musique ou une voix off
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};

/**
 * Composant de rendu canvas ultra-léger pour la forme d'onde d'un clip sonore
 */
const AudioWaveformView: React.FC<{
  waveformData: number[];
  width: number;
  height: number;
  color?: string;
}> = ({ waveformData, width, height, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWaveformOnCanvas(ctx, waveformData, width, height, {
      barColor: color || 'rgba(168, 85, 247, 0.75)',
    });
  }, [waveformData, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      width={Math.max(10, Math.floor(width))}
      height={height}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
};
