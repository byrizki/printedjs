import { monaco } from "../services/monaco-setup.js";
import { formatJsonString, parseJsonData } from "../services/template-service.js";
import type { EditorTabId } from "../types/editor.js";
import type { PlaygroundFixture } from "../types/playground.js";

export interface EditorPanelCallbacks {
	readonly onTemplateChange: (template: string) => void;
	readonly onDataChange: (dataJson: string) => void;
	readonly onResetFixture: () => void;
	readonly onToggleSidebar?: () => void;
}

export interface EditorPanelOptions {
	readonly initialFixture: PlaygroundFixture;
	readonly initialTemplate: string;
	readonly initialDataJson: string;
	readonly initialCompiledHtml: string;
	readonly callbacks: EditorPanelCallbacks;
}

export class EditorPanelComponent {
	readonly element: HTMLElement;
	private activeTab: EditorTabId = "template";
	private readonly fixtureTitleEl: HTMLElement;
	private readonly fixtureDescEl: HTMLElement;
	private readonly jsonStatusBadge: HTMLElement;
	private readonly jsonErrorBanner: HTMLElement;
	private readonly templateStatsEl: HTMLElement;
	private readonly wrapLabelEl: HTMLElement;
	private readonly helpersModalEl: HTMLElement;

	private readonly templateModel: monaco.editor.ITextModel;
	private readonly dataModel: monaco.editor.ITextModel;

	private readonly templateEditor: monaco.editor.IStandaloneCodeEditor;
	private readonly dataEditor: monaco.editor.IStandaloneCodeEditor;

	private readonly resizeObserver: ResizeObserver;

	private isUpdatingInternalValue = false;
	private isWordWrap = false;
	private isCollapsed = false;

	constructor(options: EditorPanelOptions) {
		const { initialFixture, initialTemplate, initialDataJson, callbacks } = options;

		this.element = document.createElement("aside");
		this.element.className = "pm-sidebar";

		this.element.innerHTML = `
			<div class="pm-fixture-meta">
				<div class="pm-fixture-meta-header">
					<h2 class="pm-fixture-meta-title" id="pm-fixture-title">${initialFixture.title}</h2>
				</div>
				<p class="pm-fixture-desc" id="pm-fixture-desc">${initialFixture.description}</p>
			</div>

			<div class="pm-tabs-bar">
				<button class="pm-tab-btn active" data-tab="template">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 18 22 12 16 6"></polyline>
						<polyline points="8 6 2 12 8 18"></polyline>
					</svg>
					<span>Template</span>
				</button>
				<button class="pm-tab-btn" data-tab="data">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
						<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
						<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
					</svg>
					<span>Data (JSON)</span>
				</button>
			</div>

			<!-- Template Tab Pane -->
			<div class="pm-tab-pane active" data-pane="template">
				<div class="pm-editor-toolbar">
					<div class="pm-toolbar-actions">
						<button id="pm-format-template-btn" class="pm-btn pm-btn-secondary" title="Beautify / Format HTML Template">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
							</svg>
							<span>Format</span>
						</button>
						<button id="pm-wrap-toggle-btn" class="pm-btn pm-btn-secondary" title="Toggle Line Wrap">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="9 10 4 15 9 20"/>
								<path d="M20 4v7a4 4 0 0 1-4 4H4"/>
							</svg>
							<span id="pm-wrap-label">Wrap</span>
						</button>
						<button id="pm-reset-template-btn" class="pm-btn pm-btn-secondary" title="Reset Current Fixture">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/>
								<path d="M3 3v5h5"/>
							</svg>
							<span>Reset</span>
						</button>
					</div>
					<button id="pm-open-helpers-btn" class="pm-btn pm-btn-primary" title="Open Template Helpers &amp; Reference Modal">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
							<line x1="12" y1="17" x2="12.01" y2="17"/>
						</svg>
						<span>Helpers &amp; Tools</span>
					</button>
				</div>
				<div class="pm-code-container">
					<div id="pm-template-monaco-host" class="pm-monaco-host"></div>
				</div>
			</div>

			<!-- Dynamic Data Tab Pane -->
			<div class="pm-tab-pane" data-pane="data">
				<div class="pm-editor-toolbar">
					<div id="pm-json-status" class="pm-validation-badge valid">✓ Valid JSON</div>
					<div class="pm-toolbar-actions">
						<button id="pm-format-json-btn" class="pm-btn pm-btn-secondary" title="Beautify / Format JSON Data">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
							</svg>
							<span>Format JSON</span>
						</button>
						<button id="pm-reset-json-btn" class="pm-btn pm-btn-secondary" title="Reset to Fixture Data">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/>
								<path d="M3 3v5h5"/>
							</svg>
							<span>Reset</span>
						</button>
					</div>
				</div>
				<div id="pm-json-error" class="pm-error-banner" style="display: none;"></div>
				<div class="pm-code-container">
					<div id="pm-data-monaco-host" class="pm-monaco-host"></div>
				</div>
			</div>

			<div class="pm-sidebar-footer">
				<span id="pm-template-stats">0 characters</span>
			</div>

			<!-- Helpers & Tools Modal Dialog -->
			<div class="pm-modal-backdrop" id="pm-helpers-modal" style="display: none;">
				<div class="pm-modal-dialog">
					<div class="pm-modal-header">
						<div class="pm-modal-title">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10"/>
								<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
								<line x1="12" y1="17" x2="12.01" y2="17"/>
							</svg>
							<span>Eta / EJS Template Reference &amp; Helper Tools</span>
						</div>
						<button class="pm-btn pm-btn-secondary pm-btn-icon pm-modal-close" id="pm-close-helpers-btn" title="Close (Esc)">✕</button>
					</div>
					<div class="pm-modal-body">
						<div class="pm-docs-section">
							<div class="pm-docs-title">Syntax Reference</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">&lt;%= expression %&gt;</div>
								<div class="pm-helper-desc">Evaluates expression and escapes output for safe HTML insertion. Example: <code>&lt;%= title %&gt;</code> or <code>&lt;%= it.title %&gt;</code></div>
							</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">&lt;%- rawHtml %&gt;</div>
								<div class="pm-helper-desc">Outputs raw, unescaped HTML directly into the document structure.</div>
							</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">&lt;% javascriptCode %&gt;</div>
								<div class="pm-helper-desc">Executes arbitrary JavaScript logic, loops, conditionals, and variables. JSON context is accessible directly (<code>fieldName</code>), via <code>it.fieldName</code>, or via <code>locals.fieldName</code>.</div>
							</div>
						</div>

						<div class="pm-docs-section">
							<div class="pm-docs-title">Built-in Formatters &amp; Helpers</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">currency(amount, currencyCode = 'USD' | 'IDR')</div>
								<div class="pm-helper-desc">Formats currency amounts (e.g. <code>$1,450.00</code>, <code>Rp 2.500.000</code>).</div>
							</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">dayjs(dateString).format(pattern)</div>
								<div class="pm-helper-desc">Date formatting and manipulation (e.g. <code>dayjs(date).format('MMM DD, YYYY')</code>).</div>
							</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">format(number)</div>
								<div class="pm-helper-desc">Numeral delimiter and number formatting.</div>
							</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">sum(array, 'key')</div>
								<div class="pm-helper-desc">Sums numerical values across an array of objects or numbers.</div>
							</div>
							<div class="pm-helper-card">
								<div class="pm-helper-signature">uppercase(text) / lowercase(text)</div>
								<div class="pm-helper-desc">String casing transformations.</div>
							</div>
						</div>

						<div class="pm-docs-section">
							<div class="pm-docs-title">Quick Snippet Insertion</div>
							<div class="pm-snippet-actions">
								<button class="pm-snippet-btn" data-insert="interpolate">Insert &lt;%= variable %&gt;</button>
								<button class="pm-snippet-btn" data-insert="raw">Insert &lt;%- rawHtml %&gt;</button>
								<button class="pm-snippet-btn" data-insert="loop">Insert &lt;% items.forEach(...) %&gt;</button>
								<button class="pm-snippet-btn" data-insert="if">Insert &lt;% if (condition) %&gt;</button>
								<button class="pm-snippet-btn" data-insert="getbypath">Insert getByPath() Helper</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		this.fixtureTitleEl = this.element.querySelector<HTMLElement>("#pm-fixture-title")!;
		this.fixtureDescEl = this.element.querySelector<HTMLElement>("#pm-fixture-desc")!;
		this.jsonStatusBadge = this.element.querySelector<HTMLElement>("#pm-json-status")!;
		this.jsonErrorBanner = this.element.querySelector<HTMLElement>("#pm-json-error")!;
		this.templateStatsEl = this.element.querySelector<HTMLElement>("#pm-template-stats")!;
		this.wrapLabelEl = this.element.querySelector<HTMLElement>("#pm-wrap-label")!;
		this.helpersModalEl = this.element.querySelector<HTMLElement>("#pm-helpers-modal")!;

		const templateHostEl = this.element.querySelector<HTMLElement>(
			"#pm-template-monaco-host",
		)!;

		const dataHostEl = this.element.querySelector<HTMLElement>("#pm-data-monaco-host")!;

		// Initialize Monaco Models
		const templateUri = monaco.Uri.parse("inmemory://printedjs/template.html");
		const dataUri = monaco.Uri.parse("inmemory://printedjs/data.json");

		this.templateModel = monaco.editor.createModel(initialTemplate, "html", templateUri);
		this.dataModel = monaco.editor.createModel(initialDataJson, "json", dataUri);

		// Shared editor configuration
		const sharedOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
			theme:
				document.documentElement.getAttribute("data-theme") === "light"
					? "vs"
					: "vs-dark",
			automaticLayout: true,
			fontSize: 12,
			fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			wordWrap: "off",
			tabSize: 2,
			lineNumbers: "on",
			lineNumbersMinChars: 3,
			renderWhitespace: "selection",
			renderLineHighlight: "all",
			scrollbar: {
				verticalScrollbarSize: 8,
				horizontalScrollbarSize: 8,
			},
		};

		// Create Monaco Editors
		this.templateEditor = monaco.editor.create(templateHostEl, {
			...sharedOptions,
			model: this.templateModel,
		});

		this.dataEditor = monaco.editor.create(dataHostEl, {
			...sharedOptions,
			model: this.dataModel,
		});

		this.updateStats();
		this.validateJson(initialDataJson);

		this.resizeObserver = new ResizeObserver(() => {
			this.layout();
		});
		this.resizeObserver.observe(this.element);

		requestAnimationFrame(() => {
			this.layout();
		});
		setTimeout(() => {
			this.layout();
		}, 80);

		// Tab switching
		const tabButtons = this.element.querySelectorAll<HTMLButtonElement>(".pm-tab-btn");
		const panes = this.element.querySelectorAll<HTMLElement>(".pm-tab-pane");

		tabButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				// SAFETY: data-tab attribute matches defined EditorTabId domain values
				const tabId = btn.getAttribute("data-tab") as EditorTabId;

				if (!tabId) return;
				this.activeTab = tabId;

				tabButtons.forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");

				panes.forEach((p) => {
					if (p.getAttribute("data-pane") === tabId) {
						p.classList.add("active");
					} else {
						p.classList.remove("active");
					}
				});

				this.layout();
				requestAnimationFrame(() => {
					this.layout();
				});
			});
		});

		// Listen to template edits
		this.templateModel.onDidChangeContent(() => {
			if (this.isUpdatingInternalValue) return;
			this.updateStats();
			callbacks.onTemplateChange(this.templateModel.getValue());
		});

		// Listen to data edits
		this.dataModel.onDidChangeContent(() => {
			if (this.isUpdatingInternalValue) return;
			const val = this.dataModel.getValue();
			this.validateJson(val);
			callbacks.onDataChange(val);
		});

		// Listen to Monaco diagnostic markers (built-in linting)
		monaco.editor.onDidChangeMarkers((uris) => {
			const affectsData = uris.some((u) => u.toString() === dataUri.toString());

			if (affectsData) {
				this.updateDataMarkers();
			}
		});

		// Format Template button
		const formatTemplateBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-format-template-btn",
		)!;

		formatTemplateBtn.addEventListener("click", () => {
			void this.templateEditor.getAction("editor.action.formatDocument")?.run();
		});

		// Toggle Line Wrap
		const wrapToggleBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-wrap-toggle-btn")!;

		wrapToggleBtn.addEventListener("click", () => {
			this.isWordWrap = !this.isWordWrap;
			const wrapMode = this.isWordWrap ? "on" : "off";
			this.templateEditor.updateOptions({ wordWrap: wrapMode });
			this.dataEditor.updateOptions({ wordWrap: wrapMode });
			this.wrapLabelEl.textContent = this.isWordWrap ? "Unwrap" : "Wrap";
		});

		// Format JSON button
		const formatJsonBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-format-json-btn")!;

		formatJsonBtn.addEventListener("click", () => {
			const currentVal = this.dataModel.getValue();
			const formatted = formatJsonString(currentVal);

			if (!formatted.error) {
				this.dataModel.setValue(formatted.formatted);
				this.validateJson(formatted.formatted);
				callbacks.onDataChange(formatted.formatted);
			} else {
				void this.dataEditor.getAction("editor.action.formatDocument")?.run();
			}
		});

		// Reset buttons
		const resetTemplateBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-reset-template-btn",
		)!;

		const resetJsonBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-reset-json-btn")!;

		resetTemplateBtn.addEventListener("click", () => callbacks.onResetFixture());
		resetJsonBtn.addEventListener("click", () => callbacks.onResetFixture());

		// Collapse button
		const collapseBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-collapse-sidebar-btn",
		);

		collapseBtn?.addEventListener("click", () => {
			callbacks.onToggleSidebar?.();
		});

		// Helpers Modal
		const openHelpersBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-open-helpers-btn")!;

		const closeHelpersBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-close-helpers-btn",
		)!;

		openHelpersBtn.addEventListener("click", () => {
			this.helpersModalEl.style.display = "flex";
		});

		const closeModal = () => {
			this.helpersModalEl.style.display = "none";
		};

		closeHelpersBtn.addEventListener("click", closeModal);
		this.helpersModalEl.addEventListener("click", (e) => {
			if (e.target === this.helpersModalEl) {
				closeModal();
			}
		});

		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.helpersModalEl.style.display === "flex") {
				closeModal();
			}
		});

		// Snippet action buttons inside modal
		const snippetActionButtons =
			this.helpersModalEl.querySelectorAll<HTMLButtonElement>("[data-insert]");

		snippetActionButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				const type = btn.getAttribute("data-insert");
				let snippet = "";

				if (type === "interpolate") snippet = "<%= variable %>";

				if (type === "raw") snippet = "<%- rawHtml %>";

				if (type === "loop")
					snippet = "<% items.forEach(function(item) { %>\n\t\n<% }); %>";

				if (type === "if") snippet = "<% if (condition) { %>\n\t\n<% } %>";

				if (type === "getbypath")
					snippet = `function getByPath(path, defaultValue = "", source = it) {
  const parts = path.split(".");
  let res = source;
  parts.map(x => x.replace("[", "").replace("]", "")).forEach((p) => {
    if (res === null || res === undefined) return;
    res = res[p];
  });
  return res ?? defaultValue;
}`;

				this.insertSnippet(snippet);
				closeModal();
			});
		});
	}

	setCollapsed(collapsed: boolean): void {
		this.isCollapsed = collapsed;
		this.element.classList.toggle("collapsed", collapsed);

		if (!collapsed) {
			setTimeout(() => {
				this.layout();
			}, 100);
		}
	}

	private insertSnippet(snippet: string): void {
		const selection = this.templateEditor.getSelection();

		if (selection) {
			this.templateEditor.executeEdits("snippet", [
				{ range: selection, text: snippet, forceMoveMarkers: true },
			]);
			this.templateEditor.focus();
		}
	}

	private updateStats(): void {
		const len = this.templateModel.getValueLength();
		this.templateStatsEl.textContent = `${len.toLocaleString()} characters`;
	}

	private updateDataMarkers(): void {
		const markers = monaco.editor.getModelMarkers({ resource: this.dataModel.uri });
		const errorMarker = markers.find((m) => m.severity === monaco.MarkerSeverity.Error);

		if (errorMarker) {
			this.jsonStatusBadge.className = "pm-validation-badge invalid";
			this.jsonStatusBadge.textContent = "✗ Invalid JSON";
			this.jsonErrorBanner.style.display = "flex";
			this.jsonErrorBanner.textContent = `Line ${errorMarker.startLineNumber}, Col ${errorMarker.startColumn}: ${errorMarker.message}`;
		} else {
			this.validateJson(this.dataModel.getValue());
		}
	}

	private validateJson(jsonStr: string): void {
		const result = parseJsonData(jsonStr);

		if (result.error) {
			this.jsonStatusBadge.className = "pm-validation-badge invalid";
			this.jsonStatusBadge.textContent = "✗ Invalid JSON";
			this.jsonErrorBanner.style.display = "flex";
			this.jsonErrorBanner.textContent = result.error;
		} else {
			this.jsonStatusBadge.className = "pm-validation-badge valid";
			this.jsonStatusBadge.textContent = "✓ Valid JSON";
			this.jsonErrorBanner.style.display = "none";
			this.jsonErrorBanner.textContent = "";
		}
	}

	setFixture(fixture: PlaygroundFixture, template: string, dataJson: string): void {
		this.isUpdatingInternalValue = true;
		this.fixtureTitleEl.textContent = fixture.title;
		this.fixtureDescEl.textContent = fixture.description;

		this.templateModel.setValue(template);
		this.dataModel.setValue(dataJson);

		this.updateStats();
		this.validateJson(dataJson);
		this.isUpdatingInternalValue = false;
	}

	getTemplateValue(): string {
		return this.templateModel.getValue();
	}

	getDataJsonValue(): string {
		return this.dataModel.getValue();
	}

	layout(): void {
		if (this.isCollapsed) return;

		if (this.activeTab === "template") {
			this.templateEditor.layout();
		} else if (this.activeTab === "data") {
			this.dataEditor.layout();
		}
	}

	destroy(): void {
		this.resizeObserver.disconnect();
		this.templateEditor.dispose();
		this.dataEditor.dispose();
		this.templateModel.dispose();
		this.dataModel.dispose();
	}
}
