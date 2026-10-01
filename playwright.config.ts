import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: resolve(import.meta.dirname, "tests/browser"),
	forbidOnly: Boolean(process.env.CI),
	use: {
		baseURL: "http://127.0.0.1:4173",
		locale: "en-US",
		timezoneId: "UTC",
		viewport: { width: 1440, height: 1000 },
		deviceScaleFactor: 1,
		contextOptions: {
			reducedMotion: "reduce",
		},
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
			testIgnore: ["**/legacy-capture.spec.ts"],
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"], deviceScaleFactor: 1 },
			testIgnore: ["**/legacy-capture.spec.ts"],
		},
	],
	// Legacy baseline capture launches Chromium directly. Do not expand it to this matrix.
});
