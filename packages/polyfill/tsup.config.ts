import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			index: "src/index.ts",
		},
		format: ["esm", "iife"],
		globalName: "PrintedjsPolyfill",
		platform: "browser",
		target: "es2018",
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
		globalName: "PrintedjsPolyfill",
		platform: "browser",
		target: "es2018",
		minify: true,
		splitting: false,
		clean: false,
	},
]);
