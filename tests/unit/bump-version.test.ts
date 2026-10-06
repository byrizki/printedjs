import { describe, expect, test } from "vitest";
import { computeTargetVersion, parseSemver } from "../../scripts/bump-version.js";

describe("bump-version script", () => {
	test("parses standard semver correctly", () => {
		expect(parseSemver("1.2.3")).toEqual({
			major: 1,
			minor: 2,
			patch: 3,
			prerelease: undefined,
		});

		expect(parseSemver("0.1.0-beta.1")).toEqual({
			major: 0,
			minor: 1,
			patch: 0,
			prerelease: "beta.1",
		});
	});

	test("throws error on invalid semver format", () => {
		expect(() => parseSemver("invalid")).toThrow(/Invalid SemVer/);
		expect(() => parseSemver("1.2")).toThrow(/Invalid SemVer/);
	});

	test("computes patch, minor, and major bump versions", () => {
		expect(computeTargetVersion("0.1.0", "patch")).toBe("0.1.1");
		expect(computeTargetVersion("0.1.0", "minor")).toBe("0.2.0");
		expect(computeTargetVersion("0.1.0", "major")).toBe("1.0.0");
	});

	test("accepts direct valid semver versions", () => {
		expect(computeTargetVersion("0.1.0", "0.5.0")).toBe("0.5.0");
		expect(computeTargetVersion("0.1.0", "1.0.0-rc.1")).toBe("1.0.0-rc.1");
	});
});
