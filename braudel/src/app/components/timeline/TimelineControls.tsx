// app/components/timeline/TimelineControls.tsx

import React from 'react';
import { Play, Pause, FastForward, Rewind, Calendar } from 'lucide-react';

interface TimelineControlsProps {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  minTime: number;
  maxTime: number;
  onTogglePlayback: () => void;
  onChangeSpeed: (speed: number) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onChangeTime: (time: number) => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTime,
  isPlaying,
  playbackSpeed,
  minTime,
  maxTime,
  onTogglePlayback,
  onChangeSpeed,
  onJumpStart,
  onJumpEnd,
  onChangeTime,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button className="btn btn-secondary" onClick={onJumpStart} style={{ padding: '6px 8px' }} title="Début">
        <Rewind size={14} />
      </button>

      <button className="btn btn-primary" onClick={onTogglePlayback} style={{ padding: '6px 12px' }}>
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button className="btn btn-secondary" onClick={onJumpEnd} style={{ padding: '6px 8px' }} title="Fin">
        <FastForward size={14} />
      </button>

      <select
        value={playbackSpeed}
        onChange={(e) => onChangeSpeed(Number(e.target.value))}
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '4px 6px',
          fontSize: '0.75rem',
        }}
      >
        <option value={1}>1 an/s</option>
        <option value={5}>5 ans/s</option>
        <option value={10}>10 ans/s</option>
        <option value={50}>50 ans/s</option>
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
        <Calendar size={15} />
        <span>{currentTime > 0 ? `${currentTime} ap. J.-C.` : `${Math.abs(currentTime)} av. J.-C.`}</span>
      </div>

      <input
        type="range"
        min={minTime}
        max={maxTime}
        value={currentTime}
        onChange={(e) => onChangeTime(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
      />
    </div>
  );
};
