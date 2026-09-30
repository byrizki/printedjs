import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);

let cachedBrowserBundle: string | null = null;
let cachedPluginsBundle: string | null = null;

function resolvePackageBundle(pkgName: string): string {
	const subDir = pkgName.replace(/^@printedjs\//, "");
	const candidates = [
		() => req.resolve(`${pkgName}/dist/index.global.js`),
		() => resolve(import.meta.dirname, `../../${subDir}/dist/index.global.js`),
		() => resolve(import.meta.dirname, `../${subDir}/dist/index.global.js`),
	];

	for (const getPath of candidates) {
		try {
			const candidatePath = getPath();
			if (existsSync(candidatePath)) {
				return readFileSync(candidatePath, "utf-8");
			}
		} catch {
			// Try next candidate
		}
	}

	throw new Error(`Unable to resolve browser bundle for package: ${pkgName}`);
}

export function getBrowserBundle(): string {
	if (!cachedBrowserBundle) {
		cachedBrowserBundle = resolvePackageBundle("@printedjs/browser");
	}
	return cachedBrowserBundle;
}

export function getPluginsBundle(): string {
	if (!cachedPluginsBundle) {
		cachedPluginsBundle = resolvePackageBundle("@printedjs/plugins");
	}
	return cachedPluginsBundle;
}

export interface InjectablePage {
	evaluate<T, A = void>(fn: (arg: A) => T | Promise<T>, arg?: A): Promise<T>;
	addScriptTag?(options: { content: string }): Promise<unknown>;
}

export interface PaginationOptions {
	readonly pagedjsCompatible?: boolean | undefined;
}

export async function injectAndPaginate(
	page: InjectablePage,
	options?: PaginationOptions,
): Promise<void> {
	const hasPages = await page.evaluate(
		() => document.querySelectorAll(".printedjs_page, .pagedjs_page").length > 0,
	);

	if (hasPages) {
		return;
	}

	if (page.addScriptTag) {
		await page.addScriptTag({ content: getBrowserBundle() });
		await page.addScriptTag({ content: getPluginsBundle() });
	}

	const isCompat = options?.pagedjsCompatible ?? false;

	await page.evaluate(async (compat: boolean) => {
		const win = window as unknown as {
			Printedjs?: {
				createRenderer?: (opts: unknown) => {
					render: (req: unknown) => Promise<unknown>;
				};
				polyfill?: (opts?: { pagedjsCompatible?: boolean }) => Promise<unknown>;
			};
			Printed?: {
				createRenderer?: (opts: unknown) => {
					render: (req: unknown) => Promise<unknown>;
				};
				polyfill?: (opts?: { pagedjsCompatible?: boolean }) => Promise<unknown>;
			};
			PrintedjsPlugins?: {
				standardPreset?: () => readonly unknown[];
			};
			PrintedPlugins?: {
				standardPreset?: () => readonly unknown[];
			};
			PrintedjsConfig?: { pagedjsCompatible?: boolean };
			__printedjsOriginalContent?: string;
			__printedjsRenderFinished?: boolean;
		};

		win.PrintedjsConfig = {
			...(win.PrintedjsConfig ?? {}),
			pagedjsCompatible: compat,
		};

		const printedApi = win.Printedjs ?? win.Printed;
		const pluginsApi = win.PrintedjsPlugins ?? win.PrintedPlugins;

		// If the page already provides a polyfill runner (e.g. from an existing script tag)
		if (typeof printedApi?.polyfill === "function") {
			await printedApi.polyfill({ pagedjsCompatible: compat });
			win.__printedjsRenderFinished = true;
			return;
		}

		// Direct engine execution using @printedjs/browser and @printedjs/plugins
		if (printedApi?.createRenderer && pluginsApi?.standardPreset) {
			if (!win.__printedjsOriginalContent) {
				win.__printedjsOriginalContent = document.body.innerHTML;
			}
			const contentHtml = win.__printedjsOriginalContent;

			const styleElements = document.querySelectorAll(
				"style:not([data-printedjs-styles]):not([data-printedjs-ignore]):not([data-pagedjs-ignore]), link[rel='stylesheet']:not([data-printedjs-ignore]):not([data-pagedjs-ignore])",
			);
			const styles: string[] = [];
			styleElements.forEach((el) => {
				if (el.tagName.toLowerCase() === "style") {
					styles.push(el.textContent ?? "");
					el.remove();
				} else if (el.tagName.toLowerCase() === "link") {
					const href = el.getAttribute("href");
					if (href) {
						styles.push(`@import url("${href}");`);
					}
					el.remove();
				}
			});

			document.body.replaceChildren();

			const renderer = printedApi.createRenderer({
				target: document.body,
				isolation: "root",
				plugins: pluginsApi.standardPreset(),
				pagedjsCompatible: compat,
			});

			await renderer.render({
				content: { html: contentHtml },
				stylesheets: styles.map((content) => ({ type: "inline", content })),
			});

			win.__printedjsRenderFinished = true;
		}
	}, isCompat);
}
