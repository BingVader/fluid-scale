export interface NativeScaleOptions {
  /**
   * Guideline screen width of the design prototype in dp.
   * @default 375
   */
  guidelineBaseWidth?: number;

  /**
   * Guideline screen height of the design prototype in dp.
   * @default 812
   */
  guidelineBaseHeight?: number;

  /**
   * Maximum scaling multiplier applied on tablet devices to prevent oversized elements.
   * @default 1.35
   */
  maxTabletScale?: number;
}

export interface FluidNativeResult {
  /**
   * Scales a size horizontally based on the current window width relative to guidelineBaseWidth.
   */
  scale: (size: number) => number;

  /**
   * Scales a size vertically based on the current window height relative to guidelineBaseHeight.
   */
  verticalScale: (size: number) => number;

  /**
   * Moderately scales a size with a configurable damping factor.
   * @param size - The base size to scale.
   * @param factor - Damping factor between 0 (unscaled) and 1 (fully scaled). Default 0.5.
   */
  moderateScale: (size: number, factor?: number) => number;

  /**
   * Whether the current screen is classified as a tablet (shortest dimension >= 600dp).
   */
  isTablet: boolean;

  /**
   * Current window width in dp.
   */
  width: number;

  /**
   * Current window height in dp.
   */
  height: number;
}
