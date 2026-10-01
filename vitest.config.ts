import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@printedjs/core": fromRoot("./packages/core/src/index.ts"),
			"@printedjs/browser": fromRoot("./packages/browser/src/index.ts"),
			"@printedjs/devtools": fromRoot("./packages/devtools/src/index.ts"),
			"@printedjs/minimal": fromRoot("./packages/minimal/src/index.ts"),
			"@printedjs/polyfill": fromRoot("./packages/polyfill/src/index.ts"),
			"@printedjs/cli": fromRoot("./packages/cli/src/index.ts"),
			"@printedjs/plugin-eta": fromRoot("./packages/plugins/community/eta/src/index.ts"),
			"@printedjs/plugin-page-flip": fromRoot(
				"./packages/plugins/community/page-flip/src/index.ts",
			),
			"@printedjs/plugin-bookmarks": fromRoot(
				"./packages/plugins/core/bookmarks/src/index.ts",
			),
			"@printedjs/plugin-breaks": fromRoot("./packages/plugins/core/breaks/src/index.ts"),
			"@printedjs/plugin-columns": fromRoot(
				"./packages/plugins/core/columns/src/index.ts",
			),
			"@printedjs/plugin-counters": fromRoot(
				"./packages/plugins/core/counters/src/index.ts",
			),
			"@printedjs/plugin-footnotes": fromRoot(
				"./packages/plugins/core/footnotes/src/index.ts",
			),
			"@printedjs/plugin-generated-content": fromRoot(
				"./packages/plugins/core/generated-content/src/index.ts",
			),
			"@printedjs/plugin-hyphenation": fromRoot(
				"./packages/plugins/core/hyphenation/src/index.ts",
			),
			"@printedjs/plugin-lists": fromRoot("./packages/plugins/core/lists/src/index.ts"),
			"@printedjs/plugin-math": fromRoot("./packages/plugins/core/math/src/index.ts"),
			"@printedjs/plugin-page-rules": fromRoot(
				"./packages/plugins/core/page-rules/src/index.ts",
			),
			"@printedjs/plugin-preset": fromRoot("./packages/plugins/core/preset/src/index.ts"),
			"@printedjs/plugin-running-headers": fromRoot(
				"./packages/plugins/core/running-headers/src/index.ts",
			),
			"@printedjs/plugin-strings": fromRoot(
				"./packages/plugins/core/strings/src/index.ts",
			),
			"@printedjs/plugin-views": fromRoot("./packages/plugins/core/views/src/index.ts"),
			"@printedjs/plugin-widows-orphans": fromRoot(
				"./packages/plugins/core/widows-orphans/src/index.ts",
			),
		},
	},
	test: {
		include: ["packages/**/*.test.ts", "tests/unit/**/*.test.ts"],
		environment: "node",
	},
});
