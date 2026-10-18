import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["esm"],
		platform: "browser",
		splitting: false,
		dts: {
			compilerOptions: {
				composite: false,
			},
		},
		clean: true,
	},
	{
		entry: {
			"page-flip.min": "src/index.ts",
		},
		format: ["iife"],
		globalName: "PrintedjsPageFlip",
		platform: "browser",
		minify: true,
		clean: false,
	},
]);
