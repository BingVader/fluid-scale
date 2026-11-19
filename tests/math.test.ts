import { describe, it, expect } from 'vitest';
import { computeClamp, cleanNumber } from '../src/core/index.js';

describe('cleanNumber', () => {
  it('formats clean integers and decimals', () => {
    expect(cleanNumber(2)).toBe('2');
    expect(cleanNumber(2.5)).toBe('2.5');
    expect(cleanNumber(2.123456, 4)).toBe('2.1235');
    expect(cleanNumber(0)).toBe('0');
    expect(cleanNumber(-0)).toBe('0');
  });

  it('eliminates floating point precision noise', () => {
    expect(cleanNumber(0.1 + 0.2, 4)).toBe('0.3');
  });
});

describe('computeClamp', () => {
  it('computes expected clamp string with default config', () => {
    const result = computeClamp(32, 16);
    expect(result).toMatch(/^clamp\(1rem, .+rem \+ .+vw, 2rem\)$/);
  });

  it('uses minScaleRatio default (0.75) when minPx is omitted', () => {
    const result = computeClamp(20);
    // minPx = 20 * 0.75 = 15px -> 0.9375rem
    // maxPx = 20px -> 1.25rem
    expect(result).toContain('0.9375rem');
    expect(result).toContain('1.25rem');
    expect(result).toMatch(/^clamp\(0\.9375rem, .+, 1\.25rem\)$/);
  });

  it('returns clean rem without clamp when minPx equals maxPx', () => {
    const result = computeClamp(24, 24);
    expect(result).toBe('1.5rem');
  });

  it('handles custom viewports and root font size', () => {
    const result = computeClamp(20, 10, {
      minViewport: 400,
      maxViewport: 1200,
      rootFontSize: 10,
    });
    // 10 / 10 = 1rem, 20 / 10 = 2rem
    expect(result).toMatch(/^clamp\(1rem, .+, 2rem\)$/);
  });

  it('handles inverse scaling when minPx > maxPx without inverting clamp bounds', () => {
    // minPx is larger than maxPx (shrinking as viewport expands)
    const result = computeClamp(16, 32);
    // Lower bound must still be 1rem (16px), upper bound 2rem (32px)
    expect(result).toMatch(/^clamp\(1rem, .+, 2rem\)$/);
    // Slope should be negative
    expect(result).toContain('-');
  });

  it('throws TypeError on non-finite numeric inputs', () => {
    expect(() => computeClamp(NaN)).toThrow(TypeError);
    expect(() => computeClamp(Infinity)).toThrow(TypeError);
    expect(() => computeClamp(16, NaN)).toThrow(TypeError);
  });

  it('throws RangeError on invalid rootFontSize', () => {
    expect(() => computeClamp(16, 8, { rootFontSize: 0 })).toThrow(RangeError);
    expect(() => computeClamp(16, 8, { rootFontSize: -16 })).toThrow(RangeError);
  });

  it('throws RangeError on invalid viewports', () => {
    expect(() => computeClamp(16, 8, { minViewport: 0 })).toThrow(RangeError);
    expect(() => computeClamp(16, 8, { maxViewport: -100 })).toThrow(RangeError);
    expect(() => computeClamp(16, 8, { minViewport: 800, maxViewport: 800 })).toThrow(RangeError);
  });
});
