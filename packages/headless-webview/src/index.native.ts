export { HeadlessWebView } from "./services/HeadlessWebViewServiceMobile.js";

export { useHeadlessWebView } from "./hooks/useHeadlessWebView.js";

export type { UseHeadlessWebViewResult } from "./hooks/useHeadlessWebView.js";

export {
	getCustomNativeModule,
	getNativeModule,
	NativeHeadlessWebView,
	registerNativeModule,
} from "./native/NativeHeadlessWebViewMobile.js";

export type { NativeHeadlessWebViewSpec } from "./native/NativeHeadlessWebViewMobile.js";

export type {
	HeadlessRenderResult,
	HeadlessWebViewConfig,
	PageLoadStatus,
	PdfPrintOptions,
} from "./types/index.js";

/**
 * On mobile React Native (iOS & Android), the desktop bridge is not available.
 * Use the native WebKit / Android WebView modules instead.
 */
export const enableDesktopBridge = (): never => {
	throw new Error(
		"enableDesktopBridge is only available on desktop platforms (macOS, Windows, Linux).",
	);
};

export const isDesktopSupported = (): boolean => false;

export const resolveDesktopBinary = (): never => {
	throw new Error(
		"Desktop headless-webview binary is not supported on mobile platforms.",
	);
};
