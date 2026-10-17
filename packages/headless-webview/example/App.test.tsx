import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	DesktopNativeHeadlessWebView,
	enableDesktopBridge,
	isDesktopSupported,
	NativeHeadlessWebView,
	registerNativeModule,
	type NativeHeadlessWebViewSpec,
} from "@printedjs/headless-webview";

declare global {
	var TurboModuleRegistry:
		| {
				get<T>(name: string): T | null;
		  }
		| undefined;

	var NativeModules:
		| {
				HeadlessWebviewModule?: NativeHeadlessWebViewSpec;
		  }
		| undefined;
}

describe(
	"React Native Native Module Bridging & Real PDF Output (Without Mocks)",
	{ timeout: 30000 },
	() => {
		let desktopNative: DesktopNativeHeadlessWebView;

		beforeEach(() => {
			desktopNative = new DesktopNativeHeadlessWebView();
		});

		afterEach(() => {
			globalThis.TurboModuleRegistry = undefined;
			globalThis.NativeModules = undefined;
			registerNativeModule(null);
		});

		it.runIf(!isDesktopSupported())(
			"detects desktop prebuilts requirement when running without compiled native binaries",
			() => {
				expect(isDesktopSupported()).toBe(false);
			},
		);

		it.runIf(isDesktopSupported())(
			"validates direct native module bridging pipeline and real PDF output without mocks",
			async () => {
				globalThis.TurboModuleRegistry = {
					get: (name: string) =>
						name === "HeadlessWebviewModule" ? desktopNative : null,
				};

				// 1. Invoke native bridging methods directly through React Native NativeHeadlessWebView spec
				const instanceId = await NativeHeadlessWebView.createInstance({
					html: `
				<!DOCTYPE html>
				<html>
				<body>
					<h1 id="title">PrintedJS Headless Webview</h1>
					<p id="desc">Direct Native Bridge Test</p>
				</body>
				</html>
			`,
				});

				expect(instanceId).toBeDefined();
				expect(instanceId.length).toBeGreaterThan(0);
				expect(desktopNative.callStats.createInstanceCount).toBe(1);
				expect(desktopNative.activeSessionCount).toBe(1);

				// 2. Validate native script evaluation through bridge
				const title = await NativeHeadlessWebView.evalScript(
					instanceId,
					"document.getElementById('title').textContent",
				);

				expect(title).toBe("PrintedJS Headless Webview");
				expect(desktopNative.callStats.evalScriptCount).toBe(1);

				// 3. Validate real native PDF generation through bridge (calling compiled binary)
				const base64Pdf = await NativeHeadlessWebView.printToPdf(instanceId, {
					landscape: false,
					printBackground: true,
				});

				expect(desktopNative.callStats.printToPdfCount).toBe(1);
				expect(desktopNative.callStats.lastOptions?.printBackground).toBe(true);

				// Validate genuine PDF output bytes from native engine
				const pdfBuffer = Buffer.from(base64Pdf, "base64");

				// Genuine rendered PDF is substantial (over 1KB, unlike fake mock strings)
				expect(pdfBuffer.byteLength).toBeGreaterThan(1000);

				// Verify %PDF magic bytes (0x25, 0x50, 0x44, 0x46)
				expect(pdfBuffer[0]).toBe(0x25);
				expect(pdfBuffer[1]).toBe(0x50);
				expect(pdfBuffer[2]).toBe(0x44);
				expect(pdfBuffer[3]).toBe(0x46);
				expect(pdfBuffer.subarray(0, 8).toString("utf-8")).toMatch(/%PDF-1\.[3-7]/);

				// Verify standard PDF structure markers
				const pdfString = pdfBuffer.toString("latin1");

				expect(pdfString).toContain("%%EOF");

				// 4. Validate native instance teardown through bridge
				await NativeHeadlessWebView.destroyInstance(instanceId);

				expect(desktopNative.callStats.destroyInstanceCount).toBe(1);
				expect(desktopNative.activeSessionCount).toBe(0);
			},
		);

		it.runIf(isDesktopSupported())(
			"renders and completes HTML to PDF verification on Fabric (TurboModule / New Arch) without mocks",
			async () => {
				globalThis.TurboModuleRegistry = {
					get: (name: string) =>
						name === "HeadlessWebviewModule" ? desktopNative : null,
				};

				const { App } = await import("./App.js");

				let renderer!: TestRenderer.ReactTestRenderer;

				await act(async () => {
					renderer = TestRenderer.create(<App />);
				});

				// 1. Verify Architecture Badge displays Fabric / TurboModule
				const badge = renderer.root.findByProps({ testID: "active-arch-badge" });

				expect(badge.props.children).toBe("TurboModule (New Arch)");

				// 2. Trigger Architecture Test Suite
				const runButton = renderer.root.findByProps({ testID: "run-tests-button" });

				await act(async () => {
					await runButton.props.onPress();
				});

				// 3. Verify real native module bridging calls were made
				expect(desktopNative.callStats.createInstanceCount).toBe(1);
				expect(desktopNative.callStats.loadHtmlCount).toBe(1);
				expect(desktopNative.callStats.evalScriptCount).toBe(1);
				expect(desktopNative.callStats.printToPdfCount).toBe(1);
				expect(desktopNative.callStats.lastOptions?.printBackground).toBe(true);
				expect(desktopNative.callStats.destroyInstanceCount).toBe(1);
				expect(desktopNative.activeSessionCount).toBe(0);

				// 4. Verify UI Status of all verification pipeline steps
				const modStatus = renderer.root.findByProps({ testID: "test-status-mod" });

				expect(modStatus.props.children).toBe("SUCCESS");

				const lifecycleStatus = renderer.root.findByProps({
					testID: "test-status-lifecycle",
				});

				expect(lifecycleStatus.props.children).toBe("SUCCESS");

				const evalStatus = renderer.root.findByProps({ testID: "test-status-eval" });

				expect(evalStatus.props.children).toBe("SUCCESS");

				const pdfStatus = renderer.root.findByProps({ testID: "test-status-pdf" });

				expect(pdfStatus.props.children).toBe("SUCCESS");

				const cleanupStatus = renderer.root.findByProps({
					testID: "test-status-cleanup",
				});

				expect(cleanupStatus.props.children).toBe("SUCCESS");

				// 5. Verify real PDF output details in the UI
				const pdfDetails = renderer.root.findByProps({ testID: "test-details-pdf" });

				expect(pdfDetails.props.children).toContain("✓ Verified %PDF header");
				expect(pdfDetails.props.children).toContain("bytes produced");

				// 6. Verify PDF Payload Metric Card shows real rendered byte count (>100KB)
				const pdfPayload = renderer.root.findByProps({ testID: "latest-pdf-payload" });

				const payloadText = Array.isArray(pdfPayload.props.children)
					? pdfPayload.props.children.join("")
					: String(pdfPayload.props.children);

				const match = /([\d,]+)\s*bytes/.exec(payloadText);

				expect(match).not.toBeNull();

				const numericBytes = Number.parseInt(match![1].replace(/,/g, ""), 10);

				expect(numericBytes).toBeGreaterThan(1000);

				const pdfHeader = renderer.root.findByProps({ testID: "latest-pdf-header" });

				expect(pdfHeader.props.children).toContain("%PDF");
			},
		);

		it.runIf(isDesktopSupported())(
			"renders and completes HTML to PDF verification on Legacy Architecture (Bridge / NativeModules) without mocks",
			async () => {
				globalThis.NativeModules = {
					HeadlessWebviewModule: desktopNative,
				};

				const { App } = await import("./App.js");

				let renderer!: TestRenderer.ReactTestRenderer;

				await act(async () => {
					renderer = TestRenderer.create(<App />);
				});

				// 1. Verify Architecture Badge displays Legacy / Bridge
				const badge = renderer.root.findByProps({ testID: "active-arch-badge" });

				expect(badge.props.children).toBe("Bridge (Legacy Arch)");

				// 2. Trigger Architecture Test Suite
				const runButton = renderer.root.findByProps({ testID: "run-tests-button" });

				await act(async () => {
					await runButton.props.onPress();
				});

				// 3. Verify real native module bridging calls were made
				expect(desktopNative.callStats.createInstanceCount).toBe(1);
				expect(desktopNative.callStats.loadHtmlCount).toBe(1);
				expect(desktopNative.callStats.evalScriptCount).toBe(1);
				expect(desktopNative.callStats.printToPdfCount).toBe(1);
				expect(desktopNative.callStats.destroyInstanceCount).toBe(1);
				expect(desktopNative.activeSessionCount).toBe(0);

				// 4. Verify UI Status of all verification pipeline steps
				const pdfStatus = renderer.root.findByProps({ testID: "test-status-pdf" });

				expect(pdfStatus.props.children).toBe("SUCCESS");

				const pdfDetails = renderer.root.findByProps({ testID: "test-details-pdf" });

				expect(pdfDetails.props.children).toContain("✓ Verified %PDF header");

				// 5. Verify PDF Payload Metric Card shows real rendered byte count (>100KB)
				const pdfPayload = renderer.root.findByProps({ testID: "latest-pdf-payload" });

				const payloadText = Array.isArray(pdfPayload.props.children)
					? pdfPayload.props.children.join("")
					: String(pdfPayload.props.children);

				const match = /([\d,]+)\s*bytes/.exec(payloadText);

				expect(match).not.toBeNull();

				const numericBytes = Number.parseInt(match![1].replace(/,/g, ""), 10);

				expect(numericBytes).toBeGreaterThan(1000);

				const pdfHeader = renderer.root.findByProps({ testID: "latest-pdf-header" });

				expect(pdfHeader.props.children).toContain("%PDF");
			},
		);

		it.runIf(isDesktopSupported())(
			"renders and completes HTML to PDF verification on React Native Desktop via enableDesktopBridge() without mocks",
			async () => {
				const desktop = enableDesktopBridge();

				const { App } = await import("./App.js");

				let renderer!: TestRenderer.ReactTestRenderer;

				await act(async () => {
					renderer = TestRenderer.create(<App />);
				});

				// 1. Verify Architecture Badge displays Desktop Bridge
				const badge = renderer.root.findByProps({ testID: "active-arch-badge" });

				expect(badge.props.children).toBe("Desktop Bridge (Wry Engine)");

				// 2. Trigger Architecture Test Suite
				const runButton = renderer.root.findByProps({ testID: "run-tests-button" });

				await act(async () => {
					await runButton.props.onPress();
				});

				// 3. Verify real native module calls were made through desktop bridge
				expect(desktop.callStats.createInstanceCount).toBe(1);
				expect(desktop.callStats.loadHtmlCount).toBe(1);
				expect(desktop.callStats.evalScriptCount).toBe(1);
				expect(desktop.callStats.printToPdfCount).toBe(1);
				expect(desktop.callStats.destroyInstanceCount).toBeGreaterThanOrEqual(1);
				expect(desktop.activeSessionCount).toBe(0);

				// 4. Verify UI Status of all verification pipeline steps
				const pdfStatus = renderer.root.findByProps({ testID: "test-status-pdf" });

				expect(pdfStatus.props.children).toBe("SUCCESS");

				const pdfDetails = renderer.root.findByProps({ testID: "test-details-pdf" });

				expect(pdfDetails.props.children).toContain("✓ Verified %PDF header");

				// 5. Verify PDF Payload Metric Card shows real rendered byte count (>100KB)
				const pdfPayload = renderer.root.findByProps({ testID: "latest-pdf-payload" });

				const payloadText = Array.isArray(pdfPayload.props.children)
					? pdfPayload.props.children.join("")
					: String(pdfPayload.props.children);

				const match = /([\d,]+)\s*bytes/.exec(payloadText);

				expect(match).not.toBeNull();

				const numericBytes = Number.parseInt(match![1].replace(/,/g, ""), 10);

				expect(numericBytes).toBeGreaterThan(1000);

				const pdfHeader = renderer.root.findByProps({ testID: "latest-pdf-header" });

				expect(pdfHeader.props.children).toContain("%PDF");
			},
		);
	},
);
