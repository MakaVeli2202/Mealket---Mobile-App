const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const gestureHandlerWebMock = path.resolve(__dirname, 'src/gesture-handler-web-mock.js');

// react-native-screens 4.x sets "react-native": "src/index" in package.json.
// Metro's resolverMainFields gives "react-native" priority over "main", so it
// resolves to the TypeScript source which has codegen types Metro can't parse.
// Force all react-native-screens imports to the pre-built commonjs output.
const screensMain = path.resolve(__dirname, 'node_modules/react-native-screens/lib/commonjs/index.js');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-gesture-handler') {
    return { filePath: gestureHandlerWebMock, type: 'sourceFile' };
  }
  if (moduleName === 'react-native-screens') {
    return { filePath: screensMain, type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = wrapWithReanimatedMetroConfig(config);
