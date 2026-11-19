import React from 'react';
import { computeClamp } from '../core/math.js';
import type { FluidConfig } from '../core/types.js';

export interface FluidGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Minimum width for grid columns in pixels.
   * @default 280
   */
  minItemWidth?: number;

  /**
   * Target gap between grid items in pixels at max viewport.
   * @default 16
   */
  gap?: number;

  /**
   * Minimum gap between grid items in pixels at min viewport.
   * Defaults to `gap * minScaleRatio`.
   */
  minGap?: number;

  /**
   * Fluid scaling configuration options.
   */
  config?: FluidConfig;

  /**
   * The HTML element or component to render as.
   * @default 'div'
   */
  as?: React.ElementType;
}

/**
 * A fluid responsive CSS Grid container that automatically fits columns
 * based on minItemWidth and applies fluid clamp spacing for gaps.
 */
export const FluidGrid = React.forwardRef<HTMLDivElement, FluidGridProps>(
  function FluidGrid(
    {
      minItemWidth = 280,
      gap = 16,
      minGap,
      config,
      as: Component = 'div',
      style,
      children,
      ...rest
    },
    ref
  ) {
    const computedGap = computeClamp(gap, minGap, config);

    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minItemWidth}px), 1fr))`,
      gap: computedGap,
      ...style,
    };

    return (
      <Component ref={ref} style={gridStyle} {...rest}>
        {children}
      </Component>
    );
  }
);

FluidGrid.displayName = 'FluidGrid';
