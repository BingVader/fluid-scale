import { useMemo } from 'react';
import { useWindowDimensions, PixelRatio } from 'react-native';
import type { NativeScaleOptions, FluidNativeResult } from './types.js';

/**
 * React Native hook that computes responsive scale functions based on dynamic window dimensions,
 * accounting for device orientation, split-screen, foldables, and tablet scaling caps.
 */
export function useFluidNative(options: NativeScaleOptions = {}): FluidNativeResult {
  const {
    guidelineBaseWidth = 375,
    guidelineBaseHeight = 812,
    maxTabletScale = 1.35,
  } = options;

  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const shortestDimension = Math.min(width, height);
    const isTablet = shortestDimension >= 600;

    const rawHorizontalScale = width / guidelineBaseWidth;
    const rawVerticalScale = height / guidelineBaseHeight;

    const horizontalScale = isTablet
      ? Math.min(rawHorizontalScale, maxTabletScale)
      : rawHorizontalScale;

    const verticalScaleRatio = isTablet
      ? Math.min(rawVerticalScale, maxTabletScale)
      : rawVerticalScale;

    const scale = (size: number): number => {
      return PixelRatio.roundToNearestPixel(size * horizontalScale);
    };

    const verticalScale = (size: number): number => {
      return PixelRatio.roundToNearestPixel(size * verticalScaleRatio);
    };

    const moderateScale = (size: number, factor: number = 0.5): number => {
      return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
    };

    return {
      scale,
      verticalScale,
      moderateScale,
      isTablet,
      width,
      height,
    };
  }, [width, height, guidelineBaseWidth, guidelineBaseHeight, maxTabletScale]);
}
