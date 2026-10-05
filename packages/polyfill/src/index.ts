/**
 * Polyfill compatibility layer for older browsers running Printedjs.
 *
 * Implements missing DOM, Observer, and modern JavaScript standards
 * on legacy browser environments (older Safari, Android WebView, Chrome < 86, etc.).
 */

interface PolyfillableElementProto {
	replaceChildren?: (...nodes: (Node | string)[]) => void;
	replaceWith?: (...nodes: (Node | string)[]) => void;
	remove?: () => void;
	append?: (...nodes: (Node | string)[]) => void;
	prepend?: (...nodes: (Node | string)[]) => void;
}

export function polyfillDom(): void {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return;
	}

	const toNode = (item: Node | string): Node => {
		if (item instanceof Node) {
			return item;
		}

		return document.createTextNode(String(item));
	};

	// SAFETY: Element.prototype on target legacy browsers may lack modern DOM manipulation methods
	const proto = Element.prototype as PolyfillableElementProto;

	// 1. replaceChildren
	if (!proto.replaceChildren) {
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

		proto.replaceChildren = replaceChildrenPolyfill;

		if ("DocumentFragment" in globalThis) {
			// SAFETY: DocumentFragment.prototype on legacy browsers may lack replaceChildren
			const fragProto = DocumentFragment.prototype as PolyfillableElementProto;

			fragProto.replaceChildren = replaceChildrenPolyfill;
		}
	}

	// 2. replaceWith
	if (!proto.replaceWith) {
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

		proto.replaceWith = replaceWithPolyfill;

		if ("CharacterData" in globalThis) {
			// SAFETY: CharacterData.prototype on legacy browsers may lack replaceWith
			const charDataProto = CharacterData.prototype as PolyfillableElementProto;

			charDataProto.replaceWith = replaceWithPolyfill;
		}
	}

	// 3. remove
	if (!proto.remove) {
		const removePolyfill = function (this: ChildNode): void {
			if (this.parentNode) {
				this.parentNode.removeChild(this);
			}
		};

		proto.remove = removePolyfill;

		if ("CharacterData" in globalThis) {
			// SAFETY: CharacterData.prototype on legacy browsers may lack remove
			const charDataProto = CharacterData.prototype as PolyfillableElementProto;

			charDataProto.remove = removePolyfill;
		}
	}

	// 4. append
	if (!proto.append) {
		const appendPolyfill = function (
			this: ParentNode,
			...nodes: (Node | string)[]
		): void {
			for (const node of nodes) {
				this.appendChild(toNode(node));
			}
		};

		proto.append = appendPolyfill;

		if ("DocumentFragment" in globalThis) {
			// SAFETY: DocumentFragment.prototype on legacy browsers may lack append
			const fragProto = DocumentFragment.prototype as PolyfillableElementProto;

			fragProto.append = appendPolyfill;
		}
	}

	// 5. prepend
	if (!proto.prepend) {
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

		proto.prepend = prependPolyfill;

		if ("DocumentFragment" in globalThis) {
			// SAFETY: DocumentFragment.prototype on legacy browsers may lack prepend
			const fragProto = DocumentFragment.prototype as PolyfillableElementProto;

			fragProto.prepend = prependPolyfill;
		}
	}
}

interface WindowWithObservers extends Window {
	ResizeObserver?: unknown;
	IntersectionObserver?: unknown;
}

export function polyfillObservers(): void {
	if (typeof window === "undefined") {
		return;
	}

	// SAFETY: Window in browser environment augmented with polyfill observers
	const win = window as WindowWithObservers;

	// 1. ResizeObserver fallback shim
	if (!("ResizeObserver" in win) || !win.ResizeObserver) {
		type ResizeObserverCallback = (
			entries: { target: Element; contentRect: DOMRectReadOnly }[],
			observer: FallbackResizeObserver,
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
	if (!("IntersectionObserver" in win) || !win.IntersectionObserver) {
		type IntersectionObserverCallback = (
			entries: { target: Element; isIntersecting: boolean; intersectionRatio: number }[],
			observer: FallbackIntersectionObserver,
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

interface WindowWithAsyncPolyfills extends Omit<
	Window,
	"requestIdleCallback" | "cancelIdleCallback" | "queueMicrotask"
> {
	requestIdleCallback?(
		callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
		options?: { timeout?: number },
	): number;
	cancelIdleCallback?(id: number): void;
	queueMicrotask?(callback: () => void): void;
}

export function polyfillAsync(): void {
	if (typeof window === "undefined") {
		return;
	}

	// SAFETY: Window in browser environment augmented with async polyfills
	const win = window as WindowWithAsyncPolyfills;

	// 1. requestIdleCallback & cancelIdleCallback
	if (!("requestIdleCallback" in win) || !win.requestIdleCallback) {
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

	if (!("cancelIdleCallback" in win) || !win.cancelIdleCallback) {
		win.cancelIdleCallback = (id: number): void => {
			clearTimeout(id);
		};
	}

	// 2. queueMicrotask
	if (!("queueMicrotask" in win) || !win.queueMicrotask) {
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

interface PolyfillableObject {
	hasOwn?: (
		target: Parameters<typeof Object.prototype.hasOwnProperty.call>[0],
		property: PropertyKey,
	) => boolean;
}

interface PolyfillableArrayProto {
	at?: <T>(this: T[], index: number) => T | undefined;
}

interface PolyfillableStringProto {
	replaceAll?: (
		this: string,
		searchValue: string | RegExp,
		replaceValue:
			| string
			| ((substring: string, ...args: readonly (string | number)[]) => string),
	) => string;
}

interface PolyfillablePromise {
	allSettled?: <T>(
		iterable: Iterable<T | PromiseLike<T>>,
	) => Promise<PromiseSettledResult<Awaited<T>>[]>;
}

export function polyfillJsStandards(): void {
	// 1. Object.hasOwn
	// SAFETY: Object constructor on legacy environments may lack hasOwn
	const objCtor = Object as PolyfillableObject;

	if (!objCtor.hasOwn) {
		objCtor.hasOwn = (
			obj: Parameters<typeof Object.prototype.hasOwnProperty.call>[0],
			prop: PropertyKey,
		): boolean => {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		};
	}

	// 2. Array.prototype.at
	// SAFETY: Array.prototype on legacy environments may lack at
	const arrProto = Array.prototype as PolyfillableArrayProto;

	if (!arrProto.at) {
		arrProto.at = function <T>(this: T[], index: number): T | undefined {
			const len = this.length;
			const relativeIndex = Number(index);
			const k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;

			return k >= 0 && k < len ? this[k] : undefined;
		};
	}

	// 3. String.prototype.replaceAll
	// SAFETY: String.prototype on legacy environments may lack replaceAll
	const strProto = String.prototype as PolyfillableStringProto;

	if (!strProto.replaceAll) {
		strProto.replaceAll = function (
			this: string,
			searchValue: string | RegExp,
			replaceValue:
				| string
				| ((substring: string, ...args: readonly (string | number)[]) => string),
		): string {
			if (searchValue instanceof RegExp) {
				if (!searchValue.global) {
					throw new TypeError(
						"String.prototype.replaceAll called with a non-global RegExp",
					);
				}

				// SAFETY: regex replacement with string replaceValue
				return this.replace(searchValue, replaceValue as string);
			}

			return this.split(String(searchValue)).join(
				replaceValue instanceof Function
					? replaceValue(String(searchValue))
					: String(replaceValue),
			);
		};
	}

	// 4. Promise.allSettled
	// SAFETY: Promise constructor on legacy environments may lack allSettled
	const promiseCtor = Promise as PolyfillablePromise;

	if (!promiseCtor.allSettled) {
		promiseCtor.allSettled = function <T>(
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
	if (!("structuredClone" in globalThis)) {
		globalThis.structuredClone = function <T>(value: T): T {
			if (value === null || Object(value) !== value) {
				return value;
			}

			if (value instanceof Date) {
				return Object.assign(new Date(value.getTime()), value);
			}

			if (value instanceof RegExp) {
				return Object.assign(new RegExp(value.source, value.flags), value);
			}

			if (value instanceof Map) {
				const map = new Map();

				for (const [k, v] of value.entries()) {
					map.set(globalThis.structuredClone(k), globalThis.structuredClone(v));
				}

				return Object.assign(map, value);
			}

			if (value instanceof Set) {
				const set = new Set();

				for (const v of value.values()) {
					set.add(globalThis.structuredClone(v));
				}

				return Object.assign(set, value);
			}

			if (Array.isArray(value)) {
				const arr = value.map((item) => globalThis.structuredClone(item));

				return Object.assign(arr, value);
			}

			const target = Object.create(Object.getPrototypeOf(value));

			for (const key of Object.getOwnPropertyNames(value)) {
				const descriptor = Object.getOwnPropertyDescriptor(value, key);

				if (descriptor && descriptor.value !== undefined) {
					descriptor.value = globalThis.structuredClone(descriptor.value);
					Object.defineProperty(target, key, descriptor);
				}
			}

			// SAFETY: cloned object matches input type T
			return target as T;
		};
	}

	// 6. CSS.supports
	if (typeof window !== "undefined") {
		interface WindowWithCSS extends Window {
			CSS?: {
				supports?(property: string, value?: string): boolean;
			};
		}

		// SAFETY: Window in browser environment augmented with CSS.supports shim
		const win = window as WindowWithCSS;

		if (!win.CSS) {
			win.CSS = {};
		}

		if (!("supports" in win.CSS) || !win.CSS.supports) {
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
