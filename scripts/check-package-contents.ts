import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

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
		continue;
	}

	const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as {
		name: string;
		files?: string[];
	};

	console.log(`Checking package distribution contents: ${pkg.name}...`);

	if (!pkg.files || !pkg.files.includes("dist")) {
		console.error(`[FAIL] ${pkg.name} package.json missing "dist" in "files" array`);
		failed = true;
	}

	const distPath = resolve(pkgPath, "dist");
	if (!existsSync(distPath)) {
		console.error(`[FAIL] ${pkg.name} dist directory does not exist!`);
		failed = true;
		continue;
	}

	const distFiles = readdirSync(distPath);
	const hasJs = distFiles.some((f) => f.endsWith(".js"));
	const hasDts = distFiles.some((f) => f.endsWith(".d.ts"));

	if (!hasJs) {
		console.error(`[FAIL] ${pkg.name} dist missing .js bundle files`);
		failed = true;
	} else {
		console.log(`  ✓ JavaScript bundle present`);
	}

	if (!hasDts) {
		console.error(`[FAIL] ${pkg.name} dist missing .d.ts type declaration files`);
		failed = true;
	} else {
		console.log(`  ✓ TypeScript definitions present`);
	}

	// Verify no stray files
	for (const file of distFiles) {
		if (file.endsWith(".tsbuildinfo")) {
			console.error(`[FAIL] ${pkg.name} dist contains forbidden file: ${file}`);
			failed = true;
		}
	}
}

if (failed) {
	console.error("\nPackage contents validation failed!");
	process.exit(1);
} else {
	console.log("\nAll package contents verified successfully.");
}
