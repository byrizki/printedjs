import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const workspacePackages = [
	"packages/core",
	"packages/browser",
	"packages/plugins/core/preset",
	"packages/devtools",
	"packages/polyfill",
	"packages/minimal",
	"packages/cli",
];

let failed = false;

for (const pkgRelPath of workspacePackages) {
	const pkgPath = resolve(process.cwd(), pkgRelPath);
	const pkgJsonPath = resolve(pkgPath, "package.json");

	if (!existsSync(pkgJsonPath)) {
		console.error(`[FAIL] Missing package.json in ${pkgRelPath}`);
		failed = true;
		continue;
	}

	const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
		name: string;
		exports?: Record<string, { types?: string; import?: string }>;
	};

	console.log(`Checking package exports: ${pkg.name}...`);

	if (!pkg.exports || !pkg.exports["."]) {
		console.error(`[FAIL] ${pkg.name} missing '.' in exports`);
		failed = true;
		continue;
	}

	const mainExport = pkg.exports["."];

	if (mainExport.types) {
		const typesFile = resolve(pkgPath, mainExport.types);

		if (!existsSync(typesFile)) {
			console.error(`[FAIL] ${pkg.name} types file does not exist: ${typesFile}`);
			failed = true;
		} else {
			console.log(`  ✓ types file verified: ${mainExport.types}`);
		}
	}

	if (mainExport.import) {
		const importFile = resolve(pkgPath, mainExport.import);

		if (!existsSync(importFile)) {
			console.error(`[FAIL] ${pkg.name} import file does not exist: ${importFile}`);
			failed = true;
		} else {
			console.log(`  ✓ import file verified: ${mainExport.import}`);

			// Test runtime import
			try {
				const modUrl = pathToFileURL(importFile).href;
				const mod = await import(modUrl);
				const exportsList = Object.keys(mod);
				console.log(`  ✓ imported successfully: ${exportsList.length} exported symbols`);
			} catch (err: unknown) {
				console.error(`[FAIL] ${pkg.name} failed to import:`, err);
				failed = true;
			}
		}
	}
}

if (failed) {
	console.error("\nExport validation failed!");
	process.exit(1);
} else {
	console.log("\nAll package exports verified successfully.");
}
