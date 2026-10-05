import type { ResultMetadata } from "../contracts/result.js";

export interface BreakCursor {
	readonly cursor: string;
	readonly page: number;
	readonly pass?: number;
	readonly metadata?: ResultMetadata;
}

export interface BreakToken {
	readonly page: number;
	readonly cursor: string;
	readonly finished: boolean;
	readonly metadata?: ResultMetadata;
}
