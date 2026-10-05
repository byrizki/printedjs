import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const playgroundDist = resolve(rootDir, "apps/playground/dist");

const minimalDemoDist = resolve(rootDir, "apps/minimal-demo/dist");

const outDir = resolve(rootDir, "dist-pages");

const demoTarget = resolve(outDir, "demo");

console.log("Building workspace packages...");

execSync("pnpm build", { stdio: "inherit", cwd: rootDir });

console.log("Building Playground...");

execSync("pnpm --filter playground build", { stdio: "inherit", cwd: rootDir });

console.log("Building Minimal Demo...");

execSync("pnpm --filter minimal-demo build", { stdio: "inherit", cwd: rootDir });

if (existsSync(outDir)) {
	rmSync(outDir, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });

console.log("Copying Playground to root destination...");

cpSync(playgroundDist, outDir, { recursive: true });

console.log("Copying Minimal Demo to /demo destination...");

mkdirSync(demoTarget, { recursive: true });

cpSync(minimalDemoDist, demoTarget, { recursive: true });

// Prevent GitHub Pages from ignoring files prefixed with an underscore or dot
writeFileSync(resolve(outDir, ".nojekyll"), "", "utf-8");

console.log("Single GitHub Pages artifact successfully assembled at:", outDir);
