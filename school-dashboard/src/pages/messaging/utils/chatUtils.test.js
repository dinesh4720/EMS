import { describe, it, expect } from 'vitest';
import { getFileIcon, formatFileSize, compressWaveform } from './chatUtils';

// ---------------------------------------------------------------------------
// getFileIcon
// ---------------------------------------------------------------------------
describe('getFileIcon', () => {
  it('returns 📄 for .pdf files', () => {
    expect(getFileIcon('report.pdf')).toBe('📄');
  });

  it('returns 📝 for .doc files', () => {
    expect(getFileIcon('letter.doc')).toBe('📝');
  });

  it('returns 📝 for .docx files', () => {
    expect(getFileIcon('letter.docx')).toBe('📝');
  });

  it('returns 📊 for .xlsx files', () => {
    expect(getFileIcon('data.xlsx')).toBe('📊');
  });

  it('returns 📽️ for .pptx files', () => {
    expect(getFileIcon('slides.pptx')).toBe('📽️');
  });

  it('returns 🗜️ for .zip files', () => {
    expect(getFileIcon('archive.zip')).toBe('🗜️');
  });

  it('returns 🗜️ for .rar files', () => {
    expect(getFileIcon('archive.rar')).toBe('🗜️');
  });

  it('returns 📃 for .txt files', () => {
    expect(getFileIcon('notes.txt')).toBe('📃');
  });

  it('returns 🎥 for .mp4 files', () => {
    expect(getFileIcon('video.mp4')).toBe('🎥');
  });

  it('returns 🎥 for .mov files', () => {
    expect(getFileIcon('clip.mov')).toBe('🎥');
  });

  it('returns 📎 for an unrecognised extension', () => {
    expect(getFileIcon('image.png')).toBe('📎');
  });

  it('returns 📎 for undefined (no filename)', () => {
    expect(getFileIcon(undefined)).toBe('📎');
  });

  it('is case-insensitive for extension matching', () => {
    expect(getFileIcon('REPORT.PDF')).toBe('📄');
  });
});

// ---------------------------------------------------------------------------
// formatFileSize
// ---------------------------------------------------------------------------
describe('formatFileSize', () => {
  it('returns empty string for 0 bytes', () => {
    expect(formatFileSize(0)).toBe('');
  });

  it('returns empty string for null', () => {
    expect(formatFileSize(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatFileSize(undefined)).toBe('');
  });

  it('formats bytes under 1024 as B', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats exactly 1023 bytes as B', () => {
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats fractional kilobytes to one decimal place', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('formats fractional megabytes to one decimal place', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('formats large files (10 MB) as MB', () => {
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
  });
});

// ---------------------------------------------------------------------------
// compressWaveform
// ---------------------------------------------------------------------------
describe('compressWaveform', () => {
  it('returns all-0.1 array of targetBars length when samples is null', () => {
    const result = compressWaveform(null, 5);
    expect(result).toEqual([0.1, 0.1, 0.1, 0.1, 0.1]);
  });

  it('returns all-0.1 array of targetBars length when samples is empty', () => {
    const result = compressWaveform([], 4);
    expect(result).toEqual([0.1, 0.1, 0.1, 0.1]);
  });

  it('returns an array of exactly targetBars elements', () => {
    const samples = Array.from({ length: 100 }, (_, i) => i / 100);
    const result = compressWaveform(samples, 10);
    expect(result).toHaveLength(10);
  });

  it('applies 3x amplification and clamps to 1', () => {
    // All samples = 0.5 → 0.5 * 3 = 1.5, clamped to 1
    const samples = [0.5, 0.5, 0.5, 0.5];
    const result = compressWaveform(samples, 1);
    expect(result[0]).toBe(1);
  });

  it('never returns a bar value below 0.1', () => {
    const samples = [0, 0, 0, 0, 0, 0];
    const result = compressWaveform(samples, 3);
    result.forEach((bar) => expect(bar).toBeGreaterThanOrEqual(0.1));
  });

  it('never returns a bar value above 1', () => {
    const samples = [1, 1, 1, 1];
    const result = compressWaveform(samples, 2);
    result.forEach((bar) => expect(bar).toBeLessThanOrEqual(1));
  });

  it('picks the peak sample within each segment', () => {
    // Two segments of equal size: [0.1, 0.9] and [0.2, 0.4]
    const samples = [0.1, 0.9, 0.2, 0.4];
    const result = compressWaveform(samples, 2);
    // First bar peak = 0.9 → 0.9*3 = 2.7 → clamped to 1
    expect(result[0]).toBe(1);
    // Second bar peak = 0.4 → 0.4*3 = 1.2 → clamped to 1
    expect(result[1]).toBe(1);
  });

  it('fills overflow bars with 0.1 when targetBars exceeds samples length', () => {
    // 2 samples, 6 bars — extra bars should be 0.1
    const samples = [0.5, 0.5];
    const result = compressWaveform(samples, 6);
    expect(result).toHaveLength(6);
    // At least some trailing bars should be 0.1 (the overflow ones)
    expect(result[result.length - 1]).toBe(0.1);
  });
});
