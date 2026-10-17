export interface PdfPrintOptions {
	landscape?: boolean;
	pageWidth?: number;
	pageHeight?: number;
	marginTop?: number;
	marginBottom?: number;
	marginLeft?: number;
	marginRight?: number;
	printBackground?: boolean;
	scale?: number;
}

export type WaitForFunctionPredicate =
	| string
	| (() => boolean | string | number | null | undefined);

export interface WaitForFunctionOptions {
	/**
	 * Maximum time to wait in milliseconds. Defaults to 15000 (15 seconds).
	 */
	timeoutMs?: number;
	/**
	 * Shorthand alias for timeoutMs.
	 */
	timeout?: number;
	/**
	 * Polling interval in milliseconds between evaluations. Defaults to 50ms.
	 */
	pollingIntervalMs?: number;
	/**
	 * Shorthand alias for pollingIntervalMs.
	 */
	polling?: number;
}
