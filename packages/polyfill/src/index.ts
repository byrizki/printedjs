/**
 * Polyfill compatibility layer for older browsers running Printedjs.
 *
 * Implements missing DOM, Observer, and modern JavaScript standards
 * on legacy browser environments (older Safari, Android WebView, Chrome < 86, etc.).
 */

export function polyfillDom(): void {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return;
	}

	const toNode = (item: unknown): Node => {
		if (item instanceof Node) {
			return item;
		}
		return document.createTextNode(String(item));
	};

	// 1. replaceChildren
	if (typeof Element.prototype.replaceChildren !== "function") {
		const replaceChildrenPolyfill = function (
			this: Node,
			...nodes: (Node | string)[]
		): void {
			while (this.firstChild) {
				this.removeChild(this.firstChild);
			}
			for (const node of nodes) {
				this.appendChild(toNode(node));
			}
		};
		Element.prototype.replaceChildren = replaceChildrenPolyfill;
		if (typeof DocumentFragment !== "undefined") {
			DocumentFragment.prototype.replaceChildren = replaceChildrenPolyfill;
		}
	}

	// 2. replaceWith
	if (typeof Element.prototype.replaceWith !== "function") {
		const replaceWithPolyfill = function (
			this: ChildNode,
			...nodes: (Node | string)[]
		): void {
			const parent = this.parentNode;
			if (!parent) return;
			const frag = document.createDocumentFragment();
			for (const node of nodes) {
				frag.appendChild(toNode(node));
			}
			parent.replaceChild(frag, this);
		};
		Element.prototype.replaceWith = replaceWithPolyfill;
		if (typeof CharacterData !== "undefined") {
			CharacterData.prototype.replaceWith = replaceWithPolyfill;
		}
	}

	// 3. remove
	if (typeof Element.prototype.remove !== "function") {
		const removePolyfill = function (this: ChildNode): void {
			if (this.parentNode) {
				this.parentNode.removeChild(this);
			}
		};
		Element.prototype.remove = removePolyfill;
		if (typeof CharacterData !== "undefined") {
			CharacterData.prototype.remove = removePolyfill;
		}
	}

	// 4. append
	if (typeof Element.prototype.append !== "function") {
		const appendPolyfill = function (
			this: ParentNode,
			...nodes: (Node | string)[]
		): void {
			for (const node of nodes) {
				this.appendChild(toNode(node));
			}
		};
		Element.prototype.append = appendPolyfill;
		if (typeof DocumentFragment !== "undefined") {
			DocumentFragment.prototype.append = appendPolyfill;
		}
	}

	// 5. prepend
	if (typeof Element.prototype.prepend !== "function") {
		const prependPolyfill = function (
			this: ParentNode,
			...nodes: (Node | string)[]
		): void {
			const frag = document.createDocumentFragment();
			for (const node of nodes) {
				frag.appendChild(toNode(node));
			}
			this.insertBefore(frag, this.firstChild);
		};
		Element.prototype.prepend = prependPolyfill;
		if (typeof DocumentFragment !== "undefined") {
			DocumentFragment.prototype.prepend = prependPolyfill;
		}
	}
}

export function polyfillObservers(): void {
	if (typeof window === "undefined") {
		return;
	}

	const win = window as unknown as Record<string, unknown>;

	// 1. ResizeObserver fallback shim
	if (typeof win.ResizeObserver !== "function") {
		type ResizeObserverCallback = (
			entries: { target: Element; contentRect: DOMRectReadOnly }[],
			observer: unknown,
		) => void;

		class FallbackResizeObserver {
			private readonly callback: ResizeObserverCallback;
			private readonly observedElements = new Set<Element>();
			private readonly lastRects = new Map<Element, { width: number; height: number }>();
			private timerId: number | null = null;

			constructor(callback: ResizeObserverCallback) {
				this.callback = callback;
			}

			observe(target: Element): void {
				this.observedElements.add(target);
				const rect = target.getBoundingClientRect();
				this.lastRects.set(target, { width: rect.width, height: rect.height });
				if (this.timerId === null) {
					this.startPolling();
				}
			}

			unobserve(target: Element): void {
				this.observedElements.delete(target);
				this.lastRects.delete(target);
				if (this.observedElements.size === 0 && this.timerId !== null) {
					clearInterval(this.timerId);
					this.timerId = null;
				}
			}

			disconnect(): void {
				this.observedElements.clear();
				this.lastRects.clear();
				if (this.timerId !== null) {
					clearInterval(this.timerId);
					this.timerId = null;
				}
			}

			private startPolling(): void {
				this.timerId = window.setInterval(() => {
					const entries: { target: Element; contentRect: DOMRectReadOnly }[] = [];
					for (const el of this.observedElements) {
						const prev = this.lastRects.get(el);
						const curr = el.getBoundingClientRect();
						if (!prev || prev.width !== curr.width || prev.height !== curr.height) {
							this.lastRects.set(el, { width: curr.width, height: curr.height });
							entries.push({ target: el, contentRect: curr });
						}
					}
					if (entries.length > 0) {
						this.callback(entries, this);
					}
				}, 100);
			}
		}

		win.ResizeObserver = FallbackResizeObserver;
	}

	// 2. IntersectionObserver fallback shim
	if (typeof win.IntersectionObserver !== "function") {
		type IntersectionObserverCallback = (
			entries: { target: Element; isIntersecting: boolean; intersectionRatio: number }[],
			observer: unknown,
		) => void;

		class FallbackIntersectionObserver {
			private readonly callback: IntersectionObserverCallback;
			private readonly targets = new Set<Element>();

			constructor(callback: IntersectionObserverCallback) {
				this.callback = callback;
			}

			observe(target: Element): void {
				this.targets.add(target);
				// In older fallback mode, treat all elements as immediately visible
				setTimeout(() => {
					if (this.targets.has(target)) {
						this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }], this);
					}
				}, 0);
			}

			unobserve(target: Element): void {
				this.targets.delete(target);
			}

			disconnect(): void {
				this.targets.clear();
			}
		}

		win.IntersectionObserver = FallbackIntersectionObserver;
	}
}

export function polyfillAsync(): void {
	if (typeof window === "undefined") {
		return;
	}

	const win = window as unknown as Record<string, unknown>;

	// 1. requestIdleCallback & cancelIdleCallback
	if (typeof win.requestIdleCallback !== "function") {
		win.requestIdleCallback = (
			cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
			options?: { timeout?: number },
		): number => {
			const start = performance.now();
			const timeout = options?.timeout ?? 50;
			return window.setTimeout(
				() => {
					cb({
						didTimeout: false,
						timeRemaining: () => Math.max(0, 50 - (performance.now() - start)),
					});
				},
				Math.min(timeout, 20),
			);
		};
	}

	if (typeof win.cancelIdleCallback !== "function") {
		win.cancelIdleCallback = (id: number): void => {
			clearTimeout(id);
		};
	}

	// 2. queueMicrotask
	if (typeof win.queueMicrotask !== "function") {
		win.queueMicrotask = (callback: () => void): void => {
			Promise.resolve()
				.then(callback)
				.catch((err) => {
					setTimeout(() => {
						throw err;
					}, 0);
				});
		};
	}
}

export function polyfillJsStandards(): void {
	// 1. Object.hasOwn
	if (typeof Object.hasOwn !== "function") {
		Object.hasOwn = (obj: object, prop: PropertyKey): boolean => {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		};
	}

	// 2. Array.prototype.at
	if (typeof Array.prototype.at !== "function") {
		Array.prototype.at = function <T>(this: T[], index: number): T | undefined {
			const len = this.length;
			const relativeIndex = Number(index);
			const k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
			return k >= 0 && k < len ? this[k] : undefined;
		};
	}

	// 3. String.prototype.replaceAll
	if (typeof String.prototype.replaceAll !== "function") {
		String.prototype.replaceAll = function (
			this: string,
			searchValue: string | RegExp,
			replaceValue: string | ((substring: string, ...args: unknown[]) => string),
		): string {
			if (searchValue instanceof RegExp) {
				if (!searchValue.global) {
					throw new TypeError(
						"String.prototype.replaceAll called with a non-global RegExp",
					);
				}
				return this.replace(searchValue, replaceValue as string);
			}
			return this.split(String(searchValue)).join(
				typeof replaceValue === "function"
					? replaceValue(String(searchValue))
					: String(replaceValue),
			);
		};
	}

	// 4. Promise.allSettled
	if (typeof Promise.allSettled !== "function") {
		Promise.allSettled = function <T>(
			iterable: Iterable<T | PromiseLike<T>>,
		): Promise<PromiseSettledResult<Awaited<T>>[]> {
			return Promise.all(
				Array.from(iterable).map((item) =>
					Promise.resolve(item).then(
						(value) => ({ status: "fulfilled" as const, value }),
						(reason) => ({ status: "rejected" as const, reason }),
					),
				),
			);
		};
	}

	// 5. structuredClone
	if (typeof globalThis.structuredClone !== "function") {
		globalThis.structuredClone = function <T>(value: T): T {
			if (value === null || typeof value !== "object") {
				return value;
			}
			if (value instanceof Date) {
				return new Date(value.getTime()) as unknown as T;
			}
			if (value instanceof RegExp) {
				return new RegExp(value.source, value.flags) as unknown as T;
			}
			if (value instanceof Map) {
				const map = new Map();
				for (const [k, v] of value.entries()) {
					map.set(globalThis.structuredClone(k), globalThis.structuredClone(v));
				}
				return map as unknown as T;
			}
			if (value instanceof Set) {
				const set = new Set();
				for (const v of value.values()) {
					set.add(globalThis.structuredClone(v));
				}
				return set as unknown as T;
			}
			if (Array.isArray(value)) {
				return value.map((item) => globalThis.structuredClone(item)) as unknown as T;
			}
			const clone: Record<string, unknown> = {};
			for (const key of Object.keys(value as Record<string, unknown>)) {
				clone[key] = globalThis.structuredClone((value as Record<string, unknown>)[key]);
			}
			return clone as T;
		};
	}

	// 6. CSS.supports
	if (typeof window !== "undefined") {
		const win = window as unknown as { CSS?: { supports?: unknown } };
		if (!win.CSS) {
			win.CSS = {};
		}
		if (typeof win.CSS.supports !== "function") {
			win.CSS.supports = (): boolean => true;
		}
	}
}

/**
 * Installs all polyfills for older browser compatibility.
 */
export function installPolyfills(): void {
	polyfillDom();
	polyfillObservers();
	polyfillAsync();
	polyfillJsStandards();
}

// Auto-install polyfills when imported or run in browser script context
if (typeof window !== "undefined") {
	installPolyfills();
}
