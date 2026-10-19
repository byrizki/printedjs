import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

function updateChangelog(targetVersion: string, releaseDate: string): void {
	const changelogPath = resolve(rootDir, "CHANGELOG.md");

	if (!existsSync(changelogPath)) {
		return;
	}

	const existingChangelog = readFileSync(changelogPath, "utf-8");

	// Don't duplicate if already present
	if (existingChangelog.includes(`## [${targetVersion}]`)) {
		console.log(`ℹ CHANGELOG.md already contains entry for [${targetVersion}]`);

		return;
	}

	// Fetch git commits since last tag
	let latestTag = "";

	try {
		latestTag = execSync("git describe --tags --abbrev=0 2>/dev/null", {
			encoding: "utf-8",
			cwd: rootDir,
		}).trim();
	} catch {
		latestTag = "";
	}

	const gitRange = latestTag ? `${latestTag}..HEAD` : "HEAD";
	let commitsRaw = "";

	try {
		commitsRaw = execSync(`git log ${gitRange} --pretty=format:"%s"`, {
			encoding: "utf-8",
			cwd: rootDir,
		}).trim();
	} catch {
		commitsRaw = "";
	}

	const commitLines = commitsRaw ? commitsRaw.split("\n") : [];
	const addedList: string[] = [];
	const fixedList: string[] = [];
	const otherList: string[] = [];

	for (const line of commitLines) {
		const trimmed = line.trim();

		if (!trimmed) {
			continue;
		}

		// Skip release chore/bump commits
		if (
			trimmed.startsWith("chore: bump version") ||
			trimmed.startsWith("docs: update CHANGELOG") ||
			trimmed.startsWith("chore: v")
		) {
			continue;
		}

		if (trimmed.startsWith("feat")) {
			addedList.push(trimmed);
		} else if (trimmed.startsWith("fix")) {
			fixedList.push(trimmed);
		} else {
			otherList.push(trimmed);
		}
	}

	let newSection = `## [${targetVersion}] - ${releaseDate}\n\n`;

	if (addedList.length > 0) {
		newSection += `### Added\n\n`;

		for (const item of addedList) {
			newSection += `- ${item}\n`;
		}

		newSection += `\n`;
	}

	if (fixedList.length > 0) {
		newSection += `### Fixed\n\n`;

		for (const item of fixedList) {
			newSection += `- ${item}\n`;
		}

		newSection += `\n`;
	}

	if (otherList.length > 0) {
		newSection += `### Changed\n\n`;

		for (const item of otherList) {
			newSection += `- ${item}\n`;
		}

		newSection += `\n`;
	}

	if (addedList.length === 0 && fixedList.length === 0 && otherList.length === 0) {
		newSection += `### Changed\n\n- Bump version to ${targetVersion}\n\n`;
	}

	// Insert right after preamble: after line starting with "and this project adheres to [Semantic Versioning]"
	const anchor =
		"and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n";

	let updatedChangelog = "";

	if (existingChangelog.includes(anchor)) {
		updatedChangelog = existingChangelog.replace(anchor, `${anchor}\n${newSection}`);
	} else {
		// Fallback: prepend after first header
		const firstHeaderMatch = existingChangelog.match(/^# [^\n]+\n+/);

		if (firstHeaderMatch) {
			const idx = firstHeaderMatch[0].length;
			updatedChangelog =
				existingChangelog.slice(0, idx) + newSection + existingChangelog.slice(idx);
		} else {
			updatedChangelog = newSection + existingChangelog;
		}
	}

	writeFileSync(changelogPath, updatedChangelog, "utf-8");
	console.log(`✓ Updated CHANGELOG.md with release section for [${targetVersion}]`);
}

function updateDocsSnippets(targetVersion: string): void {
	const docFiles = [
		resolve(rootDir, "docs/content/en/01.getting-started/2.installation.md"),
		resolve(rootDir, "docs/content/id/01.getting-started/2.installation.md"),
	];

	for (const docFile of docFiles) {
		if (existsSync(docFile)) {
			const raw = readFileSync(docFile, "utf-8");

			const updated = raw.replace(
				/(<PackageReference Include="PrintedJs\.HeadlessWebView" Version=")[^"]+(" \/>)/g,
				`$1${targetVersion}$2`,
			);

			if (updated !== raw) {
				writeFileSync(docFile, updated, "utf-8");
				console.log(
					`✓ Updated documentation snippet version in ${docFile.replace(rootDir + "/", "")}`,
				);
			}
		}
	}
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

	// 5. Update .NET NuGet package version
	const dotnetCsprojPath = resolve(
		rootDir,
		"packages/headless-webview/dotnet/PrintedJs.HeadlessWebView/PrintedJs.HeadlessWebView.csproj",
	);

	if (existsSync(dotnetCsprojPath)) {
		const rawCsproj = readFileSync(dotnetCsprojPath, "utf-8");

		const updatedCsproj = rawCsproj.replace(
			/<Version>[^<]+<\/Version>/,
			`<Version>${targetVersion}</Version>`,
		);

		writeFileSync(dotnetCsprojPath, updatedCsproj, "utf-8");

		console.log(
			`✓ Updated .NET NuGet version in packages/headless-webview/dotnet/PrintedJs.HeadlessWebView/PrintedJs.HeadlessWebView.csproj`,
		);
	}

	// 6. Update Cargo.toml crate version
	const cargoTomlPath = resolve(
		rootDir,
		"packages/headless-webview/crates/headless-webview-core/Cargo.toml",
	);

	if (existsSync(cargoTomlPath)) {
		const rawCargo = readFileSync(cargoTomlPath, "utf-8");

		const updatedCargo = rawCargo.replace(
			/^version = "[^"]+"/m,
			`version = "${targetVersion}"`,
		);

		writeFileSync(cargoTomlPath, updatedCargo, "utf-8");

		console.log(
			`✓ Updated Rust Cargo version in packages/headless-webview/crates/headless-webview-core/Cargo.toml`,
		);
	}

	// 7. Update docs snippets
	updateDocsSnippets(targetVersion);

	// 8. Update CHANGELOG.md
	const today = new Date().toISOString().slice(0, 10);
	updateChangelog(targetVersion, today);

	// 9. Run pnpm install to update lockfile
	console.log("\nSynchronizing pnpm-lock.yaml...");
	execSync("pnpm install", { stdio: "inherit", cwd: rootDir });

	// 10. Format modified files
	console.log("\nRunning oxfmt formatting...");
	execSync("pnpm format", { stdio: "inherit", cwd: rootDir });

	console.log(`\nSuccessfully bumped version to v${targetVersion}!`);
}

export {
	computeTargetVersion,
	findPackageJsonFiles,
	parseSemver,
	updateChangelog,
	updateDocsSnippets,
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
	bumpVersion();
}
