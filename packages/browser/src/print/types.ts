export interface PrintDocumentOptions {
	readonly target?: Window | Document | HTMLElement | HTMLIFrameElement | undefined;
	readonly pageTitle?: string | undefined;
	readonly cleanChrome?: boolean | undefined;
	readonly beforePrint?: (() => void | Promise<void>) | undefined;
	readonly afterPrint?: (() => void | Promise<void>) | undefined;
}

export interface ExportPdfOptions extends PrintDocumentOptions {
	readonly filename?: string | undefined;
}
