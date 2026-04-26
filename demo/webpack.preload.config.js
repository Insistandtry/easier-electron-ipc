const path = require('path');

module.exports = {
  mode: 'development',
  target: 'electron-preload',
  entry: './src/preload/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/preload'),
    filename: 'index.js',
    library: {
      type: 'commonjs'
    }
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.preload.json'
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    electron: 'commonjs electron'
  },
  externalsPresets: {
    electronPreload: true
  }
};