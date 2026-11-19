import type { FluidConfig } from '../core/types.js';

/**
 * Options for the postcssFluidScale plugin.
 */
export interface PostcssFluidOptions extends FluidConfig {
  /**
   * CSS property names to automatically scale. Case-insensitive.
   * Defaults to typography, spacing (padding, margin, gap), and border-radius.
   */
  properties?: string[];

  /**
   * Minimum pixel threshold to scale. Absolute pixel values below this
   * threshold (e.g. 1px borders, hairlines) are preserved as-is.
   * @default 4
   */
  minThresholdPx?: number;
}
