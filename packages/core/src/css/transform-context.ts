import type { RenderWarning } from "../contracts/result.js";
import type { SourceLocation } from "./ast.js";

interface MutableCssTransformWarning extends RenderWarning {
	source?: string;
	line?: number;
	column?: number;
}

export class CssTransformContext {
	private readonly warningsList: RenderWarning[] = [];

	warn(message: string, loc?: SourceLocation): void {
		const warning: MutableCssTransformWarning = {
			code: "CSS_TRANSFORM_WARNING",
			message,
		};

		if (loc?.source) {
			warning.source = loc.source;
		}

		if (loc?.startLine) {
			warning.line = loc.startLine;
		}

		if (loc?.startColumn) {
			warning.column = loc.startColumn;
		}

		this.warningsList.push(warning);
	}

	get warnings(): readonly RenderWarning[] {
		return this.warningsList;
	}
}
