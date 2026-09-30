import type { RenderWarning } from "../contracts/result.js";
import type { SourceLocation } from "./ast.js";

export class CssTransformContext {
	private readonly warningsList: RenderWarning[] = [];

	warn(message: string, loc?: SourceLocation): void {
		this.warningsList.push({
			code: "CSS_TRANSFORM_WARNING",
			message,
			...(loc?.source ? { source: loc.source } : {}),
			...(loc?.startLine ? { line: loc.startLine } : {}),
			...(loc?.startColumn ? { column: loc.startColumn } : {}),
		});
	}

	get warnings(): readonly RenderWarning[] {
		return this.warningsList;
	}
}
