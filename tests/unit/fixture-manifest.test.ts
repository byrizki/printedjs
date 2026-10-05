import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { legacySourceMappingOracle } from "../fixtures/legacy-source-mapping.js";
import {
	legacyFixtureManifest,
	legacySpecFixtureIds,
	orphanFixtureCandidates,
} from "../fixtures/manifest.js";

const repositoryRoot = resolve(import.meta.dirname, "../..");

const resourceAttributes =
	/<(?:script|img|source|video|audio|iframe|embed|object|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi;

const stylesheetImports = /@import\s+(?:url\(\s*)?["']([^"']+)["']/gi;

function localResourcePath(reference: string, sourcePath: string): string | null {
	const cleanReference = reference.split(/[?#]/, 1)[0];

	if (!cleanReference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(cleanReference))
		return null;

	if (cleanReference.endsWith("/dist/paged.polyfill.js")) return null;

	return resolve(dirname(sourcePath), cleanReference);
}

function referencedLocalResources(sourcePath: string): string[] {
	const source = readFileSync(sourcePath, "utf8");

	const references = [
		...(!sourcePath.endsWith(".css")
			? [...source.matchAll(resourceAttributes)].map((match) => match[1])
			: []),
		...[...source.matchAll(stylesheetImports)].map((match) => match[1]),
	];

	return references.flatMap((reference) => {
		const resourcePath = localResourcePath(reference, sourcePath);

		return resourcePath !== null ? [resourcePath] : [];
	});
}

describe("legacy fixture manifest", () => {
	test("covers every legacy spec fixture once with copied, attributed inputs", () => {
		expect(legacySpecFixtureIds).toHaveLength(116);
		expect(new Set(legacySpecFixtureIds).size).toBe(legacySpecFixtureIds.length);
		expect(legacyFixtureManifest).toHaveLength(122);

		for (const fixture of legacyFixtureManifest) {
			expect(fixture.id).toMatch(/^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/);
			expect(fixture.originalSourcePaths.length).toBeGreaterThan(0);
			expect(fixture.copiedInputHtmlPath).toMatch(/^tests\/fixtures\/.+\.html$/);
			expect(fixture.featureTags.length).toBeGreaterThan(0);
			expect(fixture.visualTolerance).toBeGreaterThanOrEqual(0);
			expect(typeof fixture.browserVariance).toBe("string");
		}
	});

	test("declares every copied input, stylesheet, and local resource", () => {
		for (const fixture of legacyFixtureManifest) {
			const declaredPaths = [
				fixture.copiedInputHtmlPath,
				...fixture.copiedStylePaths,
				...fixture.copiedAssetPaths,
			];

			for (const path of declaredPaths)
				expect(
					existsSync(resolve(repositoryRoot, path)),
					`${fixture.id}: missing ${path}`,
				).toBe(true);

			const resources = [
				fixture.copiedInputHtmlPath,
				...fixture.copiedStylePaths,
			].flatMap((path) => referencedLocalResources(resolve(repositoryRoot, path)));

			for (const resource of resources) {
				const resourcePath = resolve(repositoryRoot, resource);
				expect(
					existsSync(resourcePath),
					`${fixture.id}: missing referenced resource ${resource}`,
				).toBe(true);
				expect(
					declaredPaths.map((path) => resolve(repositoryRoot, path)),
					`${fixture.id}: undeclared resource ${resource}`,
				).toContain(resourcePath);
			}
		}
	});

	test("matches independent direct legacy-spec mapping oracle", () => {
		const oracleEntries = Object.entries(legacySourceMappingOracle).sort(
			([left], [right]) => left.localeCompare(right),
		);

		expect(oracleEntries).toHaveLength(116);

		const manifestMappings = legacyFixtureManifest
			.filter((fixture) => legacySpecFixtureIds.includes(fixture.id))
			.map(
				(fixture) =>
					[
						fixture.id,
						{ originalSourcePaths: [...fixture.originalSourcePaths] },
					] as const,
			)
			.sort(([left], [right]) => left.localeCompare(right));

		expect(manifestMappings).toEqual(oracleEntries);
		expect(
			legacyFixtureManifest.find((fixture) => fixture.id === "default/default")
				?.featureTags,
		).toContain("default");
		expect(
			legacyFixtureManifest.find((fixture) => fixture.id === "breaks/breaks")
				?.featureTags,
		).toContain("breaks");
		expect(
			legacyFixtureManifest.find((fixture) => fixture.id === "notes/footnotes/footnotes")
				?.featureTags,
		).toContain("notes");
	});

	test("records legacy orphan evidence without pretending it had a spec", () => {
		expect(orphanFixtureCandidates.map((fixture) => fixture.id)).toEqual([
			"custom-bleeds/custom-bleeds",
			"hooks/hooks",
			"media/all/all",
			"target/target-counter/counter-increment-page",
			"page-border/page-border",
			"widows-orphans/widows-orphans",
		]);
		expect(orphanFixtureCandidates.every((fixture) => fixture.sourceEvidence)).toBe(true);
	});

	test("locks reviewed legacy count corrections and Chromium 149 differences", () => {
		const fixtureById = new Map(
			legacyFixtureManifest.map((fixture) => [fixture.id, fixture]),
		);

		expect(fixtureById.get("hyphens/awesome/awesome")).toMatchObject({
			expectedPageCount: 2,
			sourceEvidence: expect.stringContaining("expects 7"),
		});
		expect(fixtureById.get("margin-boxes/text-align/text-align")).toMatchObject({
			expectedPageCount: 1,
			sourceEvidence: expect.stringContaining("expects 6"),
		});
		expect(fixtureById.get("page-rules/size/length/length")).toMatchObject({
			expectedPageCount: 2,
			sourceEvidence: expect.stringContaining("expects 1"),
		});
		expect(fixtureById.get("tables/copy-column-widths/copy-column-widths")).toMatchObject(
			{
				expectedPageCount: 4,
				legacyExpectedPageCount: 3,
				browserVariance: expect.stringContaining("Chromium 149"),
				intentionalDifference: expect.stringContaining("disabled"),
				sourceEvidence: expect.stringContaining("expects 3"),
			},
		);
		expect(fixtureById.get("tables/rebuild/rebuild")).toMatchObject({
			expectedPageCount: 3,
			legacyExpectedPageCount: 4,
			browserVariance: expect.stringContaining("Printedjs"),
			intentionalDifference: expect.stringContaining("Printedjs"),
			sourceEvidence: expect.stringContaining("expects 3"),
		});
		expect(fixtureById.get("named-page/page-group/page-group")).toMatchObject({
			expectedPageCount: 11,
			legacyExpectedPageCount: 12,
			intentionalDifference: expect.stringContaining("Printedjs"),
		});
	});

	test("declares only reviewed footnote flow and DOM variance", () => {
		const fixturesWithVariance = legacyFixtureManifest.filter(
			(fixture) => fixture.captureVariance,
		);

		expect(fixturesWithVariance).toHaveLength(1);
		expect(fixturesWithVariance[0]).toMatchObject({
			id: "notes/footnotes-lastpage/footnotes-lastpage",
			expectedPageCount: 4,
			captureVariance: {
				expectedFlowTotal: 5,
				expectedDomPageCount: 6,
				expectedPageCountSource: "domPageCount",
			},
		});
	});
});
