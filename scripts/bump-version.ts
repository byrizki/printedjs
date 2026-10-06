import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();

function parseSemver(version: string): {
	major: number;
	minor: number;
	patch: number;
	prerelease?: string;
} {
	const match = version.match(
		/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/,
	);

	if (!match) {
		throw new Error(`Invalid SemVer format: "${version}"`);
	}

	return {
		major: Number.parseInt(match[1], 10),
		minor: Number.parseInt(match[2], 10),
		patch: Number.parseInt(match[3], 10),
		prerelease: match[4],
	};
}

function computeTargetVersion(currentVersion: string, bumpArg: string): string {
	const parsed = parseSemver(currentVersion);

	switch (bumpArg) {
		case "patch":
			return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
		case "minor":
			return `${parsed.major}.${parsed.minor + 1}.0`;
		case "major":
			return `${parsed.major + 1}.0.0`;
		default: {
			// Direct version specified
			parseSemver(bumpArg);

			return bumpArg;
		}
	}
}

function findPackageJsonFiles(dir: string): string[] {
	const results: string[] = [];
	const entries = readdirSync(dir);

	for (const entry of entries) {
		if (
			entry === "node_modules" ||
			entry === "dist" ||
			entry === ".git" ||
			entry === "dist-pages" ||
			entry === "StPageFlip"
		) {
			continue;
		}

		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			results.push(...findPackageJsonFiles(fullPath));
		} else if (entry === "package.json") {
			results.push(fullPath);
		}
	}

	return results;
}

function bumpVersion() {
	const args = process.argv.slice(2);
	const bumpArg = args[0];

	if (args.includes("--help") || args.includes("-h")) {
		console.log("Usage: tsx scripts/bump-version.ts <patch | minor | major | <version>>");
		console.log("Example:");
		console.log("  tsx scripts/bump-version.ts patch");
		console.log("  tsx scripts/bump-version.ts minor");
		console.log("  tsx scripts/bump-version.ts 0.2.0");
		process.exit(0);
	}

	if (!bumpArg) {
		console.error("Error: Missing version or bump type (patch, minor, major).");
		console.log("Usage: tsx scripts/bump-version.ts <patch | minor | major | <version>>");
		process.exit(1);
	}

	const rootPackageJsonPath = resolve(rootDir, "package.json");

	const rootPkg = JSON.parse(readFileSync(rootPackageJsonPath, "utf-8")) as {
		version: string;
	};

	const currentVersion = rootPkg.version;
	const targetVersion = computeTargetVersion(currentVersion, bumpArg);

	console.log(`Bumping monorepo version: ${currentVersion} -> ${targetVersion}\n`);

	// 1. Update all package.json files
	const packageJsonPaths = [
		rootPackageJsonPath,
		...findPackageJsonFiles(resolve(rootDir, "packages")),
		...findPackageJsonFiles(resolve(rootDir, "apps")),
	];

	for (const pkgPath of packageJsonPaths) {
		const raw = readFileSync(pkgPath, "utf-8");
		const updated = raw.replace(/"version":\s*"[^"]+"/, `"version": "${targetVersion}"`);
		writeFileSync(pkgPath, updated, "utf-8");
		console.log(`✓ Updated version in ${pkgPath.replace(rootDir + "/", "")}`);
	}

	// 2. Update CLI version string
	const cliSrcPath = resolve(rootDir, "packages/cli/src/cli.ts");
	const rawCli = readFileSync(cliSrcPath, "utf-8");

	const updatedCli = rawCli.replace(
		/console\.log\("printedjs\s+[^"]+"\);/,
		`console.log("printedjs ${targetVersion}");`,
	);

	writeFileSync(cliSrcPath, updatedCli, "utf-8");
	console.log(`✓ Updated CLI version string in packages/cli/src/cli.ts`);

	// 3. Update CLI unit test assertion
	const cliTestPath = resolve(rootDir, "tests/unit/cli.test.ts");
	const rawCliTest = readFileSync(cliTestPath, "utf-8");

	const updatedCliTest = rawCliTest.replace(
		/expect\(consoleLogSpy\)\.toHaveBeenCalledWith\("printedjs\s+[^"]+"\);/,
		`expect(consoleLogSpy).toHaveBeenCalledWith("printedjs ${targetVersion}");`,
	);

	writeFileSync(cliTestPath, updatedCliTest, "utf-8");
	console.log(`✓ Updated CLI version test in tests/unit/cli.test.ts`);

	// 4. Update Playground header badge
	const headerSrcPath = resolve(rootDir, "apps/playground/src/components/header.ts");
	const rawHeader = readFileSync(headerSrcPath, "utf-8");

	const updatedHeader = rawHeader.replace(
		/<span class="pm-version-badge">v[^<]+<\/span>/,
		`<span class="pm-version-badge">v${targetVersion}</span>`,
	);

	writeFileSync(headerSrcPath, updatedHeader, "utf-8");
	console.log(
		`✓ Updated playground header badge in apps/playground/src/components/header.ts`,
	);

	// 5. Run pnpm install to update lockfile
	console.log("\nSynchronizing pnpm-lock.yaml...");
	execSync("pnpm install", { stdio: "inherit", cwd: rootDir });

	// 6. Format modified files
	console.log("\nRunning oxfmt formatting...");
	execSync("pnpm format", { stdio: "inherit", cwd: rootDir });

	console.log(`\nSuccessfully bumped version to v${targetVersion}!`);
}

export { computeTargetVersion, findPackageJsonFiles, parseSemver };

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
	bumpVersion();
}
