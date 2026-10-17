import { NativeHeadlessWebView } from "../native/NativeHeadlessWebView.js";
import type { HeadlessWebViewConfig } from "../types/config.js";
import type {
	PdfPrintOptions,
	WaitForFunctionOptions,
	WaitForFunctionPredicate,
} from "../types/options.js";

function isFunctionPredicate(
	value: WaitForFunctionPredicate,
): value is () => boolean | string | number | null | undefined {
	return value instanceof Function;
}

const base64ToUint8Array = (base64String: string): Uint8Array => {
	if (typeof Buffer !== "undefined") {
		return Uint8Array.from(Buffer.from(base64String, "base64"));
	}

	const binaryString = atob(base64String);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);

	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return bytes;
};

export class HeadlessWebView {
	private readonly instanceId: string;
	private isDestroyed = false;

	private constructor(instanceId: string) {
		this.instanceId = instanceId;
	}

	public get id(): string {
		return this.instanceId;
	}

	public get isDisposed(): boolean {
		return this.isDestroyed;
	}

	public static async create(
		config: HeadlessWebViewConfig = {},
	): Promise<HeadlessWebView> {
		const instanceId = await NativeHeadlessWebView.createInstance(config);

		return new HeadlessWebView(instanceId);
	}

	public async loadHtml(html: string): Promise<void> {
		this.assertActive();

		await NativeHeadlessWebView.loadHtml(this.instanceId, html);
	}

	public async loadUrl(url: string): Promise<void> {
		this.assertActive();

		await NativeHeadlessWebView.loadUrl(this.instanceId, url);
	}

	public async evaluateJavascript(script: string): Promise<string> {
		this.assertActive();

		return await NativeHeadlessWebView.evalScript(this.instanceId, script);
	}

	public async waitForFunction(
		fnOrExpression: WaitForFunctionPredicate,
		options: WaitForFunctionOptions = {},
	): Promise<void> {
		this.assertActive();

		const timeoutMs = options.timeoutMs ?? options.timeout ?? 15000;
		const pollingIntervalMs = options.pollingIntervalMs ?? options.polling ?? 50;

		let scriptExpr: string;

		if (isFunctionPredicate(fnOrExpression)) {
			scriptExpr = `(${fnOrExpression.toString()})()`;
		} else {
			const trimmed = fnOrExpression.trim();

			const isFunctionSyntax =
				/^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[a-zA-Z_$][a-zA-Z0-9_$]*\s*=>)/.test(
					trimmed,
				);

			scriptExpr = isFunctionSyntax ? `(${trimmed})()` : `(${trimmed})`;
		}

		const evalPayload = `(function() {
			try {
				var res = ${scriptExpr};
				return (typeof res === "function" ? Boolean(res()) : Boolean(res)) ? "true" : "false";
			} catch (e) {
				return "false";
			}
		})()`;

		const startTime = Date.now();

		while (true) {
			this.assertActive();

			const rawResult = await this.evaluateJavascript(evalPayload);
			const cleanResult = rawResult.trim().replace(/^["']|["']$/g, "");

			if (cleanResult === "true" || cleanResult === "1") {
				return;
			}

			if (Date.now() - startTime >= timeoutMs) {
				throw new Error(
					`waitForFunction timed out after ${timeoutMs}ms waiting for condition to be truthy.`,
				);
			}

			await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));
		}
	}

	public async printToPdf(options: PdfPrintOptions = {}): Promise<Uint8Array> {
		this.assertActive();

		const base64Pdf = await NativeHeadlessWebView.printToPdf(this.instanceId, options);

		return base64ToUint8Array(base64Pdf);
	}

	public async printToPdfFile(
		filePath: string,
		options: PdfPrintOptions = {},
	): Promise<void> {
		this.assertActive();

		await NativeHeadlessWebView.printToPdfFile(this.instanceId, filePath, options);
	}

	public async destroy(): Promise<void> {
		if (this.isDestroyed) {
			return;
		}

		this.isDestroyed = true;

		await NativeHeadlessWebView.destroyInstance(this.instanceId);
	}

	public async dispose(): Promise<void> {
		await this.destroy();
	}

	public async [Symbol.asyncDispose](): Promise<void> {
		await this.destroy();
	}

	private assertActive(): void {
		if (this.isDestroyed) {
			throw new Error("Cannot interact with a destroyed HeadlessWebView instance.");
		}
	}
}
