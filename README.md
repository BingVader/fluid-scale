# @bingvader/fluid-scale

[![npm version](https://img.shields.io/npm/v/@bingvader/fluid-scale.svg)](https://www.npmjs.com/package/@bingvader/fluid-scale)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#core-module)

A zero-dependency fluid clamp typography and spacing engine with dedicated platform adapters for **PostCSS**, **React**, and **React Native**.

Automatically interpolate pixel values between minimum and maximum viewport widths using standard CSS `clamp(min, preferred, max)` formulas—eliminating breakpoint sprawl and rigid media query staircases.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Module Architecture](#module-architecture)
- [Core Module: `computeClamp`](#core-module-computeclamp)
  - [Mathematical Formula](#mathematical-formula)
  - [API Reference](#core-api-reference)
  - [Inverse / Negative Scaling](#inverse--negative-scaling)
  - [Degenerate Equality Case](#degenerate-equality-case)
- [PostCSS Plugin: `postcssFluidScale`](#postcss-plugin-postcssfluidscale)
  - [Configuration](#postcss-configuration)
  - [CSS Transformation Example](#css-transformation-example)
  - [Selective Opt-Out (`/* fluid-ignore */`)](#selective-opt-out--fluid-ignore-)
  - [Automatic Safety Guards](#automatic-safety-guards)
  - [Options Reference](#postcss-options-reference)
- [React Adapter](#react-adapter)
  - [`<FluidGrid />`](#fluidgrid-)
  - [`useLayoutGuard`](#uselayoutguard)
- [React Native Adapter: `useFluidNative`](#react-native-adapter-usefluidnative)
  - [Hook Usage](#hook-usage)
  - [Tablet Damping & Scaling Cap](#tablet-damping--scaling-cap)
  - [Native API Reference](#native-api-reference)
- [TypeScript](#typescript)
- [License](#license)

---

## Features

- 🪶 **Zero Core Dependencies**: Pure mathematical clamp calculation in < 1 kB.
- 📐 **Linear Fluid Math**: Generates clean, production-ready `clamp(minRem, interceptRem + slopeVw, maxRem)` expressions.
- 🎨 **PostCSS Plugin**: Convert static CSS pixel declarations to fluid clamps at build time.
- ⚛️ **React Grid & Layout Guard**: Auto-fitting responsive grid container and development-mode horizontal overflow / touch-target inspector.
- 📱 **React Native Hook**: Dimensions-aware scaling hook with tablet dampening, orientation safety, and sub-pixel alignment via `PixelRatio`.
- 📦 **Tree-Shakeable Subpaths**: Import only what you need using modern package exports.

---

## Installation

```bash
# npm
npm install @bingvader/fluid-scale

# pnpm
pnpm add @bingvader/fluid-scale

# yarn
yarn add @bingvader/fluid-scale

# bun
bun add @bingvader/fluid-scale
```

---

## Module Architecture

`@bingvader/fluid-scale` provides four dedicated subpath exports:

| Entrypoint | Export | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| `@bingvader/fluid-scale` | `computeClamp`, `cleanNumber` | Core mathematical clamp calculation | Zero (pure TS/JS) |
| `@bingvader/fluid-scale/postcss` | `postcssFluidScale` (default) | Build-time PostCSS AST transformation | `postcss` (peer) |
| `@bingvader/fluid-scale/react` | `<FluidGrid />`, `useLayoutGuard` | Responsive layout components and dev guards | `react` (peer) |
| `@bingvader/fluid-scale/native` | `useFluidNative` | Dimensions & orientation scaling hook | `react`, `react-native` (peers) |

---

## Core Module: `computeClamp`

Import the core math engine directly for programmatic CSS string generation, styled-components, inline styles, or CSS-in-JS libraries:

```ts
import { computeClamp } from '@bingvader/fluid-scale';

// Scales from 16px at 375px viewport to 32px at 1440px viewport (default config)
const fontSize = computeClamp(32, 16);
// Returns: 'clamp(1rem, 0.6479rem + 1.5023vw, 2rem)'

// Auto-derive minPx using the default 75% scale ratio (32 * 0.75 = 24px)
const autoMargin = computeClamp(32);
// Returns: 'clamp(1.5rem, 1.3239rem + 0.7512vw, 2rem)'

// Custom viewport and root font-size configuration
const customPadding = computeClamp(48, 20, {
  minViewport: 320,
  maxViewport: 1200,
  rootFontSize: 16,
});
// Returns: 'clamp(1.25rem, 0.6136rem + 3.1818vw, 3rem)'
```

### Mathematical Formula

The linear interpolation formula computes the exact slope ($S$) and intercept ($I$) between two viewport coordinates:

$$\text{Slope } (S) = \frac{\text{maxPx} - \text{minPx}}{\text{maxViewport} - \text{minViewport}}$$

$$\text{Intercept } (I) = \text{minPx} - (S \times \text{minViewport})$$

$$\text{Preferred} = \left(\frac{I}{\text{rootFontSize}}\right)\text{rem} + (S \times 100)\text{vw}$$

$$\text{Result} = \text{clamp}\left(\frac{\min(\text{minPx}, \text{maxPx})}{\text{rootFontSize}}\text{rem},\, \text{Preferred},\, \frac{\max(\text{minPx}, \text{maxPx})}{\text{rootFontSize}}\text{rem}\right)$$

### Core API Reference

```ts
function computeClamp(
  maxPx: number,
  minPx?: number,
  config?: FluidConfig
): string
```

#### `FluidConfig` Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `minViewport` | `number` | `375` | Lower viewport bound in pixels where fluid scaling begins. |
| `maxViewport` | `number` | `1440` | Upper viewport bound in pixels where fluid scaling caps. |
| `minScaleRatio` | `number` | `0.75` | Fallback ratio when `minPx` is omitted (`minPx = maxPx * minScaleRatio`). |
| `rootFontSize` | `number` | `16` | Root element font size in pixels used for `rem` calculations. |

### Inverse / Negative Scaling

When elements should contract as viewport width expands (e.g., mobile-first hero overlays or tight desktop elements), supply a `minPx` larger than `maxPx`:

```ts
const inversePadding = computeClamp(16, 32);
// Returns: 'clamp(1rem, 2.3521rem - 1.5023vw, 2rem)'
```

The algorithm automatically maintains valid CSS `clamp(MIN, VAL, MAX)` bounds where `MIN <= MAX` and cleanly handles negative slope notation (`rem - vw`).

### Degenerate Equality Case

If `minPx === maxPx` (or derived min equals max), the function skips `clamp()` entirely and outputs an efficient static `rem` string:

```ts
computeClamp(16, 16);
// Returns: '1rem'
```

---

## PostCSS Plugin: `postcssFluidScale`

Automate fluid scaling across your entire CSS codebase without writing `clamp()` manually.

### PostCSS Configuration

Add `postcssFluidScale` to your `postcss.config.js` or `postcss.config.mjs`:

```js
// postcss.config.mjs
import postcssFluidScale from '@bingvader/fluid-scale/postcss';

export default {
  plugins: [
    postcssFluidScale({
      minViewport: 375,
      maxViewport: 1440,
      minThresholdPx: 4,
      minScaleRatio: 0.75,
    }),
  ],
};
```

### CSS Transformation Example

#### Input:
```css
.hero-title {
  font-size: 48px;
  margin-bottom: 24px;
  padding: 16px 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0; /* Kept intact: below threshold */
}
```

#### Output:
```css
.hero-title {
  font-size: clamp(2.25rem, 1.9859rem + 1.1268vw, 3rem);
  margin-bottom: clamp(1.125rem, 0.993rem + 0.5634vw, 1.5rem);
  padding: clamp(0.75rem, 0.662rem + 0.3756vw, 1rem) clamp(1.5rem, 1.3239rem + 0.7512vw, 2rem);
  border-radius: clamp(0.375rem, 0.331rem + 0.1878vw, 0.5rem);
  border: 1px solid #e2e8f0;
}
```

### Selective Opt-Out (`/* fluid-ignore */`)

Opt out specific declarations or rules from being converted using `/* fluid-ignore */`:

```css
.card {
  /* Ignored using an inline comment */
  padding: 24px /* fluid-ignore */;

  /* Ignored using a preceding comment */
  /* fluid-ignore */
  margin: 32px;

  /* This will be converted normally */
  font-size: 20px;
}
```

### Automatic Safety Guards

1. **Media Query Immunity**: Values inside `@media (...) { ... }` blocks are preserved automatically to respect intentional breakpoint overrides.
2. **Hairline & Border Protection**: Pixel values smaller than `minThresholdPx` (default `4px`, e.g., `1px`, `2px`) are never scaled.
3. **Pre-existing Clamps**: Any property already using `clamp()` is preserved as-is.

### PostCSS Options Reference

```ts
import type { PostcssFluidOptions } from '@bingvader/fluid-scale/postcss';
```

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `properties` | `string[]` | See below | List of CSS properties to transform (case-insensitive). |
| `minThresholdPx`| `number` | `4` | Absolute pixel values strictly below this threshold are ignored. |
| `minViewport` | `number` | `375` | Minimum viewport width in pixels. |
| `maxViewport` | `number` | `1440` | Maximum viewport width in pixels. |
| `minScaleRatio` | `number` | `0.75` | Default scale ratio to calculate minimum size. |
| `rootFontSize` | `number` | `16` | Root font size in pixels for rem conversion. |

**Default transformed properties:**  
`font-size`, `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`, `padding-inline`, `padding-block`, `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left`, `margin-inline`, `margin-block`, `gap`, `row-gap`, `column-gap`, `border-radius`.

---

## React Adapter

### `<FluidGrid />`

A responsive CSS Grid container component that auto-fits items into columns using `minItemWidth` and dynamically calculates fluid gaps:

```tsx
import React from 'react';
import { FluidGrid } from '@bingvader/fluid-scale/react';

export function ProductGrid() {
  return (
    <FluidGrid
      minItemWidth={280}
      gap={24}
      minGap={12}
      as="section"
      className="product-shelf"
    >
      <div className="card">Product 1</div>
      <div className="card">Product 2</div>
      <div className="card">Product 3</div>
    </FluidGrid>
  );
}
```

#### `<FluidGrid />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `minItemWidth` | `number` | `280` | Minimum column width in pixels (`minmax(min(100%, ${minItemWidth}px), 1fr))`). |
| `gap` | `number` | `16` | Gap in pixels at maximum viewport width. |
| `minGap` | `number` | `gap * 0.75` | Optional gap in pixels at minimum viewport width. |
| `config` | `FluidConfig` | `undefined` | Custom fluid bounds (`minViewport`, `maxViewport`, etc.). |
| `as` | `ElementType` | `'div'` | Polymorphic element or component to render as (`'section'`, `'ul'`, etc.). |
| `style` | `CSSProperties`| `undefined` | Inline styles merged with grid styles. |
| `ref` | `Ref<HTMLDivElement>` | `undefined` | Forwarded ref to the rendered DOM element. |

---

### `useLayoutGuard`

A development-time layout auditor hook that warns you about horizontal overflows and touch-target accessibility issues on mobile screens:

```tsx
import { useLayoutGuard } from '@bingvader/fluid-scale/react';

export function App() {
  // Pass true or an options object
  useLayoutGuard({
    minTouchTargetSize: 44, // WCAG minimum touch target in px
    warnInConsole: true,
  });

  return <main>{/* Your application */}</main>;
}
```

#### What `useLayoutGuard` Inspects:
1. **Horizontal Scroll / Overflow**: Identifies DOM elements wider than `document.documentElement.clientWidth` causing unintended horizontal scrolling.
2. **Touch Target Size (< 44px)**: When viewport width is below mobile thresholds, audits interactive elements (`<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `role="button"`) whose bounding rectangle is smaller than `minTouchTargetSize`.
3. **Zero Production Overhead**: Automatically no-ops when `process.env.NODE_ENV === 'production'` or during Server-Side Rendering (SSR).

---

## React Native Adapter: `useFluidNative`

Fluid scaling hook designed specifically for React Native. Responds in real-time to screen orientation shifts, Android split-screen window resizing, and foldable devices.

### Hook Usage

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFluidNative } from '@bingvader/fluid-scale/native';

export function ResponsiveCard() {
  const { scale, verticalScale, moderateScale, isTablet } = useFluidNative({
    guidelineBaseWidth: 375,  // Prototype base width (e.g. iPhone SE / X)
    guidelineBaseHeight: 812, // Prototype base height
    maxTabletScale: 1.35,     // Tablet scaling limit
  });

  return (
    <View
      style={{
        padding: scale(16),
        marginVertical: verticalScale(12),
        borderRadius: moderateScale(8, 0.3),
      }}
    >
      <Text style={{ fontSize: moderateScale(18) }}>
        {isTablet ? 'Tablet View' : 'Mobile View'}
      </Text>
    </View>
  );
}
```

### Tablet Damping & Scaling Cap

On tablets (screens where `Math.min(width, height) >= 600`), unrestricted scaling can produce awkwardly large UI elements. `useFluidNative` automatically caps horizontal and vertical scaling multipliers to `maxTabletScale` (default `1.35`), ensuring a balanced visual hierarchy.

All returned pixel values are rounded to the device's physical pixel grid using `PixelRatio.roundToNearestPixel` to prevent blurry sub-pixel borders and rendering artifacts.

### Native API Reference

```ts
function useFluidNative(options?: NativeScaleOptions): FluidNativeResult
```

#### `NativeScaleOptions`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `guidelineBaseWidth` | `number` | `375` | Base design prototype width in dp. |
| `guidelineBaseHeight`| `number` | `812` | Base design prototype height in dp. |
| `maxTabletScale` | `number` | `1.35` | Maximum scale multiplier allowed on tablets. |

#### `FluidNativeResult`

| Property | Type | Description |
| :--- | :--- | :--- |
| `scale(size)` | `(size: number) => number` | Linear horizontal scale based on current width. |
| `verticalScale(size)` | `(size: number) => number` | Linear vertical scale based on current height. |
| `moderateScale(size, factor?)` | `(size: number, factor?: number) => number` | Damped scaling (default factor `0.5`). Size + (scale(size) - size) * factor. |
| `isTablet` | `boolean` | `true` if `Math.min(width, height) >= 600dp`. |
| `width` | `number` | Current window width in dp. |
| `height` | `number` | Current window height in dp. |

---

## TypeScript

`@bingvader/fluid-scale` is written entirely in TypeScript with strict null checks. Full TypeScript definitions and source maps (`.d.mts`, `.d.cts`) are bundled for every subpath export.

---

## License

[MIT](LICENSE) © [BingVader](https://github.com/BingVader)
