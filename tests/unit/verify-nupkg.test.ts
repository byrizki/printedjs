import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { DESKTOP_PLATFORMS, validateBinaryFormat } from "../../scripts/verify-nupkg.js";

describe("verify-nupkg native prebuilt validator", () => {
	test("defines all 4 required desktop runtime targets", () => {
		const rids = DESKTOP_PLATFORMS.map((p) => p.rid);

		expect(rids).toEqual(["linux-x64", "osx-arm64", "osx-x64", "win-x64"]);

		for (const target of DESKTOP_PLATFORMS) {
			expect(target.minSizeBytes).toBeGreaterThanOrEqual(500 * 1024);
			expect(target.binaryPath).toMatch(/^runtimes\/[a-z0-9-]+\/native\//);
		}
	});

	test("validates ELF binary magic bytes", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nupkg-test-"));
		const elfFile = join(tempDir, "test.so");

		try {
			// Valid ELF header: 0x7f, 'E', 'L', 'F'
			writeFileSync(elfFile, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]));
			expect(validateBinaryFormat(elfFile, "elf")).toBe(true);
			expect(validateBinaryFormat(elfFile, "macho")).toBe(false);
			expect(validateBinaryFormat(elfFile, "pe")).toBe(false);

			// Corrupt header
			writeFileSync(elfFile, Buffer.from([0x00, 0x45, 0x4c, 0x46]));
			expect(validateBinaryFormat(elfFile, "elf")).toBe(false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("validates Mach-O binary magic bytes for macOS arm64 and x64", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nupkg-test-"));
		const machoFile = join(tempDir, "test.dylib");

		try {
			// Little-endian 64-bit Mach-O (MH_MAGIC_64): 0xcf, 0xfa, 0xed, 0xfe
			writeFileSync(machoFile, Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0x00]));
			expect(validateBinaryFormat(machoFile, "macho")).toBe(true);
			expect(validateBinaryFormat(machoFile, "elf")).toBe(false);
			expect(validateBinaryFormat(machoFile, "pe")).toBe(false);

			// FAT binary: 0xca, 0xfe, 0xba, 0xbe
			writeFileSync(machoFile, Buffer.from([0xca, 0xfe, 0xba, 0xbe, 0x00]));
			expect(validateBinaryFormat(machoFile, "macho")).toBe(true);

			// Corrupt header
			writeFileSync(machoFile, Buffer.from([0xaa, 0xbb, 0xcc, 0xdd]));
			expect(validateBinaryFormat(machoFile, "macho")).toBe(false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("validates Windows PE DLL magic bytes", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "nupkg-test-"));
		const dllFile = join(tempDir, "test.dll");

		try {
			// Windows PE MZ header: 0x4d, 0x5a
			writeFileSync(dllFile, Buffer.from([0x4d, 0x5a, 0x90, 0x00]));
			expect(validateBinaryFormat(dllFile, "pe")).toBe(true);
			expect(validateBinaryFormat(dllFile, "elf")).toBe(false);
			expect(validateBinaryFormat(dllFile, "macho")).toBe(false);

			// Corrupt header
			writeFileSync(dllFile, Buffer.from([0x00, 0x00, 0x00, 0x00]));
			expect(validateBinaryFormat(dllFile, "pe")).toBe(false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("validates actual compiled linux-x64 native library if present", () => {
		const linuxLib =
			"packages/headless-webview/dotnet/PrintedJs.HeadlessWebView/runtimes/linux-x64/native/libheadless_webview_core.so";

		if (existsSync(linuxLib)) {
			expect(validateBinaryFormat(linuxLib, "elf")).toBe(true);
		}
	});
});
