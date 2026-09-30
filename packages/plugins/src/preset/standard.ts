import type { PrintedjsPlugin } from "@printedjs/core";
import { bookmarksPlugin } from "../bookmarks/plugin.js";
import { breaksPlugin } from "../breaks/plugin.js";
import { columnsPlugin } from "../columns/plugin.js";
import { countersPlugin } from "../counters/plugin.js";
import { footnotesPlugin } from "../footnotes/plugin.js";
import { generatedContentPlugin } from "../generated-content/plugin.js";
import { hyphenationPlugin } from "../hyphenation/plugin.js";
import { listsPlugin } from "../lists/plugin.js";
import { mathPlugin } from "../math/plugin.js";
import { pageRulesPlugin } from "../page-rules/plugin.js";
import { stringsPlugin } from "../strings/plugin.js";
import { widowsOrphansPlugin } from "../widows-orphans/plugin.js";

export function standardPreset(): readonly PrintedjsPlugin[] {
	return [
		pageRulesPlugin(),
		breaksPlugin(),
		stringsPlugin(),
		generatedContentPlugin(),
		countersPlugin(),
		footnotesPlugin(),
		widowsOrphansPlugin(),
		columnsPlugin(),
		mathPlugin(),
		hyphenationPlugin(),
		bookmarksPlugin(),
		listsPlugin(),
	];
}
