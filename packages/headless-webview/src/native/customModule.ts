import type { NativeHeadlessWebViewSpec } from "./NativeHeadlessWebView.js";

let customModule: NativeHeadlessWebViewSpec | null = null;

/**
 * Explicitly registers a native module implementation (useful for React Native Desktop or test harness integration).
 */
export const registerNativeModule = (module: NativeHeadlessWebViewSpec | null): void => {
	customModule = module;
};

/**
 * Returns the currently registered custom native module, if any.
 */
export const getCustomNativeModule = (): NativeHeadlessWebViewSpec | null => {
	return customModule;
};
