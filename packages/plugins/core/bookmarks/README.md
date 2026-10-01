# @printedjs/plugin-bookmarks

Document outline and interactive table-of-contents navigation drawer plugin for Printedjs.

Extracts hierarchical heading structures (`h1` through `h6` and `[data-bookmark-level]`) across paginated pages and provides a slide-out navigation drawer.

---

## Features

- **Automatic Hierarchy Extraction** — Scans laid-out document pages and builds nested tree structures based on heading levels.
- **Custom Bookmark Levels** — Supports explicit outline depths via `data-bookmark-level="1"` attributes.
- **Slide-Out Navigation Drawer (`createBookmarksDrawer`)** — Accessible, keyboard-navigable UI with search filter, active page highlighting, and smooth page scrolling.
- **Zero Print Footprint** — Injected drawer and backdrop styles are suppressed automatically under `@media print`.

---

## Installation

```bash
pnpm add @printedjs/plugin-bookmarks @printedjs/core
```

---

## Usage

### Register Plugin

```typescript
import { createRenderer } from "@printedjs/browser";
import { bookmarksPlugin } from "@printedjs/plugin-bookmarks";

const renderer = createRenderer({
	target: document.querySelector("#preview")!,
	plugins: [bookmarksPlugin()],
});

const result = await renderer.render({
	content: {
		html: `
      <h1>Executive Summary</h1>
      <p>Introductory notes...</p>
      <h2>Financial Performance</h2>
      <p>Details...</p>
    `,
	},
});
```

### Create Navigation Drawer

```typescript
import { createBookmarksDrawer, type BookmarkItem } from "@printedjs/plugin-bookmarks";

const bookmarks: BookmarkItem[] = [
	{
		title: "Executive Summary",
		level: 1,
		pageNumber: 1,
		children: [
			{
				title: "Financial Performance",
				level: 2,
				pageNumber: 2,
				children: [],
			},
		],
	},
];

const drawer = createBookmarksDrawer(bookmarks, {
	position: "left",
	title: "Document Outline",
	onNavigate: (pageNumber, targetId) => {
		console.log(`Navigate to page ${pageNumber}, target #${targetId}`);
	},
});

drawer.open();
```

---

## API

- **`bookmarksPlugin(): PrintedjsPlugin`** — Lifecycle plugin registering outline metadata in session context.
- **`createBookmarksDrawer(bookmarks, options?): BookmarksDrawerController`** — Instantiates DOM navigation drawer.
- **`BookmarkItem`** — Represents a node in the heading tree (`title`, `level`, `pageNumber`, `targetId`, `children`).
