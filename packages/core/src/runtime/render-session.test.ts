import { describe, expect, test, vi } from "vitest";
import { PrintedjsAbortError } from "../contracts/errors.js";
import { RenderSession } from "./render-session.js";

describe("runtime/render-session", () => {
	test("lifecycle transitions: pending -> running -> completed", () => {
		const session = new RenderSession();
		expect(session.state).toBe("pending");
		session.start();
		expect(session.state).toBe("running");
		session.complete();
		expect(session.state).toBe("completed");
	});

	test("runs cleanups on destroy in reverse registration order", async () => {
		const session = new RenderSession();
		const order: number[] = [];

		session.registerCleanup(() => {
			order.push(1);
		});
		session.registerCleanup(() => {
			order.push(2);
		});

		await session.destroy();
		expect(session.state).toBe("destroyed");
		expect(order).toEqual([2, 1]);
	});

	test("abort signal triggers cancellation and runs cleanups", async () => {
		const controller = new AbortController();
		const session = new RenderSession({ signal: controller.signal });
		const cleanup = vi.fn();

		session.registerCleanup(cleanup);
		session.start();

		controller.abort();
		expect(session.isAborted).toBe(true);
		expect(session.state).toBe("aborted");
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	test("assertNotAborted throws PrintedjsAbortError when aborted", () => {
		const controller = new AbortController();
		const session = new RenderSession({ signal: controller.signal });
		controller.abort();
		expect(() => session.assertNotAborted()).toThrow(PrintedjsAbortError);
	});

	test("emits progress events to registered listeners", () => {
		const session = new RenderSession();
		const events: string[] = [];

		const unsubscribe = session.onProgress((e) => {
			events.push(e.phase);
		});

		session.start();
		session.emitProgress({ phase: "paginating", pageNumber: 1 });
		session.complete();

		unsubscribe();
		session.emitProgress({ phase: "paginating", pageNumber: 2 });

		expect(events).toEqual(["running", "paginating", "completed"]);
	});
});
