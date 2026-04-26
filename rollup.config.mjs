import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
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
      declarationMap: false,
      outDir: 'dist',
    }),
    terser(),
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
      sourcemap: false,
    },
  },
  // ES modules build
  {
    ...commonConfig,
    output: {
      file: pkg.module || 'dist/index.esm.js',
      format: 'es',
      sourcemap: false,
    },
  },
];
