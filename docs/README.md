# Printedjs Documentation

Welcome to the documentation for **Printedjs**, the modern browser-native paginated document rendering engine.

Printedjs is designed as a modular, high-performance, and resilient successor to legacy monolithic Paged.js. It transforms standard HTML and CSS into print-ready paginated pages with full support for CSS Paged Media specifications.

---

## Documentation Index

| Guide                                                  | Description                                                                              |
| :----------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| [Architecture Overview](./architecture.md)             | Multi-package architecture, pure core design, lifecycle pipeline, and surface isolation. |
| [Package Catalog](./packages-overview.md)              | Comprehensive catalog of all `@printedjs/*` packages, their boundaries, and exports.     |
| [Migrating from Paged.js](./migrating-from-pagedjs.md) | Guide for transitioning from legacy Paged.js, API comparisons, and compatibility shims.  |
| [Plugin Authoring Guide](./plugin-authoring.md)        | Step-by-step guide to writing custom plugins, lifecycle hooks, and ordering rules.       |
| [Headless PDF CLI](./cli.md)                           | Command-line interface and programmatic bridge for headless PDF rendering.               |
| [Release Readiness](./release-readiness.md)            | Verification pipeline, package distribution checks, and release criteria.                |
| [Project Roadmap](./roadmap.md)                        | Comprehensive milestone tracker covering completed phases and future horizons.           |
| [Implementation Plan](./roadmap-plan.md)               | Technical plan for Phase 17 (Counters), Phase 18 (View Plugins), and Future Horizons.    |

---

## Quick Navigation by Role

### Document Designers & Template Authors

- Review [Migrating from Paged.js](./migrating-from-pagedjs.md) to understand CSS margin box formatting (`@top-left`, `@bottom-right`), page counters, and break controls.
- Launch the interactive playground (`pnpm dev`) to experiment with live templates, dynamic EJS/Eta data binding, and print previews.

### Application Developers

- Consult [Architecture Overview](./architecture.md) for embedding `BrowserRenderer` inside web applications using `root` or `iframe` isolation.
- Check [Headless PDF CLI](./cli.md) for generating PDFs server-side or in CI pipelines.

### Plugin Authors

- Follow [Plugin Authoring Guide](./plugin-authoring.md) to build custom hooks for document styling, headers, watermarks, and metadata extraction.

### Core Contributors

- See [Release Readiness](./release-readiness.md) and [Project Roadmap](./roadmap.md) for testing standards, build validation, and project milestones.
