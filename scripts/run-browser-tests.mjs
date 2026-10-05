import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);

const playwrightCli = require.resolve("@playwright/test/cli");

const args = process.argv.slice(2);

if (args[0] === "--") args.shift();

const result = spawnSync(
	process.execPath,
	[playwrightCli, "test", "--config=playwright.config.ts", ...args],
	{ stdio: "inherit" },
);

if (result.error) throw result.error;

process.exitCode = result.status ?? 1;
