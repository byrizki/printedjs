import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "iife"],
	globalName: "Printedjs",
	splitting: false,
	dts: {
		compilerOptions: {
			composite: false,
		},
	},
	clean: true,
});
