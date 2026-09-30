import { PrintedjsAbortError } from "../contracts/errors.js";

export type SessionState = "pending" | "running" | "completed" | "aborted" | "destroyed";

export type CleanupTask = () => void | Promise<void>;

export interface RenderProgressEvent {
	readonly phase: "pending" | "running" | "paginating" | "completed";
	readonly pageNumber?: number | undefined;
	readonly totalPages?: number | undefined;
	readonly pageCount?: number | undefined;
	readonly total?: number | undefined;
	readonly cursor?: string | undefined;
}

export type ProgressListener = (event: RenderProgressEvent) => void;

export interface RenderSessionOptions {
	readonly signal?: AbortSignal;
}

export class RenderSession {
	private _state: SessionState = "pending";
	private readonly cleanups: CleanupTask[] = [];
	private readonly progressListeners: ProgressListener[] = [];
	private readonly signal: AbortSignal | undefined;
	private abortListener: (() => void) | undefined;
	private lastTotalPages = 0;

	constructor(options?: RenderSessionOptions) {
		this.signal = options?.signal;
		if (this.signal) {
			if (this.signal.aborted) {
				this._state = "aborted";
			} else {
				this.abortListener = () => {
					void this.abort();
				};
				this.signal.addEventListener("abort", this.abortListener, {
					once: true,
				});
			}
		}
	}

	get state(): SessionState {
		return this._state;
	}

	get isAborted(): boolean {
		return this._state === "aborted" || Boolean(this.signal?.aborted);
	}

	start(): void {
		if (this._state !== "pending") {
			throw new Error(`Cannot start session in state "${this._state}"`);
		}
		this._state = "running";
		this.emitProgress({ phase: "running" });
	}

	complete(totalPages?: number): void {
		if (this._state !== "running") {
			throw new Error(`Cannot complete session in state "${this._state}"`);
		}
		this._state = "completed";
		const count = totalPages ?? this.lastTotalPages;
		this.emitProgress({
			phase: "completed",
			totalPages: count,
			pageCount: count,
			total: count,
			pageNumber: count,
		});
	}

	onProgress(listener: ProgressListener): () => void {
		this.progressListeners.push(listener);
		return () => {
			const idx = this.progressListeners.indexOf(listener);
			if (idx !== -1) {
				this.progressListeners.splice(idx, 1);
			}
		};
	}

	emitProgress(event: RenderProgressEvent): void {
		if (event.totalPages !== undefined && event.totalPages > this.lastTotalPages) {
			this.lastTotalPages = event.totalPages;
		}
		if (event.pageCount !== undefined && event.pageCount > this.lastTotalPages) {
			this.lastTotalPages = event.pageCount;
		}
		if (event.pageNumber !== undefined && event.pageNumber > this.lastTotalPages) {
			this.lastTotalPages = event.pageNumber;
		}
		for (const listener of this.progressListeners) {
			try {
				listener(event);
			} catch (err) {
				console.error("Error in progress listener:", err);
			}
		}
	}

	registerCleanup(cleanup: CleanupTask): void {
		if (this._state === "destroyed") {
			throw new Error("Cannot register cleanup on destroyed session");
		}
		this.cleanups.push(cleanup);
	}

	async abort(): Promise<void> {
		if (this._state === "aborted" || this._state === "destroyed") {
			return;
		}
		this._state = "aborted";
		await this.runCleanups();
	}

	async destroy(): Promise<void> {
		if (this._state === "destroyed") {
			return;
		}
		if (this.abortListener && this.signal) {
			this.signal.removeEventListener("abort", this.abortListener);
			this.abortListener = undefined;
		}
		this._state = "destroyed";
		await this.runCleanups();
	}

	assertNotAborted(): void {
		if (this.isAborted) {
			throw new PrintedjsAbortError("Render execution was aborted");
		}
	}

	private async runCleanups(): Promise<void> {
		while (this.cleanups.length > 0) {
			const cleanup = this.cleanups.pop()!;
			try {
				await cleanup();
			} catch (err) {
				console.error("Error during session cleanup:", err);
			}
		}
	}
}
