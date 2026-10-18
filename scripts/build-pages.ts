import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const playgroundDist = resolve(rootDir, "apps/playground/dist");

const minimalDemoDist = resolve(rootDir, "apps/minimal-demo/dist");

const docsDir = resolve(rootDir, "docs");

const docsPublicPlayground = resolve(docsDir, "public/playground");

const docsPublicDemo = resolve(docsDir, "public/demo");

const docsDist = resolve(docsDir, ".output/public");

const outDir = resolve(rootDir, "dist-pages");

console.log("Building workspace packages...");

execSync("pnpm build", { stdio: "inherit", cwd: rootDir });

console.log("Building Playground...");

execSync("pnpm --filter playground build", { stdio: "inherit", cwd: rootDir });

console.log("Building Minimal Demo...");

execSync("pnpm --filter minimal-demo build", { stdio: "inherit", cwd: rootDir });

console.log("Mounting Playground and Minimal Demo into docs public assets...");

if (existsSync(docsPublicPlayground)) {
	rmSync(docsPublicPlayground, { recursive: true, force: true });
}

if (existsSync(docsPublicDemo)) {
	rmSync(docsPublicDemo, { recursive: true, force: true });
}

mkdirSync(docsPublicPlayground, { recursive: true });

mkdirSync(docsPublicDemo, { recursive: true });

cpSync(minimalDemoDist, docsPublicDemo, { recursive: true });

const minimalBundle = resolve(rootDir, "packages/minimal/dist/index.min.global.js");

const pageFlipBundle = resolve(
	rootDir,
	"packages/plugins/community/page-flip/dist/page-flip.min.global.js",
);

if (existsSync(minimalBundle)) {
	cpSync(minimalBundle, resolve(docsDir, "public/printedjs.min.js"));
}

if (existsSync(pageFlipBundle)) {
	cpSync(pageFlipBundle, resolve(docsDir, "public/printedjs-page-flip.min.js"));
}

console.log("Building Documentation site (Nuxt / Docus)...");

execSync("yarn build", { stdio: "inherit", cwd: docsDir });

if (existsSync(outDir)) {
	rmSync(outDir, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });

console.log("Copying generated documentation to dist-pages destination...");

cpSync(docsDist, outDir, { recursive: true });

console.log("Ensuring live demo and minimal demo directories in dist-pages...");

const finalPlayground = resolve(outDir, "playground");

const finalDemo = resolve(outDir, "demo");

if (!existsSync(finalPlayground)) {
	mkdirSync(finalPlayground, { recursive: true });

	cpSync(playgroundDist, finalPlayground, { recursive: true });
}

if (!existsSync(finalDemo)) {
	mkdirSync(finalDemo, { recursive: true });

	cpSync(minimalDemoDist, finalDemo, { recursive: true });
}

// Prevent GitHub Pages from ignoring files prefixed with an underscore or dot
writeFileSync(resolve(outDir, ".nojekyll"), "", "utf-8");

console.log("Single GitHub Pages artifact successfully assembled at:", outDir);
