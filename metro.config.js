const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// expo-sqlite ships a wasm build for web; Metro needs to treat it as an asset.
config.resolver.assetExts.push("wasm");

// wa-sqlite uses SharedArrayBuffer, which browsers only expose to
// cross-origin-isolated documents.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  return middleware(req, res, next);
};

module.exports = config;
