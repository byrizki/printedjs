import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	splitting: false,
	dts: {
		compilerOptions: {
			composite: false,
		},
	},
	clean: true,
});
