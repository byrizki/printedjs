export { HeadlessWebView } from "./services/HeadlessWebViewService.js";

export { useHeadlessWebView } from "./hooks/useHeadlessWebView.js";

export type { UseHeadlessWebViewResult } from "./hooks/useHeadlessWebView.js";

export {
	getCustomNativeModule,
	getNativeModule,
	NativeHeadlessWebView,
	registerNativeModule,
} from "./native/NativeHeadlessWebView.js";

export {
	DesktopNativeHeadlessWebView,
	isDesktopSupported,
	resolveDesktopBinary,
	type DesktopBridgeCallStats,
} from "./native/DesktopNativeHeadlessWebView.js";

export type { NativeHeadlessWebViewSpec } from "./native/NativeHeadlessWebView.js";

export type {
	HeadlessRenderResult,
	HeadlessWebViewConfig,
	PageLoadStatus,
	PdfPrintOptions,
	WaitForFunctionOptions,
	WaitForFunctionPredicate,
} from "./types/index.js";

import { DesktopNativeHeadlessWebView } from "./native/DesktopNativeHeadlessWebView.js";
import { registerNativeModule } from "./native/NativeHeadlessWebView.js";

/**
 * Harness helper to activate the desktop native headless webview bridge for React Native Desktop or test environments.
 */
export const enableDesktopBridge = (): DesktopNativeHeadlessWebView => {
	const desktop = new DesktopNativeHeadlessWebView();

	registerNativeModule(desktop);

	return desktop;
};
