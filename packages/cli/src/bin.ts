#!/usr/bin/env node
import process from "node:process";
import { runCli } from "./cli.js";

void runCli().catch((err) => {
	console.error("[printedjs] Fatal error:", err);
	process.exit(1);
});
