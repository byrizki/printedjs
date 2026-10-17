import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	DesktopNativeHeadlessWebView,
	enableDesktopBridge,
	getNativeModule,
	HeadlessWebView,
	isDesktopSupported,
	registerNativeModule,
	resolveDesktopBinary,
	type NativeHeadlessWebViewSpec,
} from "../../packages/headless-webview/src/index.js";

describe("@printedjs/headless-webview React Native Dual Architecture", () => {
	const originalGlobal = { ...globalThis } as Record<string, unknown>;

	beforeEach(() => {
		// Reset global runtime injections before each test
		delete (globalThis as Record<string, unknown>).TurboModuleRegistry;
		delete (globalThis as Record<string, unknown>).NativeModules;
	});

	afterEach(() => {
		delete (globalThis as Record<string, unknown>).TurboModuleRegistry;
		delete (globalThis as Record<string, unknown>).NativeModules;

		if (originalGlobal.TurboModuleRegistry) {
			(globalThis as Record<string, unknown>).TurboModuleRegistry =
				originalGlobal.TurboModuleRegistry;
		}

		if (originalGlobal.NativeModules) {
			(globalThis as Record<string, unknown>).NativeModules =
				originalGlobal.NativeModules;
		}
	});

	test("resolves native module via New Architecture (TurboModuleRegistry)", async () => {
		const mockTurboModule: NativeHeadlessWebViewSpec = {
			createInstance: vi.fn().mockResolvedValue("turbo-instance-1"),
			loadHtml: vi.fn().mockResolvedValue(undefined),
			loadUrl: vi.fn().mockResolvedValue(undefined),
			evalScript: vi.fn().mockResolvedValue("eval-result"),
			printToPdf: vi.fn().mockResolvedValue("base64-pdf-content"),
			printToPdfFile: vi.fn().mockResolvedValue(undefined),
			destroyInstance: vi.fn().mockResolvedValue(undefined),
		};

		(globalThis as Record<string, unknown>).TurboModuleRegistry = {
			get: vi.fn().mockReturnValue(mockTurboModule),
		};

		const module = getNativeModule();
		const instanceId = await module.createInstance({ html: "<h1>New Arch</h1>" });

		expect(instanceId).toBe("turbo-instance-1");
		expect(mockTurboModule.createInstance).toHaveBeenCalledWith({
			html: "<h1>New Arch</h1>",
		});

		await module.loadHtml(instanceId, "<p>Updated</p>");
		expect(mockTurboModule.loadHtml).toHaveBeenCalledWith(instanceId, "<p>Updated</p>");

		const pdfBase64 = await module.printToPdf(instanceId, { landscape: true });
		expect(pdfBase64).toBe("base64-pdf-content");
		expect(mockTurboModule.printToPdf).toHaveBeenCalledWith(instanceId, {
			landscape: true,
		});

		await module.destroyInstance(instanceId);
		expect(mockTurboModule.destroyInstance).toHaveBeenCalledWith(instanceId);
	});

	test("resolves native module via Legacy Architecture (NativeModules bridge)", async () => {
		const mockBridgeModule: NativeHeadlessWebViewSpec = {
			createInstance: vi.fn().mockResolvedValue("legacy-instance-42"),
			loadHtml: vi.fn().mockResolvedValue(undefined),
			loadUrl: vi.fn().mockResolvedValue(undefined),
			evalScript: vi.fn().mockResolvedValue("legacy-eval"),
			printToPdf: vi.fn().mockResolvedValue("legacy-pdf-base64"),
			printToPdfFile: vi.fn().mockResolvedValue(undefined),
			destroyInstance: vi.fn().mockResolvedValue(undefined),
		};

		// TurboModuleRegistry is absent in legacy architecture
		(globalThis as Record<string, unknown>).TurboModuleRegistry = undefined;
		(globalThis as Record<string, unknown>).NativeModules = {
			HeadlessWebviewModule: mockBridgeModule,
		};

		const module = getNativeModule();
		const instanceId = await module.createInstance({ url: "https://printedjs.dev" });

		expect(instanceId).toBe("legacy-instance-42");
		expect(mockBridgeModule.createInstance).toHaveBeenCalledWith({
			url: "https://printedjs.dev",
		});

		await module.printToPdfFile(instanceId, "/tmp/legacy.pdf", { landscape: false });
		expect(mockBridgeModule.printToPdfFile).toHaveBeenCalledWith(
			instanceId,
			"/tmp/legacy.pdf",
			{ landscape: false },
		);
	});

	test("throws informative error when native module is unlinked", async () => {
		const unlinkedModule = getNativeModule();

		await expect(
			unlinkedModule.createInstance({ html: "<h1>Test</h1>" }),
		).rejects.toThrow(
			"NativeHeadlessWebView module is not linked or unavailable in this environment.",
		);
	});

	test("HeadlessWebView service coordinates lifecycle across dual arch", async () => {
		const mockModule: NativeHeadlessWebViewSpec = {
			createInstance: vi.fn().mockResolvedValue("session-99"),
			loadHtml: vi.fn().mockResolvedValue(undefined),
			loadUrl: vi.fn().mockResolvedValue(undefined),
			evalScript: vi.fn().mockResolvedValue("ok"),
			printToPdf: vi.fn().mockResolvedValue("bW9jay1wZGY="),
			printToPdfFile: vi.fn().mockResolvedValue(undefined),
			destroyInstance: vi.fn().mockResolvedValue(undefined),
		};

		(globalThis as Record<string, unknown>).NativeModules = {
			HeadlessWebviewModule: mockModule,
		};

		const webview = await HeadlessWebView.create({ html: "<div>Invoice</div>" });
		expect(webview.id).toBe("session-99");
		expect(webview.isDisposed).toBe(false);

		await webview.loadHtml("<div>Page 2</div>");
		expect(mockModule.loadHtml).toHaveBeenCalledWith("session-99", "<div>Page 2</div>");

		const pdf = await webview.printToPdf({ landscape: true });
		expect(pdf).toBeInstanceOf(Uint8Array);
		expect(pdf.length).toBeGreaterThan(0);

		await webview.dispose();
		expect(webview.isDisposed).toBe(true);
		expect(mockModule.destroyInstance).toHaveBeenCalledWith("session-99");

		// Subsequent operations after dispose should throw
		await expect(webview.loadHtml("<div>Expired</div>")).rejects.toThrow(
			"Cannot interact with a destroyed HeadlessWebView instance.",
		);
	});
});

describe("@printedjs/headless-webview iOS & SwiftPM Configuration", () => {
	const packageRoot = resolve(process.cwd(), "packages/headless-webview");

	test("Package.swift exists and configures SwiftPM for iOS 12+", () => {
		const packageSwiftPath = resolve(packageRoot, "Package.swift");
		expect(existsSync(packageSwiftPath)).toBe(true);

		const content = readFileSync(packageSwiftPath, "utf-8");
		expect(content).toContain("// swift-tools-version: 5.9");
		expect(content).toContain('name: "react-native-headless-webview"');
		expect(content).toContain(".iOS(.v12)");
		expect(content).toContain("HeadlessWebviewModule.swift");
		expect(content).toContain("HeadlessWebviewModuleBridge.m");
	});

	test("react-native-headless-webview.podspec supports both New and Legacy Architecture", () => {
		const podspecPath = resolve(packageRoot, "react-native-headless-webview.podspec");
		expect(existsSync(podspecPath)).toBe(true);

		const content = readFileSync(podspecPath, "utf-8");
		expect(content).toContain('s.name         = "react-native-headless-webview"');
		expect(content).toContain('s.platforms    = { :ios => "12.0" }');
		expect(content).toContain("install_modules_dependencies(s)");
		expect(content).toContain('s.dependency "React-Core"');
		expect(content).toContain('"WebKit", "PDFKit", "UIKit"');
	});

	test("iOS native module source files exist", () => {
		const swiftPath = resolve(packageRoot, "ios/HeadlessWebviewModule.swift");
		const bridgePath = resolve(packageRoot, "ios/HeadlessWebviewModuleBridge.m");

		expect(existsSync(swiftPath)).toBe(true);
		expect(existsSync(bridgePath)).toBe(true);

		const swiftContent = readFileSync(swiftPath, "utf-8");
		expect(swiftContent).toContain("@objc(HeadlessWebviewModule)");
		expect(swiftContent).toContain("WKWebView");
		expect(swiftContent).toContain("createPDF");
		expect(swiftContent).toContain("UIPrintPageRenderer");
	});
});

describe("@printedjs/headless-webview Android Architecture Configuration", () => {
	const packageRoot = resolve(process.cwd(), "packages/headless-webview");

	test("android/build.gradle configures dual architecture flags", () => {
		const gradlePath = resolve(packageRoot, "android/build.gradle");
		expect(existsSync(gradlePath)).toBe(true);

		const content = readFileSync(gradlePath, "utf-8");
		expect(content).toContain("isNewArchitectureEnabled()");
		expect(content).toContain("IS_NEW_ARCHITECTURE_ENABLED");
		expect(content).toContain("com.facebook.react:react-android");
	});

	test("HeadlessWebViewPackage implements TurboReactPackage for dual architecture", () => {
		const packagePath = resolve(
			packageRoot,
			"android/src/main/java/com/printedjs/headlesswebview/HeadlessWebViewPackage.kt",
		);

		expect(existsSync(packagePath)).toBe(true);

		const content = readFileSync(packagePath, "utf-8");
		expect(content).toContain("class HeadlessWebViewPackage : TurboReactPackage()");
		expect(content).toContain("getReactModuleInfoProvider");
		expect(content).toContain("HeadlessWebViewModule.NAME");
	});

	test("HeadlessWebViewModule defines companion object NAME and @ReactMethod endpoints", () => {
		const modulePath = resolve(
			packageRoot,
			"android/src/main/java/com/printedjs/headlesswebview/HeadlessWebViewModule.kt",
		);

		expect(existsSync(modulePath)).toBe(true);

		const content = readFileSync(modulePath, "utf-8");
		expect(content).toContain('const val NAME = "HeadlessWebviewModule"');
		expect(content).toContain("@ReactMethod");
		expect(content).toContain("fun createInstance");
		expect(content).toContain("fun printToPdf");
	});
});

describe("@printedjs/headless-webview Packaging Integrity", () => {
	const packageRoot = resolve(process.cwd(), "packages/headless-webview");

	test("package.json declares codegenConfig for React Native Codegen", () => {
		const pkgJsonPath = resolve(packageRoot, "package.json");

		const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
			codegenConfig?: {
				name: string;
				type: string;
				jsModuleName: string;
			};
			files: string[];
		};

		expect(pkg.codegenConfig).toBeDefined();
		expect(pkg.codegenConfig?.name).toBe("RNHeadlessWebViewSpec");
		expect(pkg.codegenConfig?.type).toBe("modules");
		expect(pkg.codegenConfig?.jsModuleName).toBe("NativeHeadlessWebView");

		// Files array must include native directories and exclude crates/dotnet
		expect(pkg.files).toContain("dist");
		expect(pkg.files).toContain("src");
		expect(pkg.files).toContain("ios");
		expect(pkg.files).toContain("android");
		expect(pkg.files).toContain("Package.swift");
		expect(pkg.files).toContain("react-native-headless-webview.podspec");

		expect(pkg.files).not.toContain("crates");
		expect(pkg.files).not.toContain("dotnet");
		expect(pkg.files).not.toContain("target");
	});
});

describe("@printedjs/headless-webview Desktop Binding & Harness Integration", () => {
	afterEach(() => {
		registerNativeModule(null);
	});

	test("resolves native desktop binary and detects desktop support", () => {
		if (isDesktopSupported()) {
			const binaryPath = resolveDesktopBinary();
			expect(existsSync(binaryPath)).toBe(true);
		} else {
			expect(isDesktopSupported()).toBe(false);
		}
	});

	test.runIf(isDesktopSupported())(
		"registers desktop native module and executes real HTML to PDF pipeline with options",
		async () => {
			const desktopBridge = enableDesktopBridge();

			expect(desktopBridge).toBeInstanceOf(DesktopNativeHeadlessWebView);

			const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Desktop Harness Test</title></head>
			<body>
				<h1 id="title">PrintedJS Desktop Headless Webview</h1>
				<p id="desc">React Native Desktop Binding Test</p>
			</body>
			</html>
		`;

			const webview = await HeadlessWebView.create({ html });

			expect(webview.id.length).toBeGreaterThan(0);
			expect(desktopBridge.callStats.createInstanceCount).toBe(1);

			// Test script evaluation: document.title
			const title = await webview.evaluateJavascript("document.title");

			expect(title).toBe("Desktop Harness Test");

			// Test script evaluation: getElementById
			const heading = await webview.evaluateJavascript(
				"document.getElementById('title').textContent",
			);

			expect(heading).toBe("PrintedJS Desktop Headless Webview");

			// Test real PDF conversion with options forwarding (landscape, scale)
			const pdfBytes = await webview.printToPdf({
				landscape: true,
				scale: 1.0,
				pageWidth: 8.27,
				pageHeight: 11.69,
				printBackground: true,
			});

			expect(pdfBytes).toBeInstanceOf(Uint8Array);
			expect(pdfBytes.byteLength).toBeGreaterThan(1000);

			// Verify %PDF-1.4 header
			expect(pdfBytes[0]).toBe(0x25);
			expect(pdfBytes[1]).toBe(0x50);
			expect(pdfBytes[2]).toBe(0x44);
			expect(pdfBytes[3]).toBe(0x46);

			expect(desktopBridge.callStats.printToPdfCount).toBe(1);
			expect(desktopBridge.callStats.lastOptions?.landscape).toBe(true);

			// Test cleanup
			await webview.dispose();
			expect(desktopBridge.callStats.destroyInstanceCount).toBe(1);
			expect(desktopBridge.activeSessionCount).toBe(0);
		},
	);
});
