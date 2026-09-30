import type { PrintedjsPlugin } from "@printedjs/core";
import { generatedContentPlugin } from "../generated-content/plugin.js";

/**
 * Running headers and footers plugin supporting W3C GCPM `position: running(<ident>)`
 * and `@page` margin box `content: element(<ident>, [first | start | last | first-except])`.
 */
export function runningHeadersPlugin(): PrintedjsPlugin {
	return generatedContentPlugin();
}
