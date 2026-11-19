# fluid-scale

Fluid responsive scaling utilities and platform adapters created by BingVader.

## Modules

- `fluid-scale`: Core linear clamp calculation (`computeClamp`).
- `fluid-scale/postcss`: Build-time PostCSS plugin (`postcssFluidScale`).
- `fluid-scale/react`: React components (`FluidGrid`) and layout guards (`useLayoutGuard`).
- `fluid-scale/native`: React Native dimensions-aware hook (`useFluidNative`).

## Core Usage

```ts
import { computeClamp } from 'fluid-scale';

const fontSize = computeClamp(32, 16);
```

## PostCSS Plugin

```js
import postcssFluidScale from 'fluid-scale/postcss';

export default {
  plugins: [
    postcssFluidScale({
      minViewport: 375,
      maxViewport: 1440,
      minThresholdPx: 4,
    }),
  ],
};
```

Declarations can opt out using `/* fluid-ignore */`. Media queries and values below `minThresholdPx` are automatically preserved.

## React Grid & Layout Guard

```tsx
import { FluidGrid, useLayoutGuard } from 'fluid-scale/react';

export function GridExample() {
  useLayoutGuard();
  return (
    <FluidGrid minItemWidth={280} gap={16}>
      <div>Item</div>
    </FluidGrid>
  );
}
```

## React Native

```tsx
import { useFluidNative } from 'fluid-scale/native';

export function NativeExample() {
  const { scale, moderateScale, isTablet } = useFluidNative();
  return null;
}
```
