import {
	parsePageRules,
	type PageBleed,
	type PageMargins,
	type PageRule,
	type PageSize,
} from "./page-rules/parser.js";
import { generatePageCss, pageRulesPlugin } from "./page-rules/plugin.js";
import { parseBreakStyles, type BreakStyleRule } from "./breaks/parser.js";
import { breaksPlugin } from "./breaks/plugin.js";
import { parseStringSets, stringsPlugin, type StringSetRule } from "./strings/plugin.js";
import {
	generatedContentPlugin,
	transformMarginBoxCss,
	type RunningAssignment,
	type RunningPolicy,
} from "./generated-content/plugin.js";
import { runningHeadersPlugin } from "./running-headers/plugin.js";
import { countersPlugin } from "./counters/plugin.js";
import { footnotesPlugin, type FootnoteRule } from "./footnotes/plugin.js";
import { widowsOrphansPlugin, type WidowOrphanRule } from "./widows-orphans/plugin.js";
import { columnsPlugin, type ColumnRule } from "./columns/plugin.js";
import { mathPlugin } from "./math/plugin.js";
import { hyphenationPlugin } from "./hyphenation/plugin.js";
import { bookmarksPlugin, type BookmarkItem } from "./bookmarks/plugin.js";
import { listsPlugin } from "./lists/plugin.js";
import { standardPreset } from "./preset/standard.js";

export {
	parsePageRules,
	type PageBleed,
	type PageMargins,
	type PageRule,
	type PageSize,
	generatePageCss,
	pageRulesPlugin,
	parseBreakStyles,
	type BreakStyleRule,
	breaksPlugin,
	parseStringSets,
	stringsPlugin,
	type StringSetRule,
	generatedContentPlugin,
	transformMarginBoxCss,
	type RunningAssignment,
	type RunningPolicy,
	runningHeadersPlugin,
	countersPlugin,
	footnotesPlugin,
	type FootnoteRule,
	widowsOrphansPlugin,
	type WidowOrphanRule,
	columnsPlugin,
	type ColumnRule,
	mathPlugin,
	hyphenationPlugin,
	bookmarksPlugin,
	type BookmarkItem,
	listsPlugin,
	standardPreset,
};

if (typeof window !== "undefined") {
	const win = window as unknown as Record<string, unknown>;
	const pluginsApi = {
		parsePageRules,
		generatePageCss,
		pageRulesPlugin,
		parseBreakStyles,
		breaksPlugin,
		parseStringSets,
		stringsPlugin,
		generatedContentPlugin,
		transformMarginBoxCss,
		runningHeadersPlugin,
		countersPlugin,
		footnotesPlugin,
		widowsOrphansPlugin,
		columnsPlugin,
		mathPlugin,
		hyphenationPlugin,
		bookmarksPlugin,
		listsPlugin,
		standardPreset,
	};
	win.PrintedPlugins = pluginsApi;
	win.PrintedjsPlugins = pluginsApi;
}
