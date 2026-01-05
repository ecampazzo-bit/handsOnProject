module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Desactivar Expo Router
          jsxImportSource: 'react',
        },
      ],
    ],
    plugins: [
      // El plugin de reanimated debe ser el último
      'react-native-reanimated/plugin',
    ],
  };
};


