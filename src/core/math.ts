import type { FluidConfig } from './types.js';

/**
 * Cleanly formats a floating point number up to a maximum number of decimal places,
 * stripping unnecessary trailing zeros and avoiding negative zero (-0).
 */
export function cleanNumber(num: number, maxDecimals: number = 4): string {
  if (Object.is(num, -0) || Math.abs(num) < 1e-12) {
    return '0';
  }
  const factor = 10 ** maxDecimals;
  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
  if (Object.is(rounded, -0) || Math.abs(rounded) < 1e-12) {
    return '0';
  }
  return rounded.toString();
}

/**
 * Computes a CSS `clamp()` expression providing linear fluid scaling between
 * `minViewport` and `maxViewport`.
 *
 * @param maxPx - The target size in pixels at the maximum viewport width.
 * @param minPx - Optional minimum size in pixels at the minimum viewport width. Defaults to `maxPx * minScaleRatio`.
 * @param config - Optional configuration overrides for viewports, scale ratio, and root font size.
 * @returns A CSS clamp string, e.g. `clamp(1rem, 0.6479rem + 1.5023vw, 2rem)`, or a static `rem` value if min equals max.
 *
 * @throws {TypeError} If inputs are non-finite numbers.
 * @throws {RangeError} If rootFontSize <= 0, or minViewport/maxViewport are invalid or equal.
 */
export function computeClamp(
  maxPx: number,
  minPx?: number,
  config?: FluidConfig
): string {
  if (!Number.isFinite(maxPx)) {
    throw new TypeError(`maxPx must be a finite number, received: ${maxPx}`);
  }

  if (minPx !== undefined && !Number.isFinite(minPx)) {
    throw new TypeError(`minPx must be a finite number, received: ${minPx}`);
  }

  const minViewport = config?.minViewport ?? 375;
  const maxViewport = config?.maxViewport ?? 1440;
  const minScaleRatio = config?.minScaleRatio ?? 0.75;
  const rootFontSize = config?.rootFontSize ?? 16;

  if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) {
    throw new RangeError(
      `rootFontSize must be a positive number greater than 0, received: ${rootFontSize}`
    );
  }

  if (!Number.isFinite(minViewport) || minViewport <= 0) {
    throw new RangeError(
      `minViewport must be a positive number greater than 0, received: ${minViewport}`
    );
  }

  if (!Number.isFinite(maxViewport) || maxViewport <= 0) {
    throw new RangeError(
      `maxViewport must be a positive number greater than 0, received: ${maxViewport}`
    );
  }

  if (minViewport === maxViewport) {
    throw new RangeError(
      `minViewport and maxViewport cannot be equal (${minViewport} === ${maxViewport})`
    );
  }

  const resolvedMinPx = minPx !== undefined ? minPx : maxPx * minScaleRatio;

  // Degenerate case: if min equals max, no clamp is required
  if (resolvedMinPx === maxPx) {
    return `${cleanNumber(maxPx / rootFontSize)}rem`;
  }

  // Calculate linear slope (px / px) and intercept (px)
  const slope = (maxPx - resolvedMinPx) / (maxViewport - minViewport);
  const intercept = resolvedMinPx - slope * minViewport;

  // Preferred value parts
  const slopeVw = slope * 100;
  const interceptRem = intercept / rootFontSize;

  const slopeStr = cleanNumber(slopeVw);
  const interceptStr = cleanNumber(interceptRem);

  let preferred: string;
  if (slopeStr === '0') {
    preferred = `${interceptStr}rem`;
  } else if (interceptStr === '0') {
    preferred = `${slopeStr}vw`;
  } else if (Number(slopeStr) > 0) {
    preferred = `${interceptStr}rem + ${slopeStr}vw`;
  } else {
    // slope is negative: "interceptrem - |slope|vw"
    const absSlopeStr = cleanNumber(Math.abs(Number(slopeStr)));
    preferred = `${interceptStr}rem - ${absSlopeStr}vw`;
  }

  // Ensure CSS clamp bounds: clamp(MIN, VAL, MAX) requires MIN <= MAX.
  // When minPx > maxPx, the value decreases with viewport width, so
  // maxPx / rootFontSize is the lower bound and resolvedMinPx / rootFontSize is the upper bound.
  const lowerRem = Math.min(resolvedMinPx, maxPx) / rootFontSize;
  const upperRem = Math.max(resolvedMinPx, maxPx) / rootFontSize;

  return `clamp(${cleanNumber(lowerRem)}rem, ${preferred}, ${cleanNumber(upperRem)}rem)`;
}
