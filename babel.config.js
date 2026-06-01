module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    overrides: [
      {
        test: /node_modules[/\\](@firebase|firebase)[/\\]/,
        comments: false,
        compact: true,
      },
    ],
  };
};
