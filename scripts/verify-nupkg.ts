import { execSync } from "node:child_process";
import {
	closeSync,
	existsSync,
	mkdtempSync,
	openSync,
	readdirSync,
	readSync,
	rmSync,
	statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";

interface PlatformConfig {
	rid: string;
	binaryPath: string;
	minSizeBytes: number;
	format: "elf" | "macho" | "pe";
}

const DESKTOP_PLATFORMS: PlatformConfig[] = [
	{
		rid: "linux-x64",
		binaryPath: "runtimes/linux-x64/native/libheadless_webview_core.so",
		minSizeBytes: 500 * 1024,
		format: "elf",
	},
	{
		rid: "osx-arm64",
		binaryPath: "runtimes/osx-arm64/native/libheadless_webview_core.dylib",
		minSizeBytes: 500 * 1024,
		format: "macho",
	},
	{
		rid: "osx-x64",
		binaryPath: "runtimes/osx-x64/native/libheadless_webview_core.dylib",
		minSizeBytes: 500 * 1024,
		format: "macho",
	},
	{
		rid: "win-x64",
		binaryPath: "runtimes/win-x64/native/headless_webview_core.dll",
		minSizeBytes: 500 * 1024,
		format: "pe",
	},
];

const FORBIDDEN_PATTERNS = [
	/\.gitkeep$/,
	/(^|\/)node_modules(\/|$)/,
	/(^|\/)\.git(\/|$)/,
	/(^|\/)\.DS_Store$/,
	/\.(pdb|exp|lib)$/i,
];

function validateBinaryFormat(filePath: string, format: "elf" | "macho" | "pe"): boolean {
	const fd = openSync(filePath, "r");
	const buffer = Buffer.alloc(4);

	try {
		readSync(fd, buffer, 0, 4, 0);
	} finally {
		closeSync(fd);
	}

	if (format === "elf") {
		return (
			buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46
		);
	}

	if (format === "macho") {
		const isMachO64 =
			(buffer[0] === 0xcf &&
				buffer[1] === 0xfa &&
				buffer[2] === 0xed &&
				buffer[3] === 0xfe) ||
			(buffer[0] === 0xfe &&
				buffer[1] === 0xed &&
				buffer[2] === 0xfa &&
				buffer[3] === 0xcf);

		const isFat =
			(buffer[0] === 0xca &&
				buffer[1] === 0xfe &&
				buffer[2] === 0xba &&
				buffer[3] === 0xbe) ||
			(buffer[0] === 0xbe &&
				buffer[1] === 0xba &&
				buffer[2] === 0xfe &&
				buffer[3] === 0xca);

		return isMachO64 || isFat;
	}

	if (format === "pe") {
		return buffer[0] === 0x4d && buffer[1] === 0x5a;
	}

	return false;
}

function extractZip(zipPath: string, destDir: string): void {
	if (process.platform === "win32") {
		try {
			execSync(`unzip -q "${zipPath}" -d "${destDir}"`, { stdio: "pipe" });
		} catch {
			execSync(
				`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
			);
		}
	} else {
		execSync(`unzip -q "${zipPath}" -d "${destDir}"`);
	}
}

function listZipEntries(zipPath: string): string[] {
	const output = execSync(`unzip -Z1 "${zipPath}"`, { encoding: "utf-8" });

	return output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

function verifyNupkg(): void {
	console.log("=== Verifying Published NuGet (.nupkg) Archives & Native Runtimes ===");

	const rootDir = process.cwd();
	const nugetDir = resolve(rootDir, "dist-nuget");

	if (!existsSync(nugetDir)) {
		console.error(`[FAIL] NuGet directory does not exist: ${nugetDir}`);
		process.exit(1);
	}

	const nupkgFiles = readdirSync(nugetDir).filter((file) => file.endsWith(".nupkg"));

	if (nupkgFiles.length === 0) {
		console.error(`[FAIL] No .nupkg archives found in: ${nugetDir}`);
		process.exit(1);
	}

	console.log(`Found ${nupkgFiles.length} NuGet archive(s) to verify.\n`);

	const requireAllPlatforms =
		process.argv.includes("--all") ||
		process.env.VERIFY_ALL_NATIVE_PREBUILTS === "true" ||
		process.env.VERIFY_ALL_PREBUILTS === "true" ||
		process.env.VERIFY_ALL_NUPKG_PREBUILTS === "true";

	let hasError = false;

	for (const nupkg of nupkgFiles) {
		const fullPath = resolve(nugetDir, nupkg);
		const size = statSync(fullPath).size;

		console.log(`Checking package: ${nupkg} (${(size / 1024).toFixed(1)} kB)`);

		if (size < 100 * 1024) {
			console.error(
				`[FAIL] ${nupkg} is suspiciously small: ${(size / 1024).toFixed(1)} kB`,
			);
			hasError = true;
			continue;
		}

		let entries: string[] = [];

		try {
			entries = listZipEntries(fullPath);
		} catch (error) {
			console.error(`[FAIL] Could not list entries from ${nupkg}: ${String(error)}`);
			hasError = true;
			continue;
		}

		// 1. Verify standard package metadata and DLLs
		const hasNuspec = entries.some((entry) => entry.endsWith(".nuspec"));

		const hasAssembly = entries.includes(
			"lib/netstandard2.1/PrintedJs.HeadlessWebView.dll",
		);

		const hasReadme = entries.includes("README.md");

		if (!hasNuspec) {
			console.error(`[FAIL] ${nupkg} missing nuspec package metadata`);
			hasError = true;
		} else {
			console.log("  ✓ Verified nuspec package manifest");
		}

		if (!hasAssembly) {
			console.error(
				`[FAIL] ${nupkg} missing core managed assembly: lib/netstandard2.1/PrintedJs.HeadlessWebView.dll`,
			);
			hasError = true;
		} else {
			console.log(
				"  ✓ Verified core managed assembly: lib/netstandard2.1/PrintedJs.HeadlessWebView.dll",
			);
		}

		if (!hasReadme) {
			console.error(`[FAIL] ${nupkg} missing README.md`);
			hasError = true;
		} else {
			console.log("  ✓ Verified README.md documentation");
		}

		// 2. Check forbidden entries
		for (const entry of entries) {
			for (const pattern of FORBIDDEN_PATTERNS) {
				if (pattern.test(entry)) {
					console.error(`[FAIL] ${nupkg} contains forbidden entry: ${entry}`);
					hasError = true;
				}
			}
		}

		// 3. Extract and verify prebuilt native libraries
		const tempExtractDir = mkdtempSync(join(tmpdir(), "printedjs-nupkg-verify-"));

		try {
			extractZip(fullPath, tempExtractDir);

			const bundledRids: string[] = [];
			const missingRids: string[] = [];

			for (const platform of DESKTOP_PLATFORMS) {
				const isBundled = entries.includes(platform.binaryPath);

				if (!isBundled) {
					missingRids.push(platform.rid);
					continue;
				}

				bundledRids.push(platform.rid);
				const extractedBinary = resolve(tempExtractDir, platform.binaryPath);

				if (!existsSync(extractedBinary)) {
					console.error(
						`[FAIL] Extracted native binary missing on disk: ${platform.binaryPath}`,
					);
					hasError = true;
					continue;
				}

				const binarySize = statSync(extractedBinary).size;

				if (binarySize < platform.minSizeBytes) {
					console.error(
						`[FAIL] Prebuilt library for ${platform.rid} is too small: ${(binarySize / 1024).toFixed(1)} kB (minimum: ${(platform.minSizeBytes / 1024).toFixed(1)} kB)`,
					);
					hasError = true;
					continue;
				}

				const isValidFormat = validateBinaryFormat(extractedBinary, platform.format);

				if (!isValidFormat) {
					console.error(
						`[FAIL] Prebuilt library for ${platform.rid} has invalid ${platform.format.toUpperCase()} header magic bytes: ${platform.binaryPath}`,
					);
					hasError = true;
					continue;
				}

				console.log(
					`  ✓ Verified ${platform.rid.padEnd(10)} native runtime: ${platform.binaryPath} (${(binarySize / 1024).toFixed(1)} kB, format: ${platform.format.toUpperCase()})`,
				);
			}

			console.log(
				`  Bundled desktop runtimes (${bundledRids.length}/${DESKTOP_PLATFORMS.length}): ${bundledRids.join(", ") || "none"}`,
			);

			if (missingRids.length > 0) {
				console.log(`  Missing desktop runtimes: ${missingRids.join(", ")}`);
			}

			if (requireAllPlatforms) {
				if (missingRids.length > 0) {
					console.error(
						`[FAIL] NuGet package missing prebuilt libraries for platforms: ${missingRids.join(", ")}`,
					);
					hasError = true;
				} else {
					console.log("  ✓ All required desktop platforms bundled successfully.");
				}
			} else if (bundledRids.length === 0) {
				console.error(
					"[FAIL] NuGet package does not contain any native prebuilt desktop runtimes!",
				);
				hasError = true;
			}
		} finally {
			rmSync(tempExtractDir, { recursive: true, force: true });
		}

		console.log();
	}

	if (hasError) {
		console.error("❌ NuGet package verification failed with errors!");
		process.exit(1);
	}

	console.log(`✅ All ${nupkgFiles.length} NuGet archive(s) verified successfully!`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
	verifyNupkg();
}

export type { PlatformConfig };

export { DESKTOP_PLATFORMS, validateBinaryFormat, verifyNupkg };
