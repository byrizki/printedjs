import { EditorPanelComponent } from "./components/editor-panel.js";
import { HeaderComponent } from "./components/header.js";
import { ViewportComponent } from "./components/viewport.js";
import { FIXTURE_CATALOG } from "./fixtures/index.js";
import { setMonacoTheme } from "./services/monaco-setup.js";
import { RenderService } from "./services/render-service.js";
import { compileTemplate, parseJsonData } from "./services/template-service.js";
import "./styles/index.css";
import type { ViewMode } from "./types/editor.js";
import type {
	PlaygroundApp,
	PlaygroundFixture,
	PlaygroundState,
	RenderStats,
} from "./types/playground.js";

interface ExtendedPlaygroundState extends PlaygroundState {
	theme: "light" | "dark";
	isSidebarOpen: boolean;
}

interface PersistedPlaygroundState {
	readonly fixtureId?: string;
	readonly isCustomTemplate?: boolean;
	readonly isCustomData?: boolean;
	readonly templateContent?: string;
	readonly dataJsonContent?: string;
	readonly isolationMode?: "root" | "iframe";
	readonly viewMode?: ViewMode;
	readonly zoomLevel?: number;
	readonly autoRender?: boolean;
	readonly theme?: "light" | "dark";
	readonly isSidebarOpen?: boolean;
}

const STORAGE_KEY = "printedjs_playground_v2";

function loadPersistedState(): PersistedPlaygroundState | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as PersistedPlaygroundState;
	} catch {
		return null;
	}
}

function savePersistedState(saved: PersistedPlaygroundState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
	} catch {
		// Ignore storage quota or disabled errors
	}
}

export function initPlayground(rootElement: HTMLElement): PlaygroundApp {
	const persisted = loadPersistedState();
	const initialFixture: PlaygroundFixture =
		(persisted?.fixtureId
			? FIXTURE_CATALOG.find((f) => f.id === persisted.fixtureId)
			: undefined) ?? FIXTURE_CATALOG[0]!;

	const initialTemplate =
		persisted?.isCustomTemplate && persisted.templateContent !== undefined
			? persisted.templateContent
			: initialFixture.html;

	const initialDataJson =
		persisted?.isCustomData && persisted.dataJsonContent !== undefined
			? persisted.dataJsonContent
			: JSON.stringify(initialFixture.data ?? {}, null, 2);

	const initialIsolation = persisted?.isolationMode ?? "root";
	const initialViewMode = persisted?.viewMode ?? "single";
	const initialZoom = persisted?.zoomLevel ?? 1.0;
	const initialAutoRender = persisted?.autoRender ?? true;
	const initialTheme = persisted?.theme ?? "dark";
	const initialSidebarOpen = persisted?.isSidebarOpen ?? true;

	// Apply initial theme to document and monaco
	document.documentElement.setAttribute("data-theme", initialTheme);
	setMonacoTheme(initialTheme);

	const state: ExtendedPlaygroundState = {
		currentFixture: initialFixture,
		templateContent: initialTemplate,
		dataJsonContent: initialDataJson,
		compiledHtml: "",
		isolationMode: initialIsolation,
		autoRender: initialAutoRender,
		zoomLevel: initialZoom,
		viewMode: initialViewMode,
		showDevtoolsOverlay: false,
		activeTab: "template",
		theme: initialTheme,
		isSidebarOpen: initialSidebarOpen,
		stats: null,
		isRendering: false,
		error: null,
	};

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const persistCurrentState = () => {
		const isCustomTemplate = state.templateContent !== state.currentFixture.html;
		const defaultDataJson = JSON.stringify(state.currentFixture.data ?? {}, null, 2);
		const isCustomData = state.dataJsonContent.trim() !== defaultDataJson.trim();

		savePersistedState({
			fixtureId: state.currentFixture.id,
			isCustomTemplate,
			isCustomData,
			...(isCustomTemplate ? { templateContent: state.templateContent } : {}),
			...(isCustomData ? { dataJsonContent: state.dataJsonContent } : {}),
			isolationMode: state.isolationMode,
			viewMode: state.viewMode,
			zoomLevel: state.zoomLevel,
			autoRender: state.autoRender,
			theme: state.theme,
			isSidebarOpen: state.isSidebarOpen,
		});
	};

	// App shell layout structure
	rootElement.innerHTML = `
		<div class="pm-app-shell">
			<div id="pm-header-slot"></div>
			<div class="pm-workspace">
				<div id="pm-sidebar-slot" style="display: flex; height: 100%; min-height: 0; overflow: hidden;"></div>
				<div id="pm-viewport-slot" style="flex: 1; display: flex; height: 100%; min-height: 0; overflow: hidden; position: relative;"></div>
			</div>
		</div>
	`;

	const headerSlot = rootElement.querySelector<HTMLElement>("#pm-header-slot")!;
	const sidebarSlot = rootElement.querySelector<HTMLElement>("#pm-sidebar-slot")!;
	const viewportSlot = rootElement.querySelector<HTMLElement>("#pm-viewport-slot")!;

	const scheduleAutoRender = () => {
		if (!state.autoRender) return;
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			void executePipeline();
		}, 400);
	};

	const handlePrint = () => {
		if (state.isolationMode === "iframe") {
			const iframe = viewportComponent.renderViewport.querySelector<HTMLIFrameElement>(
				"iframe[data-playground-frame]",
			);
			if (iframe?.contentWindow) {
				iframe.contentWindow.focus();
				iframe.contentWindow.print();
				return;
			}
		}
		window.print();
	};

	const viewportComponent = new ViewportComponent({
		initialZoom: state.zoomLevel,
		initialViewMode: state.viewMode,
		initialOverlayVisible: state.showDevtoolsOverlay,
		callbacks: {
			onZoomChange(zoom) {
				state.zoomLevel = zoom;
				persistCurrentState();
			},
			onViewModeChange(mode: ViewMode) {
				state.viewMode = mode;
				persistCurrentState();
			},
			onOverlayToggle(visible) {
				state.showDevtoolsOverlay = visible;
				renderService.setOverlayVisible(visible, state.stats?.traceReport);
			},
			onPrintClick() {
				handlePrint();
			},
		},
	});
	viewportSlot.appendChild(viewportComponent.element);

	const renderService = new RenderService({
		rootElement,
		viewportElement: viewportComponent.renderViewport,
	});

	const toggleSidebar = () => {
		state.isSidebarOpen = !state.isSidebarOpen;
		editorPanelComponent.setCollapsed(!state.isSidebarOpen);
		headerComponent.setSidebarOpen(state.isSidebarOpen);
		setTimeout(() => {
			viewportComponent.adjustIframe();
			if (state.viewMode === "spread") {
				viewportComponent.fitToView();
			}
		}, 200);
		persistCurrentState();
	};

	const toggleTheme = () => {
		const nextTheme = state.theme === "dark" ? "light" : "dark";
		state.theme = nextTheme;
		document.documentElement.setAttribute("data-theme", nextTheme);
		setMonacoTheme(nextTheme);
		headerComponent.setTheme(nextTheme);
		persistCurrentState();
	};

	const editorPanelComponent = new EditorPanelComponent({
		initialFixture,
		initialTemplate: state.templateContent,
		initialDataJson: state.dataJsonContent,
		initialCompiledHtml: state.compiledHtml,
		callbacks: {
			onTemplateChange(newTemplate) {
				state.templateContent = newTemplate;
				persistCurrentState();
				scheduleAutoRender();
			},
			onDataChange(newDataJson) {
				state.dataJsonContent = newDataJson;
				persistCurrentState();
				scheduleAutoRender();
			},
			onResetFixture() {
				const fixture = state.currentFixture;
				state.templateContent = fixture.html;
				state.dataJsonContent = JSON.stringify(fixture.data ?? {}, null, 2);
				persistCurrentState();
				editorPanelComponent.setFixture(
					fixture,
					state.templateContent,
					state.dataJsonContent,
				);
				void executePipeline();
			},
			onToggleSidebar() {
				toggleSidebar();
			},
		},
	});
	sidebarSlot.appendChild(editorPanelComponent.element);
	editorPanelComponent.setCollapsed(!state.isSidebarOpen);
	editorPanelComponent.layout();

	const resizeHandler = () => {
		editorPanelComponent.layout();
		if (state.viewMode === "spread") {
			viewportComponent.fitToView();
		}
	};
	window.addEventListener("resize", resizeHandler);

	const headerComponent = new HeaderComponent({
		fixtures: FIXTURE_CATALOG,
		initialFixtureId: initialFixture.id,
		initialIsolation: state.isolationMode,
		initialAutoRender: state.autoRender,
		initialTheme: state.theme,
		isSidebarOpen: state.isSidebarOpen,
		callbacks: {
			onFixtureChange(fixtureId) {
				void switchFixture(fixtureId);
			},
			onIsolationChange(isolation) {
				state.isolationMode = isolation;
				persistCurrentState();
				void executePipeline();
			},
			onAutoRenderChange(autoRender) {
				state.autoRender = autoRender;
				persistCurrentState();
			},
			onRenderClick() {
				void executePipeline();
			},
			onClearClick() {
				renderService.clear();
				viewportComponent.setCleared();
			},
			onToggleSidebar() {
				toggleSidebar();
			},
			onToggleTheme() {
				toggleTheme();
			},
		},
	});
	headerSlot.appendChild(headerComponent.element);

	// Core rendering pipeline
	async function executePipeline(): Promise<void> {
		if (state.isRendering) return;

		state.isRendering = true;
		state.error = null;
		headerComponent.setRendering(true);
		viewportComponent.setRendering();

		try {
			// 1. Parse dynamic data
			const dataResult = parseJsonData(state.dataJsonContent);
			if (dataResult.error) {
				throw new Error(`Data Error: ${dataResult.error}`);
			}

			// 2. Compile Eta/EJS template
			const compileResult = compileTemplate(state.templateContent, dataResult.data);
			if (compileResult.error) {
				throw new Error(compileResult.error);
			}

			state.compiledHtml = compileResult.html;

			// 3. Render through Printedjs BrowserRenderer
			const renderStats: RenderStats = await renderService.executeRender({
				compiledHtml: compileResult.html,
				isolation: state.isolationMode,
				viewMode: state.viewMode,
				compileDurationMs: compileResult.durationMs,
				showOverlay: state.showDevtoolsOverlay,
				onIframeReady: (iframe) => {
					viewportComponent.adjustIframe(iframe);
				},
			});

			state.stats = renderStats;
			viewportComponent.updatePageStats(renderStats.pageCount);
			viewportComponent.setSuccess(renderStats);
			viewportComponent.adjustIframe();
			if (state.viewMode === "spread") {
				viewportComponent.fitToView();
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			state.error = message;
			viewportComponent.setError(message);
		} finally {
			state.isRendering = false;
			headerComponent.setRendering(false);
		}
	}

	async function switchFixture(fixtureId: string): Promise<void> {
		const match = FIXTURE_CATALOG.find((f) => f.id === fixtureId);
		if (!match) return;

		state.currentFixture = match;
		state.templateContent = match.html;
		state.dataJsonContent = JSON.stringify(match.data ?? {}, null, 2);
		persistCurrentState();

		headerComponent.setFixture(match.id);
		editorPanelComponent.setFixture(match, state.templateContent, state.dataJsonContent);

		await executePipeline();
		if (state.viewMode === "spread") {
			viewportComponent.fitToView();
		}
	}

	// Global Keyboard Shortcuts
	const keydownHandler = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault();
			void executePipeline();
		} else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			void executePipeline();
		} else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
			e.preventDefault();
			toggleSidebar();
		}
	};
	window.addEventListener("keydown", keydownHandler);

	// Perform initial render
	void executePipeline();

	return {
		get currentFixture() {
			return state.currentFixture;
		},
		render: executePipeline,
		destroy() {
			window.removeEventListener("keydown", keydownHandler);
			window.removeEventListener("resize", resizeHandler);
			if (debounceTimer) clearTimeout(debounceTimer);
			editorPanelComponent.destroy();
			renderService.destroy();
			rootElement.innerHTML = "";
		},
		getState() {
			return { ...state };
		},
		setFixture: switchFixture,
	};
}

export type { PlaygroundApp, PlaygroundFixture, PlaygroundState, RenderStats };
