import type { PluginCreator, Declaration } from 'postcss';
import { computeClamp } from '../core/math.js';
import type { PostcssFluidOptions } from './types.js';

export type { PostcssFluidOptions };

const DEFAULT_PROPERTIES = [
  'font-size',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-inline',
  'padding-block',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-inline',
  'margin-block',
  'gap',
  'row-gap',
  'column-gap',
  'border-radius',
];

/**
 * Checks whether a declaration is nested within a `@media` at-rule.
 */
function isInsideMediaRule(decl: Declaration): boolean {
  let parent: any = decl.parent;
  while (parent) {
    if (parent.type === 'atrule' && parent.name?.toLowerCase() === 'media') {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

/**
 * Checks whether a declaration has an explicit `fluid-ignore` opt-out comment.
 */
function hasFluidIgnore(decl: Declaration): boolean {
  // Check preceding comment node
  const prev: any = decl.prev();
  if (prev && prev.type === 'comment' && prev.text.trim().toLowerCase() === 'fluid-ignore') {
    // If the comment was on the same line as the node before it, it's trailing that previous node,
    // not a preceding comment for this declaration.
    const prevOfPrev = prev.prev?.();
    const isTrailingPrev =
      prevOfPrev?.source?.end?.line &&
      prev.source?.start?.line &&
      prevOfPrev.source.end.line === prev.source.start.line;

    if (!isTrailingPrev) {
      return true;
    }
  }

  // Check next/trailing comment node on the same line as this declaration
  const next: any = decl.next();
  if (next && next.type === 'comment' && next.text.trim().toLowerCase() === 'fluid-ignore') {
    const isTrailingThis =
      decl.source?.end?.line &&
      next.source?.start?.line &&
      decl.source.end.line === next.source.start.line;

    if (isTrailingThis) {
      return true;
    }
  }

  // Inline comment in raw value (e.g. `padding: 16px /* fluid-ignore */;`)
  const rawValue = decl.raws?.value?.raw;
  if (rawValue && /\/\*\s*fluid-ignore\s*\*\//i.test(rawValue)) {
    return true;
  }

  if (decl.value && /\/\*\s*fluid-ignore\s*\*\//i.test(decl.value)) {
    return true;
  }

  return false;
}

/**
 * PostCSS plugin that automatically converts pixel units to fluid clamp() expressions.
 */
const postcssFluidScale: PluginCreator<PostcssFluidOptions> = (options = {}) => {
  const propertyList = options.properties ?? DEFAULT_PROPERTIES;
  const targetProperties = new Set(propertyList.map((p) => p.toLowerCase()));
  const minThresholdPx = options.minThresholdPx ?? 4;

  const fluidConfig = {
    minViewport: options.minViewport,
    maxViewport: options.maxViewport,
    minScaleRatio: options.minScaleRatio,
    rootFontSize: options.rootFontSize,
  };

  return {
    postcssPlugin: 'postcss-fluid-scale',

    Declaration(decl) {
      const propLower = decl.prop.toLowerCase();
      if (!targetProperties.has(propLower)) {
        return;
      }

      // Skip already transformed or custom clamp values
      if (decl.value.includes('clamp(')) {
        return;
      }

      // Skip media query overrides
      if (isInsideMediaRule(decl)) {
        return;
      }

      // Skip explicit fluid-ignore opt-outs
      if (hasFluidIgnore(decl)) {
        return;
      }

      // Safe standalone pixel matching with negative boundary check
      const PX_REGEX = /(?<![\w-])(-?\d*\.?\d+)px\b/gi;
      let transformed = false;

      const newValue = decl.value.replace(PX_REGEX, (match, numStr) => {
        const px = parseFloat(numStr);
        if (!Number.isFinite(px) || Math.abs(px) < minThresholdPx) {
          return match;
        }
        transformed = true;
        return computeClamp(px, undefined, fluidConfig);
      });

      if (transformed) {
        decl.value = newValue;
      }
    },
  };
};

postcssFluidScale.postcss = true;

export default postcssFluidScale;
export { postcssFluidScale };
