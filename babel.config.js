module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated v4 usa el plugin de worklets. DEBE ir al final de la lista.
    // Sin él, Reanimated no inicializa y las animaciones (p. ej. `animate-pulse`
    // de NativeWind) fallan con "Cannot read property 'makeMutable' of undefined".
    plugins: ["react-native-worklets/plugin"],
  };
};
