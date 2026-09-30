import { PrintedjsAbortError } from "../contracts/errors.js";
import type { RenderLimits } from "../contracts/request.js";
import type { PageResult, RenderResult } from "../contracts/result.js";
import type { RenderProgressEvent } from "../runtime/render-session.js";
import type { BreakCursor, BreakToken } from "./break-state.js";
import { LayoutProgressGuard } from "./progress-guard.js";

export interface LayoutStepResult {
	readonly breakToken: BreakToken | null;
	readonly pageResult: PageResult;
}

export interface PaginatorAdapter {
	prepare?(): Promise<void> | void;
	hasNextContent(cursor?: BreakCursor): boolean;
	layoutPage(
		pageNumber: number,
		prevToken?: BreakToken | null,
	): Promise<LayoutStepResult>;
	finish?(): Promise<void> | void;
}

export interface PaginatorOptions {
	readonly limits?: RenderLimits | undefined;
	readonly signal?: AbortSignal | undefined;
	readonly startPage?: number | undefined;
	readonly initialPages?: readonly PageResult[] | undefined;
	readonly initialToken?: BreakToken | null | undefined;
	readonly onProgress?: ((event: RenderProgressEvent) => void) | undefined;
}

export class Paginator {
	constructor(
		private readonly adapter: PaginatorAdapter,
		private readonly options?: PaginatorOptions | undefined,
	) {}

	async paginate(): Promise<RenderResult> {
		const startTime = performance.now();
		const signal = this.options?.signal;
		if (signal?.aborted) {
			throw new PrintedjsAbortError("Pagination aborted before execution");
		}

		const maxPages = this.options?.limits?.maxPages ?? 1000;
		const maxLayoutPasses = this.options?.limits?.maxLayoutPasses ?? 5000;
		const guard = new LayoutProgressGuard({ maxPages, maxLayoutPasses });

		if (this.adapter.prepare) {
			await this.adapter.prepare();
		}

		const pages: PageResult[] = this.options?.initialPages
			? [...this.options.initialPages]
			: [];
		let pageNumber = this.options?.startPage ?? pages.length + 1;
		let currentToken: BreakToken | null = this.options?.initialToken ?? null;

		while (
			this.adapter.hasNextContent(
				currentToken
					? { page: currentToken.page, cursor: currentToken.cursor }
					: undefined,
			)
		) {
			if (signal?.aborted) {
				throw new PrintedjsAbortError("Pagination aborted during execution");
			}

			const cursorKey = currentToken?.cursor ?? "start";
			guard.record({ page: pageNumber, cursor: cursorKey });

			const currentTotal = Math.max(pages.length + 1, pageNumber);
			this.options?.onProgress?.({
				phase: "paginating",
				pageNumber,
				cursor: cursorKey,
				totalPages: currentTotal,
				pageCount: currentTotal,
				total: currentTotal,
			});

			const step = await this.adapter.layoutPage(pageNumber, currentToken);
			pages.push(step.pageResult);

			if (step.breakToken) {
				currentToken = step.breakToken;
				if (step.breakToken.finished) {
					break;
				}
			} else {
				break;
			}

			pageNumber++;
		}

		if (this.adapter.finish) {
			await this.adapter.finish();
		}

		const durationMs = performance.now() - startTime;

		return {
			pages,
			metrics: {
				pageCount: pages.length,
				layoutPasses: guard.passCount,
				durationMs,
			},
			warnings: [],
			metadata: {},
		};
	}
}
