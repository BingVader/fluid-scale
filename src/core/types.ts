/**
 * Configuration options for fluid scaling calculations.
 */
export interface FluidConfig {
  /**
   * Lower viewport width bound in pixels where fluid scaling begins.
   * @default 375
   */
  minViewport?: number;

  /**
   * Upper viewport width bound in pixels where fluid scaling caps.
   * @default 1440
   */
  maxViewport?: number;

  /**
   * Default ratio used to derive minPx from maxPx when minPx is not explicitly provided.
   * For example, 0.75 means minPx will be 75% of maxPx.
   * @default 0.75
   */
  minScaleRatio?: number;

  /**
   * Root element font-size in pixels used for rem conversions.
   * @default 16
   */
  rootFontSize?: number;
}
