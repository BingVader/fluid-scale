import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import type { NativeScaleOptions, FluidNativeResult } from '../src/native/types.js';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock react-native
vi.mock('react-native', () => {
  let mockDimensions = { width: 375, height: 812, scale: 2, fontScale: 1 };
  return {
    useWindowDimensions: () => mockDimensions,
    PixelRatio: {
      roundToNearestPixel: (size: number) => Math.round(size),
    },
    __setMockDimensions: (dims: { width: number; height: number }) => {
      mockDimensions = { ...mockDimensions, ...dims };
    },
  };
});

import { useFluidNative } from '../src/native/useFluidNative.js';

function renderNativeHook(options?: NativeScaleOptions): FluidNativeResult {
  let result!: FluidNativeResult;
  function TestComponent() {
    result = useFluidNative(options);
    return null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(TestComponent));
  });
  act(() => {
    root.unmount();
  });
  container.remove();
  return result;
}

describe('useFluidNative', () => {
  it('computes baseline dimensions and scale on guideline phone (375x812)', () => {
    const result = renderNativeHook();
    expect(result.width).toBe(375);
    expect(result.height).toBe(812);
    expect(result.isTablet).toBe(false);
    expect(result.scale(10)).toBe(10);
    expect(result.verticalScale(20)).toBe(20);
    expect(result.moderateScale(10)).toBe(10);
  });

  it('scales values proportionally on larger phone screens', async () => {
    const rn = await import('react-native');
    // Larger phone in dp: width 450dp < 600dp threshold
    (rn as any).__setMockDimensions({ width: 450, height: 900 });

    const result = renderNativeHook();
    expect(result.isTablet).toBe(false);
    // 450 / 375 = 1.2 -> scale(10) = 12
    expect(result.scale(10)).toBe(12);
    // moderateScale(10, 0.5) = 10 + (12 - 10) * 0.5 = 11
    expect(result.moderateScale(10, 0.5)).toBe(11);
  });

  it('caps scaling on tablet viewports using maxTabletScale', async () => {
    const rn = await import('react-native');
    // Tablet with shortest dimension >= 600
    (rn as any).__setMockDimensions({ width: 1200, height: 800 });

    const result = renderNativeHook({ maxTabletScale: 1.35 });
    expect(result.isTablet).toBe(true);
    // Uncapped horizontal would be 1200 / 375 = 3.2, but capped at 1.35
    expect(result.scale(100)).toBe(135);
  });
});
