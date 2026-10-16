import { NativeHeadlessWebView } from "../native/NativeHeadlessWebView.js";
import type { HeadlessWebViewConfig } from "../types/config.js";
import type { PdfPrintOptions } from "../types/options.js";

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
