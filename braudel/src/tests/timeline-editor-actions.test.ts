import { describe, it, expect } from 'vitest';
import { 
  splitClipAtTime, 
  copyClip, 
  cutClip, 
  pasteClip, 
  applyCropTemporal 
} from '../services/export/timeline-editor-actions';
import { EditTimeline, VideoClip, AudioClip } from '../services/export/studio-types';
import { importMediaFile } from '../services/export/media-import';

describe('Studio Timeline Editor Actions', () => {
  const sampleVideoClips: VideoClip[] = [
    {
      id: 'clip-1',
      sceneId: 'sc-1',
      trackIndex: 0,
      startMs: 0,
      durationMs: 4000,
      title: 'Scène 1 - Départ',
      mediaType: 'map',
      trimStartMs: 0,
      trimEndMs: 0
    },
    {
      id: 'clip-2',
      sceneId: 'sc-2',
      trackIndex: 0,
      startMs: 4000,
      durationMs: 6000,
      title: 'Scène 2 - Conflit',
      mediaType: 'map',
      trimStartMs: 0,
      trimEndMs: 0
    }
  ];

  const sampleAudioClips: AudioClip[] = [
    {
      id: 'audio-1',
      name: 'Musique de fond',
      type: 'music',
      trackIndex: 0,
      startMs: 0,
      durationMs: 10000,
      sourceDurationMs: 30000,
      trimStartMs: 0,
      trimEndMs: 0
    }
  ];

  const initialTimeline: EditTimeline = {
    id: 'test-timeline',
    videoTracks: sampleVideoClips,
    audioTracks: sampleAudioClips,
    totalDurationMs: 10000,
    zoomScale: 60,
    playheadMs: 0
  };

  describe('splitClipAtTime', () => {
    it('scinde un clip vidéo en deux fragments continus au point d\'horodatage', () => {
      // Scinder clip-2 (4000 -> 10000) à 6500ms
      const splitTime = 6500;
      const updated = splitClipAtTime(initialTimeline, 'clip-2', splitTime);

      expect(updated.videoTracks.length).toBe(3);
      const part1 = updated.videoTracks[1];
      const part2 = updated.videoTracks[2];

      expect(part1.id).toBe('clip-2');
      expect(part1.startMs).toBe(4000);
      expect(part1.durationMs).toBe(2500); // 6500 - 4000
      expect(part1.trimEndMs).toBe(3500); // 6000 - 2500

      expect(part2.startMs).toBe(6500);
      expect(part2.durationMs).toBe(3500); // 10000 - 6500
      expect(part2.trimStartMs).toBe(2500);
      expect(part2.title).toContain('(fin)');
    });

    it('scinde un clip audio en deux fragments au playhead', () => {
      const splitTime = 3000;
      const updated = splitClipAtTime(initialTimeline, 'audio-1', splitTime);

      expect(updated.audioTracks.length).toBe(2);
      const a1 = updated.audioTracks[0];
      const a2 = updated.audioTracks[1];

      expect(a1.durationMs).toBe(3000);
      expect(a1.trimEndMs).toBe(7000);

      expect(a2.startMs).toBe(3000);
      expect(a2.durationMs).toBe(7000);
      expect(a2.trimStartMs).toBe(3000);
    });

    it('refuse de scinder si le point est hors du clip ou trop proche des bords (< 150ms)', () => {
      // Trop proche du début (50ms)
      const res1 = splitClipAtTime(initialTimeline, 'clip-1', 50);
      expect(res1.videoTracks.length).toBe(2);

      // En dehors du clip
      const res2 = splitClipAtTime(initialTimeline, 'clip-1', 12000);
      expect(res2.videoTracks.length).toBe(2);
    });
  });

  describe('copyClip, cutClip & pasteClip', () => {
    it('copie fidèlement un clip sans modifier la timeline', () => {
      const item = copyClip(initialTimeline, 'clip-1');
      expect(item).not.toBeNull();
      expect(item?.type).toBe('video');
      expect((item?.clip as VideoClip).title).toBe('Scène 1 - Départ');
      expect(initialTimeline.videoTracks.length).toBe(2);
    });

    it('coupe un clip en le supprimant de la timeline et en le plaçant dans le presse-papiers', () => {
      const { updatedTimeline, clipboardItem } = cutClip(initialTimeline, 'clip-2');
      expect(clipboardItem).not.toBeNull();
      expect(clipboardItem?.clip.id).toBe('clip-2');
      expect(updatedTimeline.videoTracks.length).toBe(1);
      expect(updatedTimeline.videoTracks[0].id).toBe('clip-1');
    });

    it('colle un clip à la position du playhead avec un nouvel ID et résout les chevauchements', () => {
      const item = copyClip(initialTimeline, 'clip-1')!;
      const playheadMs = 12000;

      const pastedTimeline = pasteClip(initialTimeline, playheadMs, item);
      expect(pastedTimeline.videoTracks.length).toBe(3);
      const newClip = pastedTimeline.videoTracks[2];

      expect(newClip.id).toContain('clip-1-pasted-');
      expect(newClip.startMs).toBe(12000);
      expect(newClip.durationMs).toBe(4000);
      expect(pastedTimeline.totalDurationMs).toBe(16000);
    });

    it('copie et colle une piste audio', () => {
      const item = copyClip(initialTimeline, 'audio-1')!;
      expect(item.type).toBe('audio');

      const pastedTimeline = pasteClip(initialTimeline, 5000, item);
      expect(pastedTimeline.audioTracks.length).toBe(2);
      expect(pastedTimeline.audioTracks[1].startMs).toBe(5000);
    });
  });

  describe('applyCropTemporal', () => {
    it('calcule la durée effective et les points de trim in/out de manière non destructive', () => {
      const clip: VideoClip = {
        id: 'test-crop',
        sceneId: 'sc-1',
        trackIndex: 0,
        mediaType: 'map',
        startMs: 0,
        durationMs: 5000,
        sourceDurationMs: 10000,
        trimStartMs: 1000,
        trimEndMs: 2000
      };

      const result = applyCropTemporal(clip, 2000, 3000);
      expect(result.trimStartMs).toBe(2000);
      expect(result.trimEndMs).toBe(3000);
      expect(result.durationMs).toBe(5000); // 10000 - 2000 - 3000 = 5000
    });

    it('impose un plancher de durée minimum de 300ms', () => {
      const clip: VideoClip = {
        id: 'test-crop-min',
        sceneId: 'sc-1',
        trackIndex: 0,
        mediaType: 'map',
        startMs: 0,
        durationMs: 2000,
        sourceDurationMs: 2000
      };

      const result = applyCropTemporal(clip, 1900, 200);
      expect(result.durationMs).toBe(300);
    });
  });

  describe('importMediaFile', () => {
    it('importe un fichier image et génère un VideoClip typé image', async () => {
      const imageFile = new File(['fake-image-content'], 'carte-antique.png', { type: 'image/png' });
      const clip = await importMediaFile(imageFile, 5000, 3000);

      expect(clip.mediaType).toBe('image');
      expect(clip.name).toBe('carte-antique.png');
      expect(clip.title).toBe('carte-antique');
      expect(clip.startMs).toBe(5000);
      expect(clip.durationMs).toBe(3000);
      expect(clip.trimStartMs).toBe(0);
      expect(clip.trimEndMs).toBe(0);
    });

    it('rejette les formats non multimédias', async () => {
      const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });
      await expect(importMediaFile(textFile, 0)).rejects.toThrow('Format de fichier non pris en charge');
    });
  });
});
