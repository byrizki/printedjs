import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	base: "./",
	resolve: {
		alias: {
			"@printedjs/browser": path.resolve(
				__dirname,
				"../../packages/browser/src/index.ts",
			),
			"@printedjs/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
			"@printedjs/devtools": path.resolve(
				__dirname,
				"../../packages/devtools/src/index.ts",
			),
			"@printedjs/plugin-eta": path.resolve(
				__dirname,
				"../../packages/plugins/community/eta/src/index.ts",
			),
			"@printedjs/plugin-page-flip": path.resolve(
				__dirname,
				"../../packages/plugins/community/page-flip/src/index.ts",
			),
			"@printedjs/plugin-bookmarks": path.resolve(
				__dirname,
				"../../packages/plugins/core/bookmarks/src/index.ts",
			),
			"@printedjs/plugin-breaks": path.resolve(
				__dirname,
				"../../packages/plugins/core/breaks/src/index.ts",
			),
			"@printedjs/plugin-columns": path.resolve(
				__dirname,
				"../../packages/plugins/core/columns/src/index.ts",
			),
			"@printedjs/plugin-counters": path.resolve(
				__dirname,
				"../../packages/plugins/core/counters/src/index.ts",
			),
			"@printedjs/plugin-footnotes": path.resolve(
				__dirname,
				"../../packages/plugins/core/footnotes/src/index.ts",
			),
			"@printedjs/plugin-generated-content": path.resolve(
				__dirname,
				"../../packages/plugins/core/generated-content/src/index.ts",
			),
			"@printedjs/plugin-hyphenation": path.resolve(
				__dirname,
				"../../packages/plugins/core/hyphenation/src/index.ts",
			),
			"@printedjs/plugin-lists": path.resolve(
				__dirname,
				"../../packages/plugins/core/lists/src/index.ts",
			),
			"@printedjs/plugin-math": path.resolve(
				__dirname,
				"../../packages/plugins/core/math/src/index.ts",
			),
			"@printedjs/plugin-page-rules": path.resolve(
				__dirname,
				"../../packages/plugins/core/page-rules/src/index.ts",
			),
			"@printedjs/plugin-preset": path.resolve(
				__dirname,
				"../../packages/plugins/core/preset/src/index.ts",
			),
			"@printedjs/plugin-running-headers": path.resolve(
				__dirname,
				"../../packages/plugins/core/running-headers/src/index.ts",
			),
			"@printedjs/plugin-strings": path.resolve(
				__dirname,
				"../../packages/plugins/core/strings/src/index.ts",
			),
			"@printedjs/plugin-views": path.resolve(
				__dirname,
				"../../packages/plugins/core/views/src/index.ts",
			),
			"@printedjs/plugin-widows-orphans": path.resolve(
				__dirname,
				"../../packages/plugins/core/widows-orphans/src/index.ts",
			),
		},
	},
	server: {
		port: 5173,
		open: false,
	},
	build: {
		target: "es2022",
	},
});
