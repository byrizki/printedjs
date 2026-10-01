import type { PrintedjsPlugin } from "@printedjs/core";
import { generatedContentPlugin } from "@printedjs/plugin-generated-content";

/**
 * Running headers and footers plugin supporting W3C GCPM `position: running(<ident>)`
 * and `@page` margin box `content: element(<ident>, [first | start | last | first-except])`.
 */
export function runningHeadersPlugin(): PrintedjsPlugin {
	return generatedContentPlugin();
}
