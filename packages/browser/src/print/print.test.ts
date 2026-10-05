import { describe, expect, it, vi } from "vitest";
import { exportToPdf, preparePrint, printDocument } from "./print.js";

function createMockWindow() {
	const listeners = new Map<string, ((e: Event) => void)[]>();
	const docAttrs = new Map<string, string>();

	const mockDoc = {
		title: "Initial Title",
		documentElement: {
			getAttribute(k: string) {
				return docAttrs.get(k) ?? null;
			},
			setAttribute(k: string, v: string) {
				docAttrs.set(k, v);
			},
			removeAttribute(k: string) {
				docAttrs.delete(k);
			},
		},
		defaultView: null as unknown as Window,
	};

	const mockWin = {
		document: mockDoc,
		focus: vi.fn(),
		print: vi.fn(() => {
			// Trigger afterprint on next tick
			setTimeout(() => {
				const list = listeners.get("afterprint");

				if (list) {
					list.forEach((fn) => fn({ type: "afterprint" } as Event));
				}
			}, 10);
		}),
		addEventListener(event: string, handler: (e: Event) => void) {
			if (!listeners.has(event)) listeners.set(event, []);
			listeners.get(event)!.push(handler);
		},
		removeEventListener(event: string, handler: (e: Event) => void) {
			const list = listeners.get(event);

			if (list) {
				const idx = list.indexOf(handler);

				if (idx >= 0) list.splice(idx, 1);
			}
		},
	};

	mockDoc.defaultView = mockWin as unknown as Window;

	return { win: mockWin as unknown as Window, doc: mockDoc as unknown as Document };
}

describe("Client-Side Direct Print and PDF Export", () => {
	it("preparePrint applies data-printedjs-printing and cleans up correctly", () => {
		const { doc } = createMockWindow();
		expect(doc.documentElement.getAttribute("data-printedjs-printing")).toBeNull();

		const cleanup = preparePrint(doc);
		expect(doc.documentElement.getAttribute("data-printedjs-printing")).toBe("true");

		cleanup();
		expect(doc.documentElement.getAttribute("data-printedjs-printing")).toBeNull();
	});

	it("printDocument sets temporary title, invokes lifecycle hooks, and calls print", async () => {
		const { win, doc } = createMockWindow();
		const beforePrint = vi.fn();
		const afterPrint = vi.fn();

		await printDocument({
			target: win,
			pageTitle: "My Report",
			beforePrint,
			afterPrint,
		});

		expect(win.focus).toHaveBeenCalled();
		expect(win.print).toHaveBeenCalled();
		expect(beforePrint).toHaveBeenCalled();
		expect(afterPrint).toHaveBeenCalled();

		// Document title should be restored back to initial
		expect(doc.title).toBe("Initial Title");
		// Printing attribute cleaned up
		expect(doc.documentElement.getAttribute("data-printedjs-printing")).toBeNull();
	});

	it("exportToPdf formats filename into pageTitle and triggers print", async () => {
		const { win, doc } = createMockWindow();

		let titleDuringPrint: string | undefined;

		const beforePrint = vi.fn(() => {
			titleDuringPrint = doc.title;
		});

		await exportToPdf({
			target: win,
			filename: "Quarterly-Statement-2026.pdf",
			beforePrint,
		});

		expect(titleDuringPrint).toBe("Quarterly-Statement-2026");
		expect(win.print).toHaveBeenCalled();
		expect(doc.title).toBe("Initial Title");
	});

	it("supports iframe as target", async () => {
		const { win, doc } = createMockWindow();

		const iframe = {
			contentWindow: win,
			contentDocument: doc,
		} as unknown as HTMLIFrameElement;

		await printDocument({
			target: iframe,
			pageTitle: "Iframe Print",
		});

		expect(win.print).toHaveBeenCalled();
	});
});
