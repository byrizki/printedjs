export interface BreakCursor {
	readonly cursor: string;
	readonly page: number;
	readonly pass?: number;
	readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BreakToken {
	readonly page: number;
	readonly cursor: string;
	readonly finished: boolean;
	readonly metadata?: Readonly<Record<string, unknown>>;
}
