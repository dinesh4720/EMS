import { describe, it, expect } from 'vitest';
import { getRadianAngle, rotateSize } from './canvasUtils';

// ─── getRadianAngle ───────────────────────────────────────────────────────────

describe('getRadianAngle', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(getRadianAngle(0)).toBe(0);
  });

  it('converts 180 degrees to PI radians', () => {
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI);
  });

  it('converts 360 degrees to 2*PI radians', () => {
    expect(getRadianAngle(360)).toBeCloseTo(2 * Math.PI);
  });

  it('converts 90 degrees to PI/2 radians', () => {
    expect(getRadianAngle(90)).toBeCloseTo(Math.PI / 2);
  });

  it('converts 45 degrees to PI/4 radians', () => {
    expect(getRadianAngle(45)).toBeCloseTo(Math.PI / 4);
  });

  it('converts negative degrees correctly (-90 → -PI/2)', () => {
    expect(getRadianAngle(-90)).toBeCloseTo(-Math.PI / 2);
  });

  it('uses the formula degreeValue * PI / 180', () => {
    const deg = 37;
    expect(getRadianAngle(deg)).toBeCloseTo((deg * Math.PI) / 180);
  });
});

// ─── rotateSize ───────────────────────────────────────────────────────────────

describe('rotateSize', () => {
  it('returns original dimensions for 0 degree rotation', () => {
    const { width, height } = rotateSize(100, 50, 0);
    expect(width).toBeCloseTo(100);
    expect(height).toBeCloseTo(50);
  });

  it('swaps width and height at 90 degree rotation', () => {
    const { width, height } = rotateSize(100, 50, 90);
    expect(width).toBeCloseTo(50);
    expect(height).toBeCloseTo(100);
  });

  it('swaps width and height at 270 degree rotation', () => {
    const { width, height } = rotateSize(100, 50, 270);
    expect(width).toBeCloseTo(50);
    expect(height).toBeCloseTo(100);
  });

  it('returns original dimensions at 180 degree rotation', () => {
    const { width, height } = rotateSize(100, 50, 180);
    expect(width).toBeCloseTo(100);
    expect(height).toBeCloseTo(50);
  });

  it('returns values larger than source for arbitrary angle (diagonal bounding box)', () => {
    const { width, height } = rotateSize(100, 100, 45);
    // Rotating a square 45° produces a larger bounding box
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);
  });

  it('returns non-negative width and height for any rotation', () => {
    for (const deg of [0, 30, 60, 90, 120, 150, 180, 210, 270, 330]) {
      const { width, height } = rotateSize(80, 60, deg);
      expect(width).toBeGreaterThanOrEqual(0);
      expect(height).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles a square image (width === height)', () => {
    const { width, height } = rotateSize(200, 200, 45);
    expect(width).toBeCloseTo(height, 5);
  });

  it('returns an object with width and height properties', () => {
    const result = rotateSize(10, 20, 0);
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
  });
});
