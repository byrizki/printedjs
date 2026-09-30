import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		cli: "src/bin.ts",
	},
	format: ["esm"],
	target: "node22",
	splitting: false,
	dts: {
		compilerOptions: {
			composite: false,
		},
	},
	external: ["puppeteer", "playwright", "@playwright/test"],
	clean: true,
});
