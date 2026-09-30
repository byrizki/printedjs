import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			index: "src/index.ts",
		},
		format: ["esm", "iife"],
		globalName: "Printedjs",
		platform: "browser",
		target: "es2022",
		minify: false,
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
			"index.min": "src/index.ts",
		},
		format: ["esm", "iife"],
		globalName: "Printedjs",
		platform: "browser",
		target: "es2022",
		minify: true,
		treeshake: true,
		splitting: false,
		clean: false,
	},
]);
