const path = require("path");

const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const root = path.resolve(__dirname, "../../..");

const pak = path.resolve(__dirname, "..");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
	watchFolders: [root, pak],
	resolver: {
		nodeModulesPaths: [
			path.resolve(__dirname, "node_modules"),
			path.resolve(root, "node_modules"),
		],
		extraNodeModules: {
			"@printedjs/headless-webview": pak,
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
