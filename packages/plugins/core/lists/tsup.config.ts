import { defineConfig } from "tsup";

export default defineConfig({
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
});
