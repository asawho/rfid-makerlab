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
      { from: './client/static' },
      { from: './server/', to: '../', ignore: 'config.js' },
      { from: './devices/', to: '../devices', ignore: 'config.js'}
      //{ from: './server/pm2-server.json', to: '../' },
      //{ from: './server/data', to: '../data' }
    ])
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
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
