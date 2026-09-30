import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		// Verbatim legacy executable/input artifacts; upstream source attribution: tests/fixtures/ATTRIBUTION.md.
		ignores: [
			"**/dist/**",
			"**/coverage/**",
			"**/node_modules/**",
			"tests/fixtures/jest.config.js",
			"tests/fixtures/jest_helpers/**/*.js",
			"tests/fixtures/media/all/all.spec..js",
			"tests/fixtures/tables/rebuild-all-tds/rebuild-all-tds.js",
		],
	},
);
