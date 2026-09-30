import type { PlaygroundFixture } from "../types/playground.js";

export interface HeaderCallbacks {
	readonly onFixtureChange: (fixtureId: string) => void;
	readonly onIsolationChange: (isolation: "root" | "iframe") => void;
	readonly onAutoRenderChange: (autoRender: boolean) => void;
	readonly onRenderClick: () => void;
	readonly onClearClick: () => void;
	readonly onToggleSidebar?: () => void;
	readonly onToggleTheme?: () => void;
}

export interface HeaderOptions {
	readonly fixtures: readonly PlaygroundFixture[];
	readonly initialFixtureId: string;
	readonly initialIsolation: "root" | "iframe";
	readonly initialAutoRender: boolean;
	readonly initialTheme: "light" | "dark";
	readonly isSidebarOpen: boolean;
	readonly callbacks: HeaderCallbacks;
}

export class HeaderComponent {
	readonly element: HTMLElement;
	private readonly fixtureSelect: HTMLSelectElement;
	private readonly isolationSelect: HTMLSelectElement;
	private readonly autoRenderCheckbox: HTMLInputElement;
	private readonly renderBtn: HTMLButtonElement;
	private readonly themeToggleBtn: HTMLButtonElement;
	private currentTheme: "light" | "dark";

	constructor(options: HeaderOptions) {
		const {
			fixtures,
			initialFixtureId,
			initialIsolation,
			initialAutoRender,
			initialTheme,
			isSidebarOpen,
			callbacks,
		} = options;

		this.currentTheme = initialTheme;
		this.element = document.createElement("header");
		this.element.className = "pm-header";

		// Categorize fixtures
		const templateFixtures = fixtures.filter((f) => f.category === "templates");
		const pagedMediaFixtures = fixtures.filter((f) => f.category === "paged-media");

		this.element.innerHTML = `
			<div class="pm-header-brand">
				<button id="pm-sidebar-toggle-btn" class="pm-btn pm-btn-secondary pm-btn-icon" title="Toggle Sidebar (Ctrl+B)">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="9" y1="3" x2="9" y2="21"></line>
					</svg>
				</button>
				<div class="pm-brand-icon">P</div>
				<h1 class="pm-brand-title">
					Printedjs Playground
					<span class="pm-version-badge">v0.0.0</span>
					<span class="pm-tag-badge">Eta / EJS</span>
				</h1>
			</div>

			<div class="pm-header-controls">
				<div class="pm-control-group">
					<label for="pm-fixture-select">Preset:</label>
					<select id="pm-fixture-select" class="pm-select">
						<optgroup label="Templates &amp; Dynamic Data">
							${templateFixtures
								.map(
									(f) =>
										`<option value="${f.id}" ${f.id === initialFixtureId ? "selected" : ""}>${f.title}</option>`,
								)
								.join("")}
						</optgroup>
						<optgroup label="CSS Paged Media">
							${pagedMediaFixtures
								.map(
									(f) =>
										`<option value="${f.id}" ${f.id === initialFixtureId ? "selected" : ""}>${f.title}</option>`,
								)
								.join("")}
						</optgroup>
					</select>
				</div>

				<div class="pm-control-group">
					<label for="pm-isolation-select">Isolation:</label>
					<select id="pm-isolation-select" class="pm-select">
						<option value="root" ${initialIsolation === "root" ? "selected" : ""}>Root Surface</option>
						<option value="iframe" ${initialIsolation === "iframe" ? "selected" : ""}>Iframe Surface</option>
					</select>
				</div>

				<label class="pm-toggle-label">
					<input type="checkbox" id="pm-auto-render" class="pm-toggle-input" ${initialAutoRender ? "checked" : ""} />
					<span>Auto-render</span>
				</label>

				<button id="pm-render-btn" class="pm-btn pm-btn-primary" title="Render Document (Cmd+Enter / Ctrl+Enter)">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="5 3 19 12 5 21 5 3"></polygon>
					</svg>
					<span>Render</span>
				</button>

				<button id="pm-theme-toggle-btn" class="pm-btn pm-btn-secondary pm-btn-icon" title="Toggle Light/Dark Theme">
					${this.getThemeIcon(initialTheme)}
				</button>

				<button id="pm-clear-btn" class="pm-btn pm-btn-secondary pm-btn-icon" title="Clear Viewport">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
					</svg>
				</button>
			</div>
		`;

		this.fixtureSelect =
			this.element.querySelector<HTMLSelectElement>("#pm-fixture-select")!;
		this.isolationSelect =
			this.element.querySelector<HTMLSelectElement>("#pm-isolation-select")!;
		this.autoRenderCheckbox =
			this.element.querySelector<HTMLInputElement>("#pm-auto-render")!;
		this.renderBtn = this.element.querySelector<HTMLButtonElement>("#pm-render-btn")!;
		this.themeToggleBtn =
			this.element.querySelector<HTMLButtonElement>("#pm-theme-toggle-btn")!;
		const sidebarToggleBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-sidebar-toggle-btn",
		)!;
		const clearBtn = this.element.querySelector<HTMLButtonElement>("#pm-clear-btn")!;

		this.fixtureSelect.addEventListener("change", () => {
			callbacks.onFixtureChange(this.fixtureSelect.value);
		});

		this.isolationSelect.addEventListener("change", () => {
			callbacks.onIsolationChange(this.isolationSelect.value as "root" | "iframe");
		});

		this.autoRenderCheckbox.addEventListener("change", () => {
			callbacks.onAutoRenderChange(this.autoRenderCheckbox.checked);
		});

		this.renderBtn.addEventListener("click", () => {
			callbacks.onRenderClick();
		});

		sidebarToggleBtn.addEventListener("click", () => {
			callbacks.onToggleSidebar?.();
		});

		this.themeToggleBtn.addEventListener("click", () => {
			callbacks.onToggleTheme?.();
		});

		clearBtn.addEventListener("click", () => {
			callbacks.onClearClick();
		});

		sidebarToggleBtn.classList.toggle("active", isSidebarOpen);
	}

	setTheme(theme: "light" | "dark"): void {
		this.currentTheme = theme;
		this.themeToggleBtn.innerHTML = this.getThemeIcon(theme);
	}

	setSidebarOpen(isOpen: boolean): void {
		const btn = this.element.querySelector<HTMLButtonElement>("#pm-sidebar-toggle-btn");
		btn?.classList.toggle("active", isOpen);
	}

	private getThemeIcon(theme: "light" | "dark"): string {
		if (theme === "light") {
			// Moon icon when currently light (click to switch to dark)
			return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
			</svg>`;
		}
		// Sun icon when currently dark (click to switch to light)
		return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="5"></circle>
			<line x1="12" y1="1" x2="12" y2="3"></line>
			<line x1="12" y1="21" x2="12" y2="23"></line>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
			<line x1="1" y1="12" x2="3" y2="12"></line>
			<line x1="21" y1="12" x2="23" y2="12"></line>
			<line x1="4.22" y1="19.07" x2="5.64" y2="17.64"></line>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
		</svg>`;
	}

	setRendering(isRendering: boolean): void {
		if (isRendering) {
			this.renderBtn.disabled = true;
			this.renderBtn.innerHTML = `
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
					<line x1="12" y1="2" x2="12" y2="6"></line>
					<line x1="12" y1="18" x2="12" y2="22"></line>
					<line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
					<line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
					<line x1="2" y1="12" x2="6" y2="12"></line>
					<line x1="18" y1="12" x2="22" y2="12"></line>
					<line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
					<line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
				</svg>
				<span>Rendering...</span>
			`;
		} else {
			this.renderBtn.disabled = false;
			this.renderBtn.innerHTML = `
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="5 3 19 12 5 21 5 3"></polygon>
				</svg>
				<span>Render</span>
			`;
		}
	}

	setFixture(fixtureId: string): void {
		this.fixtureSelect.value = fixtureId;
	}
}
