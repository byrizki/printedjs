import { PrintedjsLayoutLimitError } from "../contracts/errors.js";
import type { BreakCursor } from "./break-state.js";

export interface ProgressGuardOptions {
	readonly maxPages?: number;
	readonly maxLayoutPasses?: number;
}

export class LayoutProgressGuard {
	private readonly maxPages: number;
	private readonly maxLayoutPasses: number;
	private passes = 0;
	private pages = 0;
	private readonly seenBreakStates = new Set<string>();

	constructor(options?: ProgressGuardOptions) {
		this.maxPages = options?.maxPages ?? 5000;
		this.maxLayoutPasses = options?.maxLayoutPasses ?? 50000;
	}

	get pageCount(): number {
		return this.pages;
	}

	get passCount(): number {
		return this.passes;
	}

	private lastCursor: string | undefined;
	private repeatedCursorCount = 0;

	record(state: BreakCursor): void {
		this.passes++;
		this.pages = Math.max(this.pages, state.page);

		if (state.page > this.maxPages) {
			throw new PrintedjsLayoutLimitError(
				`Maximum page limit (${this.maxPages}) exceeded at page ${state.page}`,
			);
		}

		if (this.passes > this.maxLayoutPasses) {
			throw new PrintedjsLayoutLimitError(
				`Maximum layout passes limit (${this.maxLayoutPasses}) exceeded`,
			);
		}

		const key = `${state.page}:${state.cursor}`;
		if (this.seenBreakStates.has(key)) {
			throw new PrintedjsLayoutLimitError(
				`Repeated break state detected at page ${state.page} cursor "${state.cursor}"`,
			);
		}
		this.seenBreakStates.add(key);

		if (
			this.lastCursor !== undefined &&
			state.cursor === this.lastCursor &&
			state.cursor !== "start"
		) {
			this.repeatedCursorCount++;
			if (this.repeatedCursorCount >= 1) {
				throw new PrintedjsLayoutLimitError(
					`Non-progressing layout: repeated cursor "${state.cursor}" detected across consecutive pages (${state.page})`,
				);
			}
		} else {
			this.repeatedCursorCount = 0;
			this.lastCursor = state.cursor;
		}
	}
}
