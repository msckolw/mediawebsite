const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util/"),
    "buffer": require.resolve("buffer/"),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ]);
  
  // Ensure HMR is enabled
  config.devServer = {
    ...config.devServer,
    hot: true,
    liveReload: true,
  };
  
  return config;
}; 