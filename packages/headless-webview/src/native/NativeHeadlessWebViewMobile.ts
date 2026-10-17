import { NativeModules, TurboModuleRegistry } from "react-native";
import { getCustomNativeModule, registerNativeModule } from "./customModule.js";
import type { NativeHeadlessWebViewSpec, Spec } from "./NativeHeadlessWebView.js";

export type { NativeHeadlessWebViewSpec, Spec };

export { getCustomNativeModule, registerNativeModule };

/**
 * Resolves the native module in React Native mobile environments across New Architecture and Legacy Architecture.
 */
export const getNativeModule = (): NativeHeadlessWebViewSpec => {
	const custom = getCustomNativeModule();

	if (custom) {
		return custom;
	}

	// SAFETY: Inspect runtime environment for React Native TurboModuleRegistry or NativeModules bridge.
	const rnGlobal = globalThis as {
		TurboModuleRegistry?: {
			get<T>(name: string): T | null;
		};
		NativeModules?: {
			HeadlessWebviewModule?: NativeHeadlessWebViewSpec;
		};
	};

	// 1. New Architecture (TurboModule)
	if (TurboModuleRegistry?.get) {
		const turboModule = TurboModuleRegistry.get<Spec>("HeadlessWebviewModule");

		if (turboModule) {
			return turboModule;
		}
	}

	if (rnGlobal.TurboModuleRegistry?.get) {
		const turboModule = rnGlobal.TurboModuleRegistry.get<Spec>("HeadlessWebviewModule");

		if (turboModule) {
			return turboModule;
		}
	}

	// 2. Legacy Architecture (Bridge NativeModules)
	// SAFETY: Cast legacy NativeModules bridge property to NativeHeadlessWebViewSpec interface.
	const bridgeModule =
		(NativeModules?.HeadlessWebviewModule as NativeHeadlessWebViewSpec | undefined) ??
		rnGlobal.NativeModules?.HeadlessWebviewModule;

	if (bridgeModule) {
		return bridgeModule;
	}

	// 3. Fallback when module is not linked or unavailable
	return {
		createInstance: async () => {
			throw new Error(
				"NativeHeadlessWebView module is not linked or unavailable in this environment.",
			);
		},

		loadHtml: async () => {
			throw new Error("NativeHeadlessWebView module is not linked.");
		},

		loadUrl: async () => {
			throw new Error("NativeHeadlessWebView module is not linked.");
		},

		evalScript: async () => {
			throw new Error("NativeHeadlessWebView module is not linked.");
		},

		printToPdf: async () => {
			throw new Error("NativeHeadlessWebView module is not linked.");
		},

		printToPdfFile: async () => {
			throw new Error("NativeHeadlessWebView module is not linked.");
		},

		destroyInstance: async () => {},
	};
};

// SAFETY: Empty proxy target is never accessed directly; all property lookups delegate dynamically to getNativeModule().
export const NativeHeadlessWebView: NativeHeadlessWebViewSpec = new Proxy(
	{} as NativeHeadlessWebViewSpec,
	{
		get(_target, prop: keyof NativeHeadlessWebViewSpec) {
			const mod = getNativeModule();

			// SAFETY: NativeHeadlessWebViewSpec methods must preserve this context bound to the resolved native module instance.
			const method = mod[prop] as (...callArgs: readonly never[]) => never;

			return method.bind(mod);
		},
	},
);

export default NativeHeadlessWebView;
