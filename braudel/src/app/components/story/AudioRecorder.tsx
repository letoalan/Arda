import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  sceneId: string;
  existingAudioUrl?: string;
  onAudioSave: (sceneId: string, audioDataUrl: string) => void;
  onAudioDelete: (sceneId: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  sceneId,
  existingAudioUrl,
  onAudioSave,
  onAudioDelete
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(existingAudioUrl);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setAudioUrl(dataUrl);
          onAudioSave(sceneId, dataUrl);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Erreur accès microphone :', err);
      alert('Impossible d\'accéder au microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDelete = () => {
    setAudioUrl(undefined);
    onAudioDelete(sceneId);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
      {!isRecording ? (
        <button 
          onClick={startRecording}
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px', color: 'var(--accent-primary)' }}
        >
          <Mic size={14} /> Enregistrer voix off
        </button>
      ) : (
        <button 
          onClick={stopRecording}
          className="btn"
          style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px', background: 'var(--accent-danger)', color: 'white' }}
        >
          <Square size={14} /> Arrêter ({audioChunksRef.current.length}s)
        </button>
      )}

      {audioUrl && !isRecording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <audio src={audioUrl} controls style={{ height: '24px', maxWidth: '160px' }} />
          <button 
            onClick={handleDelete}
            className="btn"
            style={{ padding: '2px 4px', color: 'var(--accent-danger)' }}
            title="Supprimer la voix off"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
