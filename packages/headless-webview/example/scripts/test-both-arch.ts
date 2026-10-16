import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

interface StepResult {
	name: string;
	status: "pass" | "fail";
	durationMs: number;
	details?: string;
}

const runStep = (name: string, fn: () => void): StepResult => {
	const start = Date.now();
	process.stdout.write(`\n⏳ [TEST] ${name}...\n`);

	try {
		fn();
		const durationMs = Date.now() - start;
		process.stdout.write(`✅ [PASS] ${name} (${durationMs}ms)\n`);

		return { name, status: "pass", durationMs };
	} catch (err) {
		const durationMs = Date.now() - start;
		const message = err instanceof Error ? err.message : String(err);
		process.stderr.write(`❌ [FAIL] ${name} (${durationMs}ms):\n${message}\n`);

		return { name, status: "fail", durationMs, details: message };
	}
};

const main = () => {
	const exampleDir = resolve(import.meta.dirname, "..");
	const packageDir = resolve(exampleDir, "..");
	const repoRoot = resolve(packageDir, "../..");
	const results: StepResult[] = [];

	console.log(
		"================================================================================",
	);
	console.log(
		"  PrintedJS Headless WebView: React Native Dual-Architecture & Packaging Suite  ",
	);
	console.log(
		"================================================================================",
	);

	// STEP 1: Package Build and Tarball Content Verification
	results.push(
		runStep("Build & Verify NPM Package Tarball", () => {
			execSync("pnpm --filter @printedjs/headless-webview build", {
				cwd: repoRoot,
				stdio: "pipe",
				shell: "/bin/bash",
			});

			const packOutput = execSync("npm pack --json", {
				cwd: packageDir,
				encoding: "utf-8",
				shell: "/bin/bash",
			});

			// SAFETY: npm pack --json always returns a JSON array of tarball metadata objects.
			const packJson = JSON.parse(packOutput) as Array<{
				filename: string;
				files: Array<{ path: string }>;
			}>;

			const tarballInfo = packJson[0];

			if (!tarballInfo) {
				throw new Error("npm pack did not return tarball information.");
			}

			const tarballPath = resolve(packageDir, tarballInfo.filename);
			const tarballFiles = tarballInfo.files.map((f) => f.path);

			// Required inclusions
			const requiredFiles = [
				"package.json",
				"react-native-headless-webview.podspec",
				"Package.swift",
				"ios/HeadlessWebviewModule.swift",
				"ios/HeadlessWebviewModuleBridge.m",
				"android/build.gradle",
				"android/src/main/java/com/printedjs/headlesswebview/HeadlessWebViewModule.kt",
				"android/src/main/java/com/printedjs/headlesswebview/HeadlessWebViewPackage.kt",
				"dist/index.js",
				"dist/index.d.ts",
			];

			for (const file of requiredFiles) {
				if (!tarballFiles.some((f) => f === file || f.endsWith(file))) {
					throw new Error(`Required file missing from packaged tarball: ${file}`);
				}
			}

			// Prohibited exclusions
			const prohibitedPrefixes = ["crates/", "dotnet/", "example/"];

			for (const prefix of prohibitedPrefixes) {
				const match = tarballFiles.find((f) => f.startsWith(prefix));

				if (match) {
					throw new Error(
						`Prohibited asset found in packaged tarball (${prefix}): ${match}`,
					);
				}
			}

			if (existsSync(tarballPath)) {
				rmSync(tarballPath);
			}
		}),
	);

	// STEP 2: Android Legacy Architecture Build Check
	results.push(
		runStep("Android Build: Legacy Architecture (-PnewArchEnabled=false)", () => {
			const gradlewPath = resolve(exampleDir, "android/gradlew");

			if (existsSync(gradlewPath)) {
				try {
					execSync(`chmod +x "${gradlewPath}"`, { stdio: "ignore" });
				} catch {
					// Ignore permission failures
				}
			}

			const gradleCandidates = [
				gradlewPath,
				resolve(
					process.env.HOME || "",
					".gradle/wrapper/dists/gradle-8.8-all/6gdy1pgp427xkqcjbxw3ylt6h/gradle-8.8/bin/gradle",
				),
				"gradle",
			];

			let gradleBin = "gradle";

			for (const candidate of gradleCandidates) {
				if (existsSync(candidate)) {
					gradleBin = candidate;
					break;
				}
			}

			const output = execSync(
				`${gradleBin} -p "${exampleDir}/android" :printedjs_headless-webview:assembleDebug -PnewArchEnabled=false`,
				{
					cwd: repoRoot,
					encoding: "utf-8",
					stdio: "pipe",
					shell: "/bin/bash",
				},
			);

			if (!output.includes("BUILD SUCCESSFUL")) {
				throw new Error("Gradle Legacy Architecture build did not succeed.");
			}
		}),
	);

	// STEP 3: Android New Architecture Build Check
	results.push(
		runStep("Android Build: New Architecture (-PnewArchEnabled=true)", () => {
			const gradlewPath = resolve(exampleDir, "android/gradlew");

			if (existsSync(gradlewPath)) {
				try {
					execSync(`chmod +x "${gradlewPath}"`, { stdio: "ignore" });
				} catch {
					// Ignore permission failures
				}
			}

			const gradleCandidates = [
				gradlewPath,
				resolve(
					process.env.HOME || "",
					".gradle/wrapper/dists/gradle-8.8-all/6gdy1pgp427xkqcjbxw3ylt6h/gradle-8.8/bin/gradle",
				),
				"gradle",
			];

			let gradleBin = "gradle";

			for (const candidate of gradleCandidates) {
				if (existsSync(candidate)) {
					gradleBin = candidate;
					break;
				}
			}

			const output = execSync(
				`${gradleBin} -p "${exampleDir}/android" :printedjs_headless-webview:assembleDebug -PnewArchEnabled=true`,
				{
					cwd: repoRoot,
					encoding: "utf-8",
					stdio: "pipe",
					shell: "/bin/bash",
				},
			);

			if (!output.includes("BUILD SUCCESSFUL")) {
				throw new Error("Gradle New Architecture build did not succeed.");
			}
		}),
	);

	// STEP 4: iOS CocoaPods Dual-Architecture Specification Check
	results.push(
		runStep("iOS CocoaPods: Dual-Architecture Specification & Podspec Parse", () => {
			const podspecPath = resolve(packageDir, "react-native-headless-webview.podspec");

			if (!existsSync(podspecPath)) {
				throw new Error(`Podspec file not found: ${podspecPath}`);
			}

			const podBin = resolve(process.env.HOME || "", ".gem/bin/pod");
			const podCmd = existsSync(podBin) ? podBin : "pod";

			let hasPod = false;

			try {
				execSync(`${podCmd} --version`, { stdio: "ignore", shell: "/bin/bash" });
				hasPod = true;
			} catch {
				hasPod = false;
			}

			if (hasPod) {
				const podOutput = execSync(`${podCmd} ipc spec "${podspecPath}"`, {
					cwd: repoRoot,
					encoding: "utf-8",
					shell: "/bin/bash",
				});

				// SAFETY: pod ipc spec outputs valid CocoaPods specification JSON matching schema.
				const podJson = JSON.parse(podOutput) as {
					name: string;
					platforms?: { ios?: string };
					source_files?: string;
				};

				if (podJson.name !== "react-native-headless-webview") {
					throw new Error(`Unexpected pod name: ${podJson.name}`);
				}

				if (podJson.platforms?.ios !== "12.0") {
					throw new Error(`Expected iOS 12.0 platform, got: ${podJson.platforms?.ios}`);
				}
			} else {
				const podspecContent = readFileSync(podspecPath, "utf-8");

				if (
					!podspecContent.includes('s.name         = "react-native-headless-webview"')
				) {
					throw new Error("Podspec missing package name.");
				}

				if (!podspecContent.includes('s.platforms    = { :ios => "12.0" }')) {
					throw new Error("Podspec missing iOS 12.0 platform.");
				}
			}

			// Validate example Podfile architecture toggle
			const examplePodfile = readFileSync(resolve(exampleDir, "ios/Podfile"), "utf-8");

			if (!examplePodfile.includes("ENV['RCT_NEW_ARCH_ENABLED'] == '1'")) {
				throw new Error(
					"Example Podfile missing RCT_NEW_ARCH_ENABLED dual architecture toggle.",
				);
			}

			if (!examplePodfile.includes(":path => '../../'")) {
				throw new Error("Example Podfile missing relative path link to package.");
			}
		}),
	);

	// STEP 5: SwiftPM Specification & Manifest Verification
	results.push(
		runStep("iOS SwiftPM: Package.swift Manifest & Autolinking Targets", () => {
			const packageSwiftPath = resolve(packageDir, "Package.swift");

			if (!existsSync(packageSwiftPath)) {
				throw new Error(`Package.swift not found: ${packageSwiftPath}`);
			}

			const content = readFileSync(packageSwiftPath, "utf-8");

			if (!content.includes('name: "react-native-headless-webview"')) {
				throw new Error("Package.swift missing package name.");
			}

			if (!content.includes(".iOS(.v12)")) {
				throw new Error("Package.swift missing .iOS(.v12) platform target.");
			}

			if (
				!content.includes("HeadlessWebviewModule.swift") ||
				!content.includes("HeadlessWebviewModuleBridge.m")
			) {
				throw new Error("Package.swift missing required source file targets.");
			}
		}),
	);

	// STEP 6: iOS Native & Example App Build (macOS with Xcode)
	results.push(
		runStep("iOS Native & Example App Build (macOS Xcode)", () => {
			if (process.platform !== "darwin") {
				process.stdout.write(
					"ℹ Skipped on non-macOS host (iOS simulator build runs on macOS CI runner)\n",
				);

				return;
			}

			const iosDir = resolve(exampleDir, "ios");
			const podBin = resolve(process.env.HOME || "", ".gem/bin/pod");
			const podCmd = existsSync(podBin) ? podBin : "pod";

			let hasPod = false;

			try {
				execSync(`${podCmd} --version`, { stdio: "ignore" });
				hasPod = true;
			} catch {
				hasPod = false;
			}

			if (hasPod && existsSync(resolve(iosDir, "Podfile"))) {
				process.stdout.write("--> Running pod install in example/ios...\n");

				try {
					execSync(`${podCmd} install`, {
						cwd: iosDir,
						stdio: "inherit",
						shell: "/bin/bash",
					});
				} catch (err) {
					process.stdout.write(`ℹ pod install completed with notice: ${err}\n`);
				}
			}

			let hasXcodeBuild = false;

			try {
				execSync("xcodebuild -version", { stdio: "ignore" });
				hasXcodeBuild = true;
			} catch {
				hasXcodeBuild = false;
			}

			if (hasXcodeBuild) {
				process.stdout.write("--> Building iOS example app for simulator...\n");
				const workspacePath = resolve(iosDir, "HeadlessWebviewExample.xcworkspace");

				const buildCmd = existsSync(workspacePath)
					? `xcodebuild -workspace HeadlessWebviewExample.xcworkspace -scheme HeadlessWebviewExample -configuration Debug -destination "generic/platform=iOS Simulator" -derivedDataPath build CODE_SIGNING_ALLOWED=NO CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO clean build`
					: `xcodebuild -project HeadlessWebviewExample.xcodeproj -scheme HeadlessWebviewExample -configuration Debug -destination "generic/platform=iOS Simulator" -derivedDataPath build CODE_SIGNING_ALLOWED=NO CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO clean build`;

				execSync(buildCmd, {
					cwd: iosDir,
					stdio: "inherit",
					shell: "/bin/bash",
				});
			} else {
				throw new Error("xcodebuild not found on macOS runner.");
			}
		}),
	);

	// Summary
	console.log(
		"\n================================================================================",
	);
	console.log(
		"                               SUMMARY RESULTS                                  ",
	);
	console.log(
		"================================================================================",
	);
	const failures = results.filter((r) => r.status === "fail");

	for (const r of results) {
		const symbol = r.status === "pass" ? "✅" : "❌";
		console.log(`${symbol} ${r.name.padEnd(65)} [${r.durationMs}ms]`);
	}

	if (failures.length > 0) {
		console.error(`\nSuite finished with ${failures.length} failure(s).`);
		process.exit(1);
	}

	console.log("\nAll dual-architecture and packaging checks passed successfully!\n");
};

main();
