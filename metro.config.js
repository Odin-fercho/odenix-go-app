process.env.EXPO_NO_CLIENT_ENV_VARS = '1';

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const zustandCjsMap = {
  zustand: 'index.js',
  'zustand/react': 'react.js',
  'zustand/vanilla': 'vanilla.js',
  'zustand/traditional': 'traditional.js',
  'zustand/middleware': 'middleware.js',
  'zustand/shallow': 'shallow.js',
  'zustand/react/shallow': 'react/shallow.js',
  'zustand/vanilla/shallow': 'vanilla/shallow.js',
  'zustand/middleware/immer': 'middleware/immer.js',
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const mappedFile = zustandCjsMap[moduleName];
  if (mappedFile) {
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'node_modules', 'zustand', mappedFile),
    };
  }

  if (typeof originalResolveRequest === 'function') {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
