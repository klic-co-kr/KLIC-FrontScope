/**
 * RecordingPanel Component
 *
 * GIF 녹화 중 상태를 표시하는 컴포넌트
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface RecordingPanelProps {
  isRecording: boolean;
  onStopRecording: () => void;
  className?: string;
}

export const RecordingPanel: React.FC<RecordingPanelProps> = ({
  isRecording,
  onStopRecording,
  className = '',
}) => {
  const { t } = useTranslation();
  const [duration, setDuration] = useState(0);
  const wasRecording = useRef(false);

  useEffect(() => {
    if (isRecording) {
      wasRecording.current = true;
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (wasRecording.current) {
      // Only reset duration when transitioning from recording to not recording
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDuration(0);
      wasRecording.current = false;
    }
  }, [isRecording]);

  if (!isRecording) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`
        klic-recording-panel
        flex items-center gap-3
        bg-blue-600 text-white
        px-4 py-2 rounded-lg
        shadow-lg
        ${className}
      `}
    >
      {/* Recording dot animation */}
      <div className="relative">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
      </div>

      {/* Label */}
      <span className="font-medium text-sm">{t('gifRecording.recordingInProgress')}</span>

      {/* Duration */}
      <span className="font-mono text-sm bg-white/20 px-2 py-0.5 rounded">
        {formatTime(duration)}
      </span>

      {/* Stop button */}
      <button
        onClick={onStopRecording}
        className="
          flex items-center gap-1
          bg-red-500 hover:bg-red-600
          px-3 py-1 rounded
          text-sm font-medium
          transition-colors
        "
        title={t('gifRecording.stopTitle')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
        {t('gifRecording.stop')}
      </button>
    </div>
  );
};

export default RecordingPanel;
