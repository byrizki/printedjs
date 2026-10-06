import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const outDir = resolve(rootDir, "dist-tarballs");

function packPackages() {
	if (existsSync(outDir)) {
		rmSync(outDir, { recursive: true, force: true });
	}

	mkdirSync(outDir, { recursive: true });

	console.log("Packing publishable workspace packages into tarballs...");

	execSync(`pnpm --filter '@printedjs/*' exec pnpm pack --pack-destination "${outDir}"`, {
		stdio: "inherit",
		cwd: rootDir,
	});

	const tarballs = readdirSync(outDir).filter((f) => f.endsWith(".tgz"));

	console.log(`\nSuccessfully packed ${tarballs.length} package tarballs into ${outDir}`);

	if (tarballs.length === 0) {
		console.error("Error: No tarballs were generated!");
		process.exit(1);
	}
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
	packPackages();
}

export { outDir, packPackages };
