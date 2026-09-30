import { describe, expect, test } from "vitest";
import { PrintedjsAbortError, PrintedjsLayoutLimitError } from "../contracts/errors.js";
import type { BreakToken } from "./break-state.js";
import { Paginator, type LayoutStepResult, type PaginatorAdapter } from "./paginator.js";

describe("Paginator", () => {
	test("returns empty result when adapter has no content", async () => {
		const adapter: PaginatorAdapter = {
			hasNextContent: () => false,
			layoutPage: async () => {
				throw new Error("Should not be called");
			},
		};

		const paginator = new Paginator(adapter);
		const result = await paginator.paginate();

		expect(result.pages).toHaveLength(0);
		expect(result.metrics.pageCount).toBe(0);
		expect(result.metrics.layoutPasses).toBe(0);
	});

	test("paginates content until finished", async () => {
		let remainingItems = 3;
		const adapter: PaginatorAdapter = {
			hasNextContent: () => remainingItems > 0,
			layoutPage: async (pageNumber: number): Promise<LayoutStepResult> => {
				remainingItems--;
				const finished = remainingItems === 0;
				const breakToken: BreakToken = {
					page: pageNumber,
					cursor: `node:${3 - remainingItems}`,
					finished,
				};

				return {
					breakToken: finished ? null : breakToken,
					pageResult: {
						pageNumber,
						box: { width: 816, height: 1056 },
						classes: ["pagedjs_page"],
						metadata: {},
					},
				};
			},
		};

		const paginator = new Paginator(adapter);
		const result = await paginator.paginate();

		expect(result.pages).toHaveLength(3);
		expect(result.metrics.pageCount).toBe(3);
		expect(result.metrics.layoutPasses).toBe(3);
		expect(result.pages[0]?.pageNumber).toBe(1);
		expect(result.pages[2]?.pageNumber).toBe(3);
	});

	test("throws PrintedjsAbortError when signal is already aborted", async () => {
		const controller = new AbortController();
		controller.abort();

		const adapter: PaginatorAdapter = {
			hasNextContent: () => true,
			layoutPage: async () => {
				throw new Error("Should not be called");
			},
		};

		const paginator = new Paginator(adapter, { signal: controller.signal });
		await expect(paginator.paginate()).rejects.toThrow(PrintedjsAbortError);
	});

	test("throws PrintedjsLayoutLimitError when layout loop repeats cursor", async () => {
		const adapter: PaginatorAdapter = {
			hasNextContent: () => true,
			layoutPage: async (pageNumber: number): Promise<LayoutStepResult> => {
				return {
					breakToken: {
						page: pageNumber,
						cursor: "start",
						finished: false,
					},
					pageResult: {
						pageNumber,
						box: { width: 816, height: 1056 },
						classes: ["pagedjs_page"],
						metadata: {},
					},
				};
			},
		};

		const paginator = new Paginator(adapter);
		await expect(paginator.paginate()).rejects.toThrow(PrintedjsLayoutLimitError);
	});

	test("throws PrintedjsLayoutLimitError when maxPages limit is reached", async () => {
		let index = 0;
		const adapter: PaginatorAdapter = {
			hasNextContent: () => true,
			layoutPage: async (pageNumber: number): Promise<LayoutStepResult> => {
				index++;
				return {
					breakToken: {
						page: pageNumber,
						cursor: `cursor:${index}`,
						finished: false,
					},
					pageResult: {
						pageNumber,
						box: { width: 816, height: 1056 },
						classes: ["pagedjs_page"],
						metadata: {},
					},
				};
			},
		};

		const paginator = new Paginator(adapter, { limits: { maxPages: 2 } });
		await expect(paginator.paginate()).rejects.toThrow(PrintedjsLayoutLimitError);
	});

	test("supports incremental pagination starting from specified page with cached initial pages", async () => {
		const cachedPage = {
			pageNumber: 1,
			box: { width: 816, height: 1056 },
			classes: ["pagedjs_page"],
			metadata: {},
		};

		let callCount = 0;
		const progressEvents: number[] = [];
		const adapter: PaginatorAdapter = {
			hasNextContent: () => callCount < 2,
			layoutPage: async (pageNumber: number): Promise<LayoutStepResult> => {
				callCount++;
				const finished = callCount === 2;
				return {
					breakToken: {
						page: pageNumber,
						cursor: `node:${pageNumber}`,
						finished,
					},
					pageResult: {
						pageNumber,
						box: { width: 816, height: 1056 },
						classes: ["pagedjs_page"],
						metadata: {},
					},
				};
			},
		};

		const paginator = new Paginator(adapter, {
			startPage: 2,
			initialPages: [cachedPage],
			onProgress: (event) => {
				if (event.pageNumber) {
					progressEvents.push(event.pageNumber);
				}
			},
		});

		const result = await paginator.paginate();
		expect(result.pages).toHaveLength(3);
		expect(result.pages[0]?.pageNumber).toBe(1);
		expect(result.pages[1]?.pageNumber).toBe(2);
		expect(result.pages[2]?.pageNumber).toBe(3);
		expect(progressEvents).toEqual([2, 3]);
	});
});
