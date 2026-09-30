import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";

/**
 * Resolves an available Chromium or Chrome executable path across environment
 * variables, Playwright APIs, standard OS directories, and user caches.
 */
export function resolveChromeExecutable(): string | undefined {
	// 1. Explicit environment variables take precedence
	const envCandidates = [
		process.env.PUPPETEER_EXECUTABLE_PATH,
		process.env.CHROME_BIN,
		process.env.CHROMIUM_PATH,
		process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
		process.env.CHROME_PATH,
	];
	for (const candidate of envCandidates) {
		if (candidate && existsSync(candidate)) {
			return candidate;
		}
	}

	// 2. Playwright built-in discovery if available
	try {
		const req = createRequire(import.meta.url);
		const playwright = req("@playwright/test") || req("playwright");
		if (typeof playwright?.chromium?.executablePath === "function") {
			const pwPath = playwright.chromium.executablePath();
			if (pwPath && existsSync(pwPath)) {
				return pwPath;
			}
		}
	} catch {
		// Playwright not available or throws, continue
	}

	// 3. Operating system standard install locations
	const systemCandidates = [
		// Linux
		"/usr/bin/google-chrome",
		"/usr/bin/google-chrome-stable",
		"/usr/bin/chromium",
		"/usr/bin/chromium-browser",
		"/snap/bin/chromium",
		// macOS
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Chromium.app/Contents/MacOS/Chromium",
		"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		// Windows
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
		"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
	];

	if (process.env.LOCALAPPDATA) {
		systemCandidates.push(
			join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
			join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe"),
		);
	}
	if (process.env.PROGRAMFILES) {
		systemCandidates.push(
			join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
		);
	}
	if (process.env["PROGRAMFILES(X86)"]) {
		systemCandidates.push(
			join(
				process.env["PROGRAMFILES(X86)"],
				"Google",
				"Chrome",
				"Application",
				"chrome.exe",
			),
		);
	}

	for (const candidate of systemCandidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	// 4. Puppeteer and Playwright cache roots across Linux, macOS, and Windows
	const home = homedir();
	const cacheRoots = [
		join(home, ".cache", "puppeteer", "chrome"),
		join(home, ".cache", "ms-playwright"),
		join(home, "Library", "Caches", "puppeteer", "chrome"),
		join(home, "Library", "Caches", "ms-playwright"),
	];

	if (process.env.LOCALAPPDATA) {
		cacheRoots.push(
			join(process.env.LOCALAPPDATA, "puppeteer", "chrome"),
			join(process.env.LOCALAPPDATA, "ms-playwright"),
		);
	}

	const subExecutables = [
		// Linux
		["chrome-linux64", "chrome"],
		["chrome-linux", "chrome"],
		// macOS
		[
			"chrome-mac-arm64",
			"Google Chrome for Testing.app",
			"Contents",
			"MacOS",
			"Google Chrome for Testing",
		],
		[
			"chrome-mac-x64",
			"Google Chrome for Testing.app",
			"Contents",
			"MacOS",
			"Google Chrome for Testing",
		],
		[
			"chrome-mac",
			"Google Chrome for Testing.app",
			"Contents",
			"MacOS",
			"Google Chrome for Testing",
		],
		["chrome-mac-arm64", "Chromium.app", "Contents", "MacOS", "Chromium"],
		["chrome-mac-x64", "Chromium.app", "Contents", "MacOS", "Chromium"],
		["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"],
		// Windows
		["chrome-win64", "chrome.exe"],
		["chrome-win32", "chrome.exe"],
		["chrome-win", "chrome.exe"],
	];

	for (const cacheDir of cacheRoots) {
		if (!existsSync(cacheDir)) continue;
		try {
			const versions = readdirSync(cacheDir).sort().reverse();
			for (const version of versions) {
				const versionDir = join(cacheDir, version);
				for (const sub of subExecutables) {
					const candidate = join(versionDir, ...sub);
					if (existsSync(candidate)) {
						return candidate;
					}
				}
			}
		} catch {
			// Directory unreadable, ignore
		}
	}

	return undefined;
}
