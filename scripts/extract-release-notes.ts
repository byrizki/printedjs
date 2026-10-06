import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const changelogPath = resolve(rootDir, "CHANGELOG.md");

const outDir = resolve(rootDir, "dist");

const outPath = resolve(outDir, "release-notes.md");

function extractReleaseNotes(tagArg: string): string {
	if (!existsSync(changelogPath)) {
		return "";
	}

	const version = tagArg.replace(/^v/, "").trim();
	const content = readFileSync(changelogPath, "utf-8");

	// Match section ## [version] ... up to the next ## [ or EOF
	const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	const pattern = new RegExp(
		`## \\[[^\\]]*${escapedVersion}[^\\]]*\\].*?\\n([\\s\\S]*?)(?=(?:\\n## \\[|$))`,
	);

	const match = content.match(pattern);

	if (match && match[1]) {
		return match[1].trim();
	}

	return "";
}

function run() {
	const rawTag = process.argv[2] || process.env.GITHUB_REF_NAME || "";

	if (!rawTag) {
		console.error("Usage: tsx scripts/extract-release-notes.ts <tag>");
		process.exit(1);
	}

	const notes = extractReleaseNotes(rawTag);

	if (!existsSync(outDir)) {
		mkdirSync(outDir, { recursive: true });
	}

	if (notes) {
		writeFileSync(outPath, notes, "utf-8");
		console.log(`Successfully extracted release notes for ${rawTag} to ${outPath}:\n`);
		console.log(notes);
	} else {
		console.log(
			`No specific changelog section found for ${rawTag}. Generated notes will be used.`,
		);
		writeFileSync(outPath, `Release ${rawTag}`, "utf-8");
	}
}

export { extractReleaseNotes };

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
	run();
}
