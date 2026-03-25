import { describe, it, expect } from 'vitest';
import { isChunkError } from './lazyWithRetry';

// ---------------------------------------------------------------------------
// isChunkError
// ---------------------------------------------------------------------------
describe('isChunkError', () => {
  // --- Chunk error messages that should return true ---

  it('returns true for "Failed to fetch dynamically imported module" message', () => {
    const error = new Error('Failed to fetch dynamically imported module: /assets/Foo-abc123.js');
    expect(isChunkError(error)).toBe(true);
  });

  it('returns true for "Loading chunk" message', () => {
    const error = new Error('Loading chunk 42 failed.');
    expect(isChunkError(error)).toBe(true);
  });

  it('returns true for "Loading CSS chunk" message', () => {
    const error = new Error('Loading CSS chunk 7 failed.');
    expect(isChunkError(error)).toBe(true);
  });

  it('returns true when error.name is ChunkLoadError (no message needed)', () => {
    const error = { name: 'ChunkLoadError', message: '' };
    expect(isChunkError(error)).toBe(true);
  });

  it('returns true when both name is ChunkLoadError and message contains Loading chunk', () => {
    const error = { name: 'ChunkLoadError', message: 'Loading chunk 5 failed.' };
    expect(isChunkError(error)).toBe(true);
  });

  // --- Errors that should return false ---

  it('returns false for a generic TypeError', () => {
    const error = new TypeError('Cannot read properties of undefined');
    expect(isChunkError(error)).toBe(false);
  });

  it('returns false for a SyntaxError', () => {
    const error = new SyntaxError('Unexpected token <');
    expect(isChunkError(error)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isChunkError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isChunkError(undefined)).toBe(false);
  });

  it('returns false for an error object with an empty message and no ChunkLoadError name', () => {
    const error = new Error('');
    expect(isChunkError(error)).toBe(false);
  });

  it('returns false for an error with a message that partially resembles but does not match', () => {
    const error = new Error('Failed to fetch resource');
    expect(isChunkError(error)).toBe(false);
  });
});
