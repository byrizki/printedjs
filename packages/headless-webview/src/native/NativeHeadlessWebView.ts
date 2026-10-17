import type { TurboModule } from "react-native";
import type { HeadlessWebViewConfig } from "../types/config.js";
import type { PdfPrintOptions } from "../types/options.js";
import { getCustomNativeModule, registerNativeModule } from "./customModule.js";

/**
 * TurboModule Spec interface conforming to React Native Codegen specification for New Architecture.
 */
export interface Spec extends TurboModule {
	createInstance(config: HeadlessWebViewConfig): Promise<string>;
	loadHtml(instanceId: string, html: string): Promise<void>;
	loadUrl(instanceId: string, url: string): Promise<void>;
	evalScript(instanceId: string, script: string): Promise<string>;
	printToPdf(instanceId: string, options: PdfPrintOptions): Promise<string>;
	printToPdfFile(
		instanceId: string,
		filePath: string,
		options: PdfPrintOptions,
	): Promise<void>;
	destroyInstance(instanceId: string): Promise<void>;
}

export type NativeHeadlessWebViewSpec = Spec;

export { getCustomNativeModule, registerNativeModule };

/**
 * Resolves the native module in universal / desktop / test environments.
 */
export const getNativeModule = (): NativeHeadlessWebViewSpec => {
	const custom = getCustomNativeModule();

	if (custom) {
		return custom;
	}

	// SAFETY: Inspect global namespace in desktop or testing environment for React Native runtime globals.
	const rnGlobal = globalThis as {
		TurboModuleRegistry?: {
			get<T>(name: string): T | null;
		};
		NativeModules?: {
			HeadlessWebviewModule?: NativeHeadlessWebViewSpec;
		};
	};

	// 1. New Architecture (TurboModule) via global registry if present
	if (rnGlobal.TurboModuleRegistry?.get) {
		const turboModule = rnGlobal.TurboModuleRegistry.get<Spec>("HeadlessWebviewModule");

		if (turboModule) {
			return turboModule;
		}
	}

	// 2. Legacy Architecture (Bridge NativeModules) via global if present
	const bridgeModule = rnGlobal.NativeModules?.HeadlessWebviewModule;

	if (bridgeModule) {
		return bridgeModule;
	}

	// 3. Fallback when module is not linked or running in non-native environment
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
