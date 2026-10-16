import React, { useCallback, useId, useState } from "react";
import {
	ActivityIndicator,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { getNativeModule, HeadlessWebView } from "../src/index.js";

type ArchitectureMode = "TurboModule (New Arch)" | "Bridge (Legacy Arch)" | "Unavailable";

const detectArchitecture = (): ArchitectureMode => {
	// SAFETY: Inspect global runtime object for React Native TurboModuleRegistry or NativeModules bridge.
	const rnGlobal = globalThis as {
		TurboModuleRegistry?: {
			get<T>(name: string): T | null;
		};
		NativeModules?: {
			HeadlessWebviewModule?: unknown;
		};
	};

	if (rnGlobal.TurboModuleRegistry?.get("HeadlessWebviewModule")) {
		return "TurboModule (New Arch)";
	}

	if (rnGlobal.NativeModules?.HeadlessWebviewModule) {
		return "Bridge (Legacy Arch)";
	}

	return "Unavailable";
};

interface TestResult {
	id: string;
	name: string;
	status: "idle" | "running" | "success" | "failure";
	details?: string | undefined;
}

export const App = (): React.JSX.Element => {
	const [arch] = useState<ArchitectureMode>(detectArchitecture);
	const [isRunningAll, setIsRunningAll] = useState(false);
	const [pdfBytes, setPdfBytes] = useState<number | null>(null);
	const [logs, setLogs] = useState<string[]>([]);

	const [testResults, setTestResults] = useState<TestResult[]>([
		{ id: "mod", name: "Native Module Handshake", status: "idle" },
		{ id: "lifecycle", name: "Instance Lifecycle & Load HTML", status: "idle" },
		{ id: "eval", name: "JavaScript Evaluation", status: "idle" },
		{ id: "pdf", name: "PDF Generation Pipeline", status: "idle" },
		{ id: "cleanup", name: "Resource Disposal", status: "idle" },
	]);

	const logPrefix = useId();

	const appendLog = useCallback((msg: string) => {
		const timestamp = new Date().toLocaleTimeString();

		setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
	}, []);

	const updateTestStatus = useCallback(
		(id: string, status: TestResult["status"], details?: string) => {
			setTestResults((prev) =>
				prev.map((item) => (item.id === id ? { ...item, status, details } : item)),
			);
		},
		[],
	);

	const runFullTestSuite = async () => {
		setIsRunningAll(true);
		appendLog(`Starting test suite on ${arch}...`);

		// Test 1: Native Module Handshake
		updateTestStatus("mod", "running");

		try {
			const mod = getNativeModule();

			if (!mod) {
				throw new Error("getNativeModule returned null or undefined");
			}

			updateTestStatus("mod", "success", `Detected: ${arch}`);
			appendLog(`Native module verified (${arch})`);
		} catch (err) {
			const errMessage = err instanceof Error ? err.message : String(err);

			updateTestStatus("mod", "failure", errMessage);
			appendLog(`Handshake failed: ${errMessage}`);
			setIsRunningAll(false);

			return;
		}

		// Test 2: Instance Lifecycle & Load HTML
		updateTestStatus("lifecycle", "running");
		let webview: HeadlessWebView | null = null;

		try {
			const htmlPayload = `
				<!DOCTYPE html>
				<html>
				<head><style>body { font-family: sans-serif; padding: 24px; color: #1e293b; }</style></head>
				<body>
					<h1 id="title">PrintedJS Headless Webview</h1>
					<p id="desc">Dual Architecture Validation Test</p>
				</body>
				</html>
			`;

			webview = await HeadlessWebView.create({ html: htmlPayload });
			appendLog(`HeadlessWebView instance created: ${webview.id}`);

			await webview.loadHtml(htmlPayload);
			updateTestStatus("lifecycle", "success", `Instance ID: ${webview.id}`);
			appendLog("HTML loaded into headless webview");
		} catch (err) {
			const errMessage = err instanceof Error ? err.message : String(err);

			updateTestStatus("lifecycle", "failure", errMessage);
			appendLog(`Lifecycle failed: ${errMessage}`);
			setIsRunningAll(false);

			return;
		}

		// Test 3: JavaScript Evaluation
		updateTestStatus("eval", "running");

		try {
			const evalResult = await webview.evaluateJavascript(
				"document.getElementById('title').textContent",
			);

			appendLog(`JS evaluation result: "${evalResult}"`);
			updateTestStatus("eval", "success", `Result: "${evalResult}"`);
		} catch (err) {
			const errMessage = err instanceof Error ? err.message : String(err);

			updateTestStatus("eval", "failure", errMessage);
			appendLog(`Evaluation failed: ${errMessage}`);
		}

		// Test 4: PDF Generation Pipeline
		updateTestStatus("pdf", "running");

		try {
			const pdfData = await webview.printToPdf({
				landscape: false,
				printBackground: true,
			});

			setPdfBytes(pdfData.byteLength);
			appendLog(`PDF generated: ${pdfData.byteLength} bytes`);
			updateTestStatus("pdf", "success", `${pdfData.byteLength} bytes produced`);
		} catch (err) {
			const errMessage = err instanceof Error ? err.message : String(err);

			updateTestStatus("pdf", "failure", errMessage);
			appendLog(`PDF failed: ${errMessage}`);
		}

		// Test 5: Resource Disposal
		updateTestStatus("cleanup", "running");

		try {
			await webview.dispose();
			appendLog(`Instance ${webview.id} disposed successfully`);
			updateTestStatus("cleanup", "success", "Disposed");
		} catch (err) {
			const errMessage = err instanceof Error ? err.message : String(err);

			updateTestStatus("cleanup", "failure", errMessage);
			appendLog(`Disposal failed: ${errMessage}`);
		}

		setIsRunningAll(false);
		appendLog("Full test suite finished.");
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>PrintedJS Headless</Text>
					<Text style={styles.headerSubtitle}>
						React Native Dual Architecture & SwiftPM Testbed
					</Text>
				</View>

				<View style={styles.badgeContainer}>
					<Text style={styles.badgeLabel}>Active Architecture:</Text>
					<View
						style={[
							styles.badge,
							arch.includes("TurboModule")
								? styles.badgeNewArch
								: arch.includes("Bridge")
									? styles.badgeLegacy
									: styles.badgeUnavailable,
						]}
					>
						<Text style={styles.badgeText}>{arch}</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Verification Tests</Text>
					{testResults.map((t) => (
						<View key={`${logPrefix}-${t.id}`} style={styles.testItem}>
							<View style={styles.testHeader}>
								<Text style={styles.testName}>{t.name}</Text>
								<Text
									style={[
										styles.testStatus,
										t.status === "success" && styles.statusSuccess,
										t.status === "failure" && styles.statusFailure,
										t.status === "running" && styles.statusRunning,
									]}
								>
									{t.status.toUpperCase()}
								</Text>
							</View>
							{t.details ? <Text style={styles.testDetails}>{t.details}</Text> : null}
						</View>
					))}
				</View>

				<TouchableOpacity
					style={[styles.button, isRunningAll && styles.buttonDisabled]}
					disabled={isRunningAll}
					onPress={runFullTestSuite}
				>
					{isRunningAll ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Text style={styles.buttonText}>Run Architecture Test Suite</Text>
					)}
				</TouchableOpacity>

				{pdfBytes !== null && (
					<View style={styles.metricCard}>
						<Text style={styles.metricTitle}>Latest PDF Payload</Text>
						<Text style={styles.metricValue}>
							{(pdfBytes / 1024).toFixed(1)} KB ({pdfBytes} bytes)
						</Text>
					</View>
				)}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Console Diagnostic Logs</Text>
					<View style={styles.consoleBox}>
						{logs.length === 0 ? (
							<Text style={styles.consoleEmpty}>
								No logs yet. Press run to start test.
							</Text>
						) : (
							logs.map((log) => (
								<Text key={log} style={styles.consoleLine}>
									{log}
								</Text>
							))
						)}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#0f172a",
	},
	container: {
		padding: 20,
	},
	header: {
		marginBottom: 20,
	},
	headerTitle: {
		fontSize: 26,
		fontWeight: "800",
		color: "#f8fafc",
		letterSpacing: -0.5,
	},
	headerSubtitle: {
		fontSize: 14,
		color: "#94a3b8",
		marginTop: 4,
	},
	badgeContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
	},
	badgeLabel: {
		fontSize: 14,
		color: "#cbd5e1",
		marginRight: 10,
	},
	badge: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	badgeNewArch: {
		backgroundColor: "#059669",
	},
	badgeLegacy: {
		backgroundColor: "#d97706",
	},
	badgeUnavailable: {
		backgroundColor: "#dc2626",
	},
	badgeText: {
		color: "#ffffff",
		fontSize: 12,
		fontWeight: "700",
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#e2e8f0",
		marginBottom: 12,
	},
	testItem: {
		backgroundColor: "#1e293b",
		borderRadius: 8,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#334155",
	},
	testHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	testName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#f1f5f9",
	},
	testStatus: {
		fontSize: 12,
		fontWeight: "700",
		color: "#64748b",
	},
	statusSuccess: {
		color: "#34d399",
	},
	statusFailure: {
		color: "#f87171",
	},
	statusRunning: {
		color: "#60a5fa",
	},
	testDetails: {
		fontSize: 13,
		color: "#94a3b8",
		marginTop: 6,
	},
	button: {
		backgroundColor: "#3b82f6",
		borderRadius: 10,
		paddingVertical: 14,
		alignItems: "center",
		marginBottom: 20,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "700",
	},
	metricCard: {
		backgroundColor: "#1e293b",
		borderRadius: 8,
		padding: 16,
		marginBottom: 20,
		borderLeftWidth: 4,
		borderLeftColor: "#3b82f6",
	},
	metricTitle: {
		fontSize: 13,
		color: "#94a3b8",
		textTransform: "uppercase",
		fontWeight: "600",
	},
	metricValue: {
		fontSize: 20,
		fontWeight: "700",
		color: "#38bdf8",
		marginTop: 4,
	},
	consoleBox: {
		backgroundColor: "#020617",
		borderRadius: 8,
		padding: 12,
		minHeight: 120,
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	consoleEmpty: {
		color: "#475569",
		fontStyle: "italic",
		fontSize: 13,
	},
	consoleLine: {
		color: "#a5b4fc",
		fontFamily: "monospace",
		fontSize: 12,
		lineHeight: 18,
	},
});

export default App;
