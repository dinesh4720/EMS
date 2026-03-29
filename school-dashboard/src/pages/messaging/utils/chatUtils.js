/**
 * Pure utility functions for the Chat module.
 * No React or component dependencies — safe to import from plain .js files.
 */

import { formatShortDate } from '../../../utils/dateFormatter';

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Offline';
  const date = new Date(lastSeen);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return formatShortDate(date);
};

export const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':   return '📄';
    case 'doc':
    case 'docx':  return '📝';
    case 'xls':
    case 'xlsx':  return '📊';
    case 'ppt':
    case 'pptx':  return '📽️';
    case 'zip':
    case 'rar':   return '🗜️';
    case 'txt':   return '📃';
    case 'mp4':
    case 'mov':
    case 'avi':   return '🎥';
    default:      return '📎';
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Compress an array of amplitude samples down to targetBars values
 * using peak detection per segment.
 */
export const compressWaveform = (samples, targetBars) => {
  if (!samples || samples.length === 0) {
    return Array(targetBars).fill(0.1);
  }

  const result = [];
  const samplesPerBar = Math.max(1, Math.floor(samples.length / targetBars));

  for (let i = 0; i < targetBars; i++) {
    const start = i * samplesPerBar;
    const end = Math.min(start + samplesPerBar, samples.length);

    if (start >= samples.length) {
      result.push(0.1);
      continue;
    }

    let max = 0.1;
    for (let j = start; j < end; j++) {
      if (samples[j] > max) max = samples[j];
    }

    const amplified = Math.min(1, max * 3);
    result.push(Math.max(0.1, amplified));
  }

  return result;
};

