import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@printedjs/core": fromRoot("./packages/core/src/index.ts"),
			"@printedjs/browser": fromRoot("./packages/browser/src/index.ts"),
			"@printedjs/plugins": fromRoot("./packages/plugins/src/index.ts"),
			"@printedjs/devtools": fromRoot("./packages/devtools/src/index.ts"),
			"@printedjs/minimal": fromRoot("./packages/minimal/src/index.ts"),
			"@printedjs/polyfill": fromRoot("./packages/polyfill/src/index.ts"),
			"@printedjs/cli": fromRoot("./packages/cli/src/index.ts"),
		},
	},
	test: {
		include: ["packages/**/*.test.ts", "tests/unit/**/*.test.ts"],
		environment: "node",
	},
});
