var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  entry: [
    './client/src/index'
  ],
  output: {
    path: path.join(__dirname, 'build/client'),
    filename: 'bundle.js'
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './client/static' }
    ])
  ],
  resolve: {
    extensions: ['', '.js', '.ts', '.tsx']
  },
  module: {
    loaders: [{
      test: /\.tsx?$/,
      loaders: ['ts-loader'],
      include: path.join(__dirname, 'client/src')
    },
    {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  }
};
