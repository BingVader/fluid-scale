declare module 'react-native' {
  export interface ScaledSize {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  }
  export function useWindowDimensions(): ScaledSize;
  export namespace PixelRatio {
    export function roundToNearestPixel(layoutSize: number): number;
    export function get(): number;
    export function getFontScale(): number;
    export function getPixelSizeForLayoutSize(layoutSize: number): number;
  }
}
