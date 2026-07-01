import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logger from '../../../utils/logger';


/**
 * VoiceWaveform Component - WhatsApp style
 * Displays audio waveform with playback controls
 * Waveform represents amplitude over time (not frequency)
 */
export default function VoiceWaveform({
  audioUrl,
  audioBlob,
  waveformData = [],
  duration = 0,
  isRecording = false,
  liveLevels = [],
  onPlay,
  onPause,
  isOwn = false,
  size = 'normal' // 'normal' or 'small'
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Create a stable object URL from blob - only once per blob change
  const blobUrl = useMemo(() => {
    if (audioBlob) {
      return URL.createObjectURL(audioBlob);
    }
    return null;
  }, [audioBlob]);

  // Cleanup blob URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // The actual audio source - prefer audioUrl (server URL) over blob URL
  const audioSrc = audioUrl || blobUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    };

    const handleError = (e) => {
      logger.warn('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc]);

  // Reset playback state when audio source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  }, [audioSrc]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        onPlay?.();
      } catch (err) {
        logger.warn('Failed to play audio:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration) || isRecording) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * audio.duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const barCount = 50;
  const barHeight = size === 'small' ? 16 : 24;
  const barWidth = size === 'small' ? 2 : 3;

  // Generate placeholder bars if no data
  const bars = waveformData.length > 0 ? waveformData : Array(barCount).fill(0.3);

  // Build display bars without mutating the source arrays
  const displayBars = useMemo(() => {
    let source;
    if (isRecording) {
      source = liveLevels.slice(-barCount);
    } else {
      source = bars;
    }

    // Pad to barCount length without mutating
    if (source.length < barCount) {
      const padding = Array(barCount - source.length).fill(0.1);
      if (isRecording) {
        source = [...padding, ...source]; // Pad at start during recording
      } else {
        source = [...source, ...padding]; // Pad at end for playback
      }
    }

    return source;
  }, [isRecording, liveLevels, bars, barCount]);

  return (
    <div className={`flex items-center gap-2 ${size === 'small' ? 'py-1' : 'py-1'}`}>
      {/* Audio element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
        />
      )}

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={isRecording || !audioSrc}
        className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
          size === 'small' ? 'w-8 h-8' : 'w-10 h-10'
        } ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30'
            : 'bg-primary/20 hover:bg-primary/30 dark:bg-primary/30 dark:hover:bg-primary/40'
        } ${isRecording || !audioSrc ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isPlaying ? (
          <Pause size={size === 'small' ? 14 : 18} className={isOwn ? 'text-white' : 'text-primary'} />
        ) : (
          <Play size={size === 'small' ? 14 : 18} className={`ml-0.5 ${isOwn ? 'text-white' : 'text-primary'}`} />
        )}
      </button>

      {/* Waveform */}
      <div
        className={`flex-1 cursor-pointer ${isRecording ? 'cursor-default' : ''}`}
        onClick={!isRecording ? handleSeek : undefined}
        style={{ height: `${barHeight + 8}px`, display: 'flex', alignItems: 'center' }}
      >
        <div
          className="flex items-center gap-px w-full"
          style={{ height: `${barHeight}px` }}
        >
          {Array.from({ length: barCount }).map((_, index) => {
            const value = displayBars[index] || 0.1;
            // Calculate which bar corresponds to current progress
            const barProgress = (index / barCount) * 100;
            const isPassed = barProgress <= progress;

            // Normalize height - min 4px, max based on value
            const height = Math.max(4, Math.min(barHeight, value * barHeight));

            return (
              <div
                key={`bar-${index}`}
                className={`rounded-full transition-all duration-75 ${
                  isRecording
                    ? (isOwn ? 'bg-white/60' : 'bg-primary/60 dark:bg-primary/70')
                    : isPassed
                      ? (isOwn ? 'bg-white' : 'bg-primary dark:bg-primary')
                      : (isOwn ? 'bg-white/40' : 'bg-primary/40 dark:bg-primary/50')
                }`}
                style={{
                  width: `${barWidth}px`,
                  height: `${height}px`,
                  flexShrink: 0
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Time Display */}
      <div className={`flex-shrink-0 tabular-nums min-w-[32px] text-right ${size === 'small' ? 'text-2xs' : 'text-xs'} ${isOwn ? 'text-white/80' : 'text-default-500 dark:text-zinc-400'}`}>
        {isRecording
          ? formatTime(duration)
          : formatTime(isPlaying ? currentTime : (duration || (audioRef.current?.duration || 0)))
        }
      </div>
    </div>
  );
}
