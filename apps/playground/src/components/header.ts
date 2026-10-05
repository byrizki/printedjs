import type { PlaygroundFixture } from "../types/playground.js";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

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
	private readonly fixtures: readonly PlaygroundFixture[];
	private readonly callbacks: HeaderCallbacks;
	private currentFixtureId: string;
	private filteredFixtures: PlaygroundFixture[] = [];
	private activeIndex: number = -1;
	private isDropdownOpen: boolean = false;

	private readonly fixtureSelect: HTMLSelectElement;
	private readonly presetCombobox: HTMLElement;
	private readonly presetTriggerBtn: HTMLButtonElement;
	private readonly presetTriggerLabel: HTMLElement;
	private readonly presetDropdown: HTMLElement;
	private readonly presetSearchInput: HTMLInputElement;
	private readonly presetSearchClear: HTMLButtonElement;
	private readonly presetList: HTMLElement;

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

		this.fixtures = fixtures;
		this.callbacks = callbacks;
		this.currentFixtureId = initialFixtureId;
		this.currentTheme = initialTheme;
		this.element = document.createElement("header");
		this.element.className = "pm-header";

		const initialFixture = fixtures.find((f) => f.id === initialFixtureId);
		const initialTitle = initialFixture?.title ?? initialFixtureId;

		// Categorize fixtures
		const templateFixtures = fixtures.filter((f) => f.category === "templates");
		const pagedMediaFixtures = fixtures.filter((f) => f.category === "paged-media");
		const testFixtures = fixtures.filter((f) => f.category === "test-fixtures");

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
				<div class="pm-control-group pm-preset-combobox-wrapper">
					<label for="pm-preset-trigger-btn">Preset:</label>
					<select id="pm-fixture-select" class="pm-select pm-visually-hidden" tabindex="-1" aria-hidden="true">
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
						<optgroup label="Test Fixtures">
							${testFixtures
								.map(
									(f) =>
										`<option value="${f.id}" ${f.id === initialFixtureId ? "selected" : ""}>${f.title}</option>`,
								)
								.join("")}
						</optgroup>
					</select>

					<div class="pm-preset-combobox" id="pm-preset-combobox">
						<button
							type="button"
							id="pm-preset-trigger-btn"
							class="pm-preset-trigger-btn"
							aria-haspopup="listbox"
							aria-expanded="false"
							title="Choose or search presets"
						>
							<span class="pm-preset-trigger-label" id="pm-preset-trigger-label">${escapeHtml(initialTitle)}</span>
							<svg class="pm-preset-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						</button>

						<div class="pm-preset-dropdown" id="pm-preset-dropdown" style="display: none;">
							<div class="pm-preset-search-box">
								<svg class="pm-preset-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="11" cy="11" r="8"></circle>
									<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
								</svg>
								<input
									type="text"
									id="pm-preset-search-input"
									class="pm-preset-search-input"
									placeholder="Search presets..."
									autocomplete="off"
									spellcheck="false"
								/>
								<button type="button" id="pm-preset-search-clear" class="pm-preset-search-clear" title="Clear search" style="display: none;">
									&times;
								</button>
							</div>
							<div class="pm-preset-list" id="pm-preset-list" role="listbox"></div>
						</div>
					</div>
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
		this.presetCombobox = this.element.querySelector<HTMLElement>("#pm-preset-combobox")!;
		this.presetTriggerBtn = this.element.querySelector<HTMLButtonElement>(
			"#pm-preset-trigger-btn",
		)!;
		this.presetTriggerLabel = this.element.querySelector<HTMLElement>(
			"#pm-preset-trigger-label",
		)!;
		this.presetDropdown = this.element.querySelector<HTMLElement>("#pm-preset-dropdown")!;
		this.presetSearchInput = this.element.querySelector<HTMLInputElement>(
			"#pm-preset-search-input",
		)!;
		this.presetSearchClear = this.element.querySelector<HTMLButtonElement>(
			"#pm-preset-search-clear",
		)!;
		this.presetList = this.element.querySelector<HTMLElement>("#pm-preset-list")!;

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

		this.presetTriggerBtn.addEventListener("click", () => {
			this.toggleDropdown();
		});

		this.presetSearchInput.addEventListener("input", () => {
			const query = this.presetSearchInput.value;
			this.presetSearchClear.style.display = query ? "block" : "none";
			this.filterFixtures(query);
		});

		this.presetSearchClear.addEventListener("click", () => {
			this.presetSearchInput.value = "";
			this.presetSearchClear.style.display = "none";
			this.filterFixtures("");
			this.presetSearchInput.focus();
		});

		this.presetSearchInput.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				this.setActiveIndex(this.activeIndex + 1);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				this.setActiveIndex(this.activeIndex - 1);
			} else if (e.key === "Enter") {
				e.preventDefault();
				const selectedItem = this.filteredFixtures[this.activeIndex];

				if (selectedItem) {
					this.selectFixture(selectedItem.id);
				}
			} else if (e.key === "Escape") {
				e.preventDefault();
				this.closeDropdown();
				this.presetTriggerBtn.focus();
			}
		});

		this.presetList.addEventListener("click", (e: MouseEvent) => {
			const item =
				e.target instanceof Element
					? e.target.closest<HTMLElement>(".pm-preset-item")
					: null;

			if (item) {
				const fixtureId = item.getAttribute("data-fixture-id");

				if (fixtureId) {
					this.selectFixture(fixtureId);
				}
			}
		});

		if ("window" in globalThis) {
			window.addEventListener("click", (e: MouseEvent) => {
				if (
					this.isDropdownOpen &&
					e.target instanceof Node &&
					!this.presetCombobox.contains(e.target)
				) {
					this.closeDropdown();
				}
			});
		}

		this.fixtureSelect.addEventListener("change", () => {
			this.setFixture(this.fixtureSelect.value);
			callbacks.onFixtureChange(this.fixtureSelect.value);
		});

		this.isolationSelect.addEventListener("change", () => {
			const isolation: "root" | "iframe" =
				this.isolationSelect.value === "iframe" ? "iframe" : "root";

			callbacks.onIsolationChange(isolation);
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

	private toggleDropdown(): void {
		if (this.isDropdownOpen) {
			this.closeDropdown();
		} else {
			this.openDropdown();
		}
	}

	private openDropdown(): void {
		this.isDropdownOpen = true;
		this.presetCombobox.classList.add("open");
		this.presetDropdown.style.display = "flex";
		this.presetTriggerBtn.setAttribute("aria-expanded", "true");
		this.presetSearchInput.value = "";
		this.presetSearchClear.style.display = "none";
		this.filterFixtures("");

		const selectedIndex = this.filteredFixtures.findIndex(
			(f) => f.id === this.currentFixtureId,
		);

		this.setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
		setTimeout(() => this.presetSearchInput.focus(), 20);
	}

	private closeDropdown(): void {
		this.isDropdownOpen = false;
		this.presetCombobox.classList.remove("open");
		this.presetDropdown.style.display = "none";
		this.presetTriggerBtn.setAttribute("aria-expanded", "false");
	}

	private filterFixtures(query: string): void {
		const q = query.trim().toLowerCase();

		if (!q) {
			this.filteredFixtures = [...this.fixtures];
		} else {
			this.filteredFixtures = this.fixtures.filter(
				(f) =>
					f.title.toLowerCase().includes(q) ||
					f.id.toLowerCase().includes(q) ||
					f.category.toLowerCase().includes(q),
			);
		}

		this.activeIndex = this.filteredFixtures.length > 0 ? 0 : -1;
		this.renderDropdownList();
	}

	private renderDropdownList(): void {
		if (this.filteredFixtures.length === 0) {
			this.presetList.innerHTML = `<div class="pm-preset-empty">No presets found matching your search.</div>`;

			return;
		}

		const categories: Array<{ id: string; label: string }> = [
			{ id: "templates", label: "Templates & Dynamic Data" },
			{ id: "paged-media", label: "CSS Paged Media" },
			{ id: "test-fixtures", label: "Test Fixtures" },
		];

		let html = "";

		for (const cat of categories) {
			const items = this.filteredFixtures.filter((f) => f.category === cat.id);

			if (items.length === 0) continue;

			html += `<div class="pm-preset-group-header">${escapeHtml(cat.label)}</div>`;

			for (const f of items) {
				const globalIdx = this.filteredFixtures.indexOf(f);
				const isSelected = f.id === this.currentFixtureId;
				const isActive = globalIdx === this.activeIndex;

				html += `
					<div
						class="pm-preset-item ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}"
						data-fixture-id="${f.id}"
						data-index="${globalIdx}"
						role="option"
						aria-selected="${isSelected}"
					>
						<span class="pm-preset-item-title">${escapeHtml(f.title)}</span>
					</div>
				`;
			}
		}

		this.presetList.innerHTML = html;
	}

	private setActiveIndex(index: number): void {
		if (this.filteredFixtures.length === 0) {
			this.activeIndex = -1;

			return;
		}

		this.activeIndex = Math.max(0, Math.min(index, this.filteredFixtures.length - 1));

		const items = this.presetList.querySelectorAll<HTMLElement>(".pm-preset-item");
		items.forEach((item) => {
			const idx = parseInt(item.getAttribute("data-index") ?? "-1", 10);
			const isActive = idx === this.activeIndex;
			item.classList.toggle("active", isActive);

			if (isActive) {
				item.scrollIntoView({ block: "nearest" });
			}
		});
	}

	private selectFixture(fixtureId: string): void {
		this.setFixture(fixtureId);
		this.callbacks.onFixtureChange(fixtureId);
		this.closeDropdown();
		this.presetTriggerBtn.focus();
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
			return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
			</svg>`;
		}

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
		this.currentFixtureId = fixtureId;
		this.fixtureSelect.value = fixtureId;
		const fixture = this.fixtures.find((f) => f.id === fixtureId);

		if (fixture && this.presetTriggerLabel) {
			this.presetTriggerLabel.textContent = fixture.title;
		}
	}
}
