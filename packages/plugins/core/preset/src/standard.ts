import type { PrintedjsPlugin } from "@printedjs/core";
import { bookmarksPlugin } from "@printedjs/plugin-bookmarks";
import { breaksPlugin } from "@printedjs/plugin-breaks";
import { columnsPlugin } from "@printedjs/plugin-columns";
import { countersPlugin } from "@printedjs/plugin-counters";
import { footnotesPlugin } from "@printedjs/plugin-footnotes";
import { generatedContentPlugin } from "@printedjs/plugin-generated-content";
import { hyphenationPlugin } from "@printedjs/plugin-hyphenation";
import { listsPlugin } from "@printedjs/plugin-lists";
import { mathPlugin } from "@printedjs/plugin-math";
import { pageRulesPlugin } from "@printedjs/plugin-page-rules";
import { stringsPlugin } from "@printedjs/plugin-strings";
import { widowsOrphansPlugin } from "@printedjs/plugin-widows-orphans";

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
