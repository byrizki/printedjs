import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export interface TraceEvent {
	readonly type: "phase" | "plugin" | "warning";
	readonly name: string;
	readonly durationMs?: number | undefined;
	readonly details?: Record<string, unknown> | undefined;
}

export interface TraceReport {
	readonly startTime: number;
	readonly totalDurationMs: number;
	readonly pageCount: number;
	readonly events: readonly TraceEvent[];
}

export class TraceCollector {
	private readonly events: TraceEvent[] = [];
	private startTime = 0;

	start(): void {
		this.events.length = 0;
		this.startTime = performance.now();
	}

	recordEvent(event: TraceEvent): void {
		this.events.push(event);
	}

	generateReport(pageCount: number): TraceReport {
		const totalDurationMs = performance.now() - this.startTime;
		return {
			startTime: this.startTime,
			totalDurationMs,
			pageCount,
			events: [...this.events],
		};
	}
}

export interface DevtoolsPluginOptions {
	readonly onReport?: ((report: TraceReport) => void) | undefined;
}

export function devtoolsPlugin(options?: DevtoolsPluginOptions): PrintedjsPlugin {
	const collector = new TraceCollector();

	return {
		name: "devtools-trace",
		setup() {
			collector.start();
			collector.recordEvent({ type: "phase", name: "setup" });
		},
		transformStyles(css: string) {
			const start = performance.now();
			collector.recordEvent({
				type: "phase",
				name: "transformStyles",
				durationMs: performance.now() - start,
			});
			return css;
		},
		beforeLayout() {
			collector.recordEvent({ type: "phase", name: "beforeLayout" });
		},
		afterRender(context: PluginContext) {
			const metaCount =
				typeof context.metadata["pageCount"] === "number"
					? context.metadata["pageCount"]
					: undefined;
			const pages = (context.metadata["pages"] as unknown[]) ?? [];
			const doc = context.metadata["document"] as Document | undefined;
			const domCount = doc
				? doc.querySelectorAll(".printedjs_page, .pagedjs_page, [data-page-number]")
						.length
				: 0;
			const pageCount =
				typeof metaCount === "number" && metaCount > 0
					? metaCount
					: pages.length > 0
						? pages.length
						: domCount;

			collector.recordEvent({
				type: "phase",
				name: "afterRender",
				details: { pageCount },
			});

			const report = collector.generateReport(pageCount);
			if (options?.onReport) {
				options.onReport(report);
			}
		},
	};
}
