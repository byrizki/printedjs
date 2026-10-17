import { execSync } from "node:child_process";
import {
	accessSync,
	constants,
	existsSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const tarballsDir = resolve(rootDir, "dist-tarballs");

const expectedPackages = [
	"printedjs-core",
	"printedjs-browser",
	"printedjs-cli",
	"printedjs-devtools",
	"printedjs-headless-webview",
	"printedjs-minimal",
	"printedjs-polyfill",
	"printedjs-plugin-preset",
	"printedjs-plugin-breaks",
	"printedjs-plugin-columns",
	"printedjs-plugin-counters",
	"printedjs-plugin-footnotes",
	"printedjs-plugin-generated-content",
	"printedjs-plugin-hyphenation",
	"printedjs-plugin-lists",
	"printedjs-plugin-math",
	"printedjs-plugin-page-rules",
	"printedjs-plugin-running-headers",
	"printedjs-plugin-strings",
	"printedjs-plugin-views",
	"printedjs-plugin-widows-orphans",
	"printedjs-plugin-bookmarks",
	"printedjs-plugin-eta",
	"printedjs-plugin-page-flip",
];

const globalForbiddenPatterns = [
	/\.tsbuildinfo$/,
	/(^|\/)node_modules(\/|$)/,
	/(^|\/)\.git(\/|$)/,
	/(^|\/)\.DS_Store$/,
];

function verifyDesktopPrebuilts(
	packageName: string,
	fullPath: string,
	files: string[],
): boolean {
	let hasError = false;

	const hasBinDir = files.some((f) => f.startsWith("package/bin/"));

	if (!hasBinDir) {
		console.error(`[FAIL] ${packageName} tarball missing package/bin/ directory`);
		hasError = true;
	}

	const binaryName =
		process.platform === "win32" ? "headless-webview.exe" : "headless-webview";

	const platformArch = `${process.platform}-${process.arch}`;
	const expectedHostBinary = `package/bin/${platformArch}/${binaryName}`;
	const fallbackHostBinary = `package/bin/${binaryName}`;

	const hasPlatformBinary =
		files.includes(expectedHostBinary) || files.includes(fallbackHostBinary);

	const bundledBinaries = files.flatMap((f) =>
		f.startsWith("package/bin/") && !f.endsWith(".gitkeep")
			? [f.replace("package/bin/", "")]
			: [],
	);

	console.log(
		`    Bundled ${packageName} bin targets: ${bundledBinaries.join(", ") || "none"}`,
	);

	const requirePrebuilts =
		process.env.REQUIRE_CLI_PREBUILTS === "true" ||
		process.env.VERIFY_ALL_CLI_PREBUILTS === "true";

	if (bundledBinaries.length === 0) {
		if (requirePrebuilts) {
			console.error(
				`[FAIL] ${packageName} tarball missing prebuilt binaries in package/bin/`,
			);
			hasError = true;
		} else {
			console.log(
				`    Notice: Prebuilt binaries not compiled yet (deferred to platform matrix jobs)`,
			);
		}
	}

	if (process.env.VERIFY_ALL_CLI_PREBUILTS === "true") {
		const requiredPlatforms = [
			"linux-x64/headless-webview",
			"darwin-arm64/headless-webview",
			"darwin-x64/headless-webview",
			"win32-x64/headless-webview.exe",
		];

		for (const req of requiredPlatforms) {
			if (!files.includes(`package/bin/${req}`)) {
				console.error(
					`[FAIL] ${packageName} tarball missing prebuilt binary for: ${req}`,
				);
				hasError = true;
			}
		}
	}

	const tempExtractDir = mkdtempSync(
		join(tmpdir(), `printedjs-${packageName.toLowerCase()}-verify-`),
	);

	try {
		execSync(`tar -zxf "${fullPath}" -C "${tempExtractDir}"`);

		if (hasPlatformBinary) {
			const extractedBinary = existsSync(resolve(tempExtractDir, expectedHostBinary))
				? resolve(tempExtractDir, expectedHostBinary)
				: resolve(tempExtractDir, fallbackHostBinary);

			if (process.platform !== "win32") {
				try {
					accessSync(extractedBinary, constants.X_OK);
				} catch {
					console.error(
						`[FAIL] Bundled ${packageName} binary is not executable: ${extractedBinary}`,
					);
					hasError = true;
				}
			}

			try {
				const helpOutput = execSync(`"${extractedBinary}" --help 2>&1`, {
					encoding: "utf-8",
				});

				if (!helpOutput.includes("Usage: headless-webview")) {
					console.error(
						`[FAIL] ${packageName} binary --help output missing expected usage text:\n${helpOutput}`,
					);
					hasError = true;
				} else {
					console.log(
						`    ✓ Successfully verified ${packageName} headless binary execution for ${platformArch}`,
					);
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(
					`[FAIL] Failed to execute bundled ${packageName} binary (${expectedHostBinary}): ${message}`,
				);
				hasError = true;
			}
		} else {
			console.log(
				`    ℹ No bundled binary present for current platform (${platformArch}); skipping execution test.`,
			);
		}
	} finally {
		rmSync(tempExtractDir, { recursive: true, force: true });
	}

	return !hasError;
}

function verifyTarballs(): void {
	console.log("=== Verifying Published Tarball Archives & Contents ===");

	if (!existsSync(tarballsDir)) {
		console.error(`[FAIL] Tarball directory does not exist: ${tarballsDir}`);
		process.exit(1);
	}

	const tarballFiles = readdirSync(tarballsDir).filter((f) => f.endsWith(".tgz"));

	if (tarballFiles.length === 0) {
		console.error("[FAIL] No .tgz archives found in dist-tarballs/");
		process.exit(1);
	}

	console.log(`Found ${tarballFiles.length} tarball archive(s) to verify.\n`);

	let hasError = false;

	// 1. Verify all expected packages have tarballs
	for (const expected of expectedPackages) {
		const match = tarballFiles.find((f) => f.startsWith(`${expected}-`));

		if (!match) {
			console.error(`[FAIL] Missing expected tarball for: ${expected}`);
			hasError = true;
		}
	}

	// 2. Verify each tarball's internal contents
	for (const tarball of tarballFiles) {
		const fullPath = resolve(tarballsDir, tarball);
		const size = statSync(fullPath).size;

		if (size < 500) {
			console.error(`[FAIL] ${tarball} is suspiciously small (${size} bytes)`);
			hasError = true;
			continue;
		}

		const listOutput = execSync(`tar -ztf "${fullPath}"`, {
			encoding: "utf-8",
		});

		const files = listOutput
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		// Global required files
		const hasPackageJson = files.includes("package/package.json");
		const hasReadme = files.includes("package/README.md");

		const hasDistJs = files.some(
			(f) => f.startsWith("package/dist/") && f.endsWith(".js"),
		);

		if (!hasPackageJson) {
			console.error(`[FAIL] ${tarball} missing package/package.json`);
			hasError = true;
		}

		if (!hasReadme) {
			console.error(`[FAIL] ${tarball} missing package/README.md`);
			hasError = true;
		}

		if (!hasDistJs) {
			console.error(`[FAIL] ${tarball} missing JavaScript bundle under package/dist/`);
			hasError = true;
		}

		// Global forbidden files
		for (const file of files) {
			for (const pattern of globalForbiddenPatterns) {
				if (pattern.test(file)) {
					console.error(`[FAIL] ${tarball} contains forbidden file: ${file}`);
					hasError = true;
				}
			}
		}

		// Package-specific checks for headless-webview
		if (tarball.startsWith("printedjs-headless-webview-")) {
			const requiredHeadlessFiles = [
				"package/react-native-headless-webview.podspec",
				"package/Package.swift",
				"package/android/build.gradle",
				"package/android/src/main/AndroidManifest.xml",
				"package/android/src/main/java/android/print/PdfPrintHelper.kt",
				"package/android/src/main/java/com/printedjs/headlesswebview/HeadlessWebViewModule.kt",
				"package/android/src/main/java/com/printedjs/headlesswebview/HeadlessWebViewPackage.kt",
				"package/ios/HeadlessWebviewModule.swift",
				"package/ios/HeadlessWebviewModuleBridge.m",
			];

			for (const req of requiredHeadlessFiles) {
				if (!files.includes(req)) {
					console.error(`[FAIL] Headless WebView tarball missing required file: ${req}`);
					hasError = true;
				}
			}

			const prohibitedPrefixes = [
				"package/crates/",
				"package/dotnet/",
				"package/example/",
				"package/android/build/",
				"package/android/.gradle/",
				"package/android/.kotlin/",
				"package/ios/build/",
				"package/ios/DerivedData/",
				"package/ios/Pods/",
			];

			for (const file of files) {
				for (const prefix of prohibitedPrefixes) {
					if (file.startsWith(prefix)) {
						console.error(
							`[FAIL] Headless WebView tarball contains prohibited asset (${prefix}): ${file}`,
						);
						hasError = true;
					}
				}
			}

			const headlessBinValid = verifyDesktopPrebuilts("HeadlessWebView", fullPath, files);

			if (!headlessBinValid) {
				hasError = true;
			}
		}

		// Package-specific checks for CLI
		if (tarball.startsWith("printedjs-cli-")) {
			const hasCliEntry = files.includes("package/dist/cli.js");

			if (!hasCliEntry) {
				console.error("[FAIL] CLI tarball missing package/dist/cli.js");
				hasError = true;
			}

			const cliValid = verifyDesktopPrebuilts("CLI", fullPath, files);

			if (!cliValid) {
				hasError = true;
			}
		}

		console.log(
			`  ✓ ${tarball.padEnd(50)} (${files.length} files, ${(size / 1024).toFixed(1)} kB)`,
		);
	}

	if (hasError) {
		console.error("\n❌ Tarball content verification failed with errors!");
		process.exit(1);
	}

	console.log(`\n✅ All ${tarballFiles.length} tarball archives verified successfully!`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
	verifyTarballs();
}

export { verifyTarballs };
