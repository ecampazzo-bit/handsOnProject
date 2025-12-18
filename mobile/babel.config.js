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
  };
};


