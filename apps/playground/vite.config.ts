import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
			"@printedjs/plugins": path.resolve(
				__dirname,
				"../../packages/plugins/src/index.ts",
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
