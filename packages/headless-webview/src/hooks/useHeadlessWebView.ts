import { useCallback, useEffect, useRef, useState } from "react";
import { HeadlessWebView } from "../services/HeadlessWebViewService.js";
import type { HeadlessWebViewConfig } from "../types/config.js";
import type { PdfPrintOptions } from "../types/options.js";

export interface UseHeadlessWebViewResult {
	isReady: boolean;
	error: Error | null;
	loadHtml: (html: string) => Promise<void>;
	loadUrl: (url: string) => Promise<void>;
	evaluateJavascript: (script: string) => Promise<string>;
	printToPdf: (options?: PdfPrintOptions) => Promise<Uint8Array>;
	printToPdfFile: (filePath: string, options?: PdfPrintOptions) => Promise<void>;
}

export const useHeadlessWebView = (
	config: HeadlessWebViewConfig = {},
): UseHeadlessWebViewResult => {
	const webviewRef = useRef<HeadlessWebView | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isCancelled = false;

		const init = async () => {
			try {
				const instance = await HeadlessWebView.create(config);

				if (isCancelled) {
					await instance.destroy();

					return;
				}

				webviewRef.current = instance;
				setIsReady(true);
				setError(null);
			} catch (err: unknown) {
				if (!isCancelled) {
					setError(err instanceof Error ? err : new Error(String(err)));
					setIsReady(false);
				}
			}
		};

		void init();

		return () => {
			isCancelled = true;

			if (webviewRef.current) {
				void webviewRef.current.destroy();
				webviewRef.current = null;
			}
		};
	}, [config.html, config.url]);

	const loadHtml = useCallback(async (html: string) => {
		if (!webviewRef.current) {
			throw new Error("HeadlessWebView is not initialized");
		}

		await webviewRef.current.loadHtml(html);
	}, []);

	const loadUrl = useCallback(async (url: string) => {
		if (!webviewRef.current) {
			throw new Error("HeadlessWebView is not initialized");
		}

		await webviewRef.current.loadUrl(url);
	}, []);

	const evaluateJavascript = useCallback(async (script: string) => {
		if (!webviewRef.current) {
			throw new Error("HeadlessWebView is not initialized");
		}

		return await webviewRef.current.evaluateJavascript(script);
	}, []);

	const printToPdf = useCallback(async (options: PdfPrintOptions = {}) => {
		if (!webviewRef.current) {
			throw new Error("HeadlessWebView is not initialized");
		}

		return await webviewRef.current.printToPdf(options);
	}, []);

	const printToPdfFile = useCallback(
		async (filePath: string, options: PdfPrintOptions = {}) => {
			if (!webviewRef.current) {
				throw new Error("HeadlessWebView is not initialized");
			}

			await webviewRef.current.printToPdfFile(filePath, options);
		},
		[],
	);

	return {
		isReady,
		error,
		loadHtml,
		loadUrl,
		evaluateJavascript,
		printToPdf,
		printToPdfFile,
	};
};
