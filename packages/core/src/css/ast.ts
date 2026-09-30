export interface SourceLocation {
	readonly source?: string | undefined;
	readonly startLine?: number | undefined;
	readonly startColumn?: number | undefined;
	readonly endLine?: number | undefined;
	readonly endColumn?: number | undefined;
}

export interface CssDeclaration {
	readonly property: string;
	readonly value: string;
	readonly loc?: SourceLocation | undefined;
}

export interface CssRule {
	readonly selector: string;
	readonly declarations: readonly CssDeclaration[];
	readonly loc?: SourceLocation | undefined;
}

export interface CssMarginBoxRule {
	readonly marginBox: string;
	readonly declarations: readonly CssDeclaration[];
	readonly loc?: SourceLocation | undefined;
}

export interface CssPageRule {
	readonly selector?: string | undefined;
	readonly declarations: readonly CssDeclaration[];
	readonly marginBoxes: readonly CssMarginBoxRule[];
	readonly loc?: SourceLocation | undefined;
}

export interface CssAtRule {
	readonly name: string;
	readonly prelude?: string | undefined;
	readonly block?: string | undefined;
	readonly loc?: SourceLocation | undefined;
}

export interface CssAst {
	readonly rules: readonly CssRule[];
	readonly pageRules: readonly CssPageRule[];
	readonly atRules: readonly CssAtRule[];
	readonly sourceUrl?: string | undefined;
}
