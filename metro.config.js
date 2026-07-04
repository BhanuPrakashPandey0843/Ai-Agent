const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Required for Firebase v10+ with Expo SDK 51
config.resolver.unstable_enablePackageExports = false;

// Ensure .cjs files are resolved (Firebase uses them)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Prevent duplicate React errors from hoisted modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Ignore node_modules to prevent OOM errors
config.watchFolders = config.watchFolders.filter(folder => !folder.includes('node_modules'));

module.exports = config;
