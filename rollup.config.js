import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'electron',
  'events',
  'path',
  'fs'
];

const commonConfig = {
  input: 'src/index.ts',
  external,
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      outDir: 'dist',
    }),
  ],
};

export default [
  // CommonJS build
  {
    ...commonConfig,
    output: {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
  },
  // ES modules build
  {
    ...commonConfig,
    output: {
      file: pkg.module || 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
  },
];
