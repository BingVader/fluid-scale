import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'postcss/index': 'src/postcss/index.ts',
    'react/index': 'src/react/index.ts',
    'native/index': 'src/native/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  deps: {
    neverBundle: ['postcss', 'react', 'react-dom', 'react-native'],
  },
});
