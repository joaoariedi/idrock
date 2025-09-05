import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

const production = !process.env.ROLLUP_WATCH;

export default [
  // ES Module build
  {
    input: 'src/idrock.js',
    output: {
      file: 'dist/idrock.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            modules: false,
            targets: {
              browsers: ['> 1%', 'last 2 versions']
            }
          }]
        ]
      }),
      production && terser()
    ],
    external: ['@fingerprintjs/fingerprintjs', 'axios']
  },
  // UMD build
  {
    input: 'src/idrock.js',
    output: {
      file: 'dist/idrock.js',
      format: 'umd',
      name: 'IdRock',
      sourcemap: true,
      globals: {
        '@fingerprintjs/fingerprintjs': 'FingerprintJS',
        'axios': 'axios'
      }
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            modules: false,
            targets: {
              browsers: ['> 1%', 'last 2 versions']
            }
          }]
        ]
      }),
      production && terser()
    ],
    external: ['@fingerprintjs/fingerprintjs', 'axios']
  },
  // Bundled build (includes dependencies)
  {
    input: 'src/idrock.js',
    output: {
      file: 'dist/idrock.bundle.js',
      format: 'umd',
      name: 'IdRock',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      json(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            modules: false,
            targets: {
              browsers: ['> 1%', 'last 2 versions']
            }
          }]
        ]
      }),
      production && terser()
    ]
  }
];