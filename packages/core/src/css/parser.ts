import * as csstree from "css-tree";
import type {
	CssAst,
	CssAtRule,
	CssDeclaration,
	CssMarginBoxRule,
	CssPageRule,
	CssRule,
	SourceLocation,
} from "./ast.js";

interface MutableSourceLocation {
	source?: string | undefined;
	startLine: number;
	startColumn: number;
	endLine: number;
	endColumn: number;
}

interface MutableCssPageRule {
	selector?: string | undefined;
	declarations: readonly CssDeclaration[];
	marginBoxes: readonly CssMarginBoxRule[];
	loc?: SourceLocation | undefined;
}

interface MutableCssAst {
	rules: readonly CssRule[];
	pageRules: readonly CssPageRule[];
	atRules: readonly CssAtRule[];
	sourceUrl?: string | undefined;
}

function toSourceLocation(
	loc: csstree.CssLocation | null | undefined,
	sourceUrl?: string,
): SourceLocation | undefined {
	if (!loc) {
		return undefined;
	}

	const location: MutableSourceLocation = {
		startLine: loc.start.line,
		startColumn: loc.start.column,
		endLine: loc.end.line,
		endColumn: loc.end.column,
	};

	if (sourceUrl) {
		location.source = sourceUrl;
	}

	return location;
}

export function parseCss(css: string, sourceUrl?: string): CssAst {
	const parsedAst = csstree.parse(css, {
		positions: true,
		parseAtrulePrelude: false,
		parseRulePrelude: false,
		parseValue: false,
		parseCustomProperty: false,
	});

	const rules: CssRule[] = [];
	const pageRules: CssPageRule[] = [];
	const atRules: CssAtRule[] = [];

	csstree.walk(parsedAst, {
		visit: "Rule",
		enter(node) {
			const selector = node.prelude ? csstree.generate(node.prelude).trim() : "";
			const declarations: CssDeclaration[] = [];

			if (node.block) {
				csstree.walk(node.block, {
					visit: "Declaration",
					enter(decl) {
						declarations.push({
							property: decl.property,
							value: csstree.generate(decl.value).trim(),
							loc: toSourceLocation(decl.loc, sourceUrl),
						});
					},
				});
			}

			rules.push({
				selector,
				declarations,
				loc: toSourceLocation(node.loc, sourceUrl),
			});
		},
	});

	csstree.walk(parsedAst, {
		visit: "Atrule",
		enter(node) {
			const name = node.name.toLowerCase();

			if (name === "page") {
				const selector = node.prelude ? csstree.generate(node.prelude).trim() : undefined;
				const declarations: CssDeclaration[] = [];
				const marginBoxes: CssMarginBoxRule[] = [];

				if (node.block && "children" in node.block) {
					node.block.children.forEach((child) => {
						if (child.type === "Declaration") {
							declarations.push({
								property: child.property,
								value: csstree.generate(child.value).trim(),
								loc: toSourceLocation(child.loc, sourceUrl),
							});
						} else if (child.type === "Atrule") {
							const boxName = child.name.toLowerCase();
							const boxDeclarations: CssDeclaration[] = [];

							if (child.block) {
								csstree.walk(child.block, {
									visit: "Declaration",
									enter(d) {
										boxDeclarations.push({
											property: d.property,
											value: csstree.generate(d.value).trim(),
											loc: toSourceLocation(d.loc, sourceUrl),
										});
									},
								});
							}

							marginBoxes.push({
								marginBox: boxName,
								declarations: boxDeclarations,
								loc: toSourceLocation(child.loc, sourceUrl),
							});
						}
					});
				}

				const pageRule: MutableCssPageRule = {
					declarations,
					marginBoxes,
					loc: toSourceLocation(node.loc, sourceUrl),
				};

				if (selector) {
					pageRule.selector = selector;
				}

				pageRules.push(pageRule);
			} else if (node.name !== "margin") {
				// Other top-level at-rules
				atRules.push({
					name: node.name,
					prelude: node.prelude ? csstree.generate(node.prelude).trim() : undefined,
					block: node.block ? csstree.generate(node.block).trim() : undefined,
					loc: toSourceLocation(node.loc, sourceUrl),
				});
			}
		},
	});

	const ast: MutableCssAst = {
		rules,
		pageRules,
		atRules,
	};

	if (sourceUrl) {
		ast.sourceUrl = sourceUrl;
	}

	return ast;
}

export function generateCss(ast: CssAst): string {
	const parts: string[] = [];

	for (const atRule of ast.atRules) {
		const prelude = atRule.prelude ? ` ${atRule.prelude}` : "";
		const block = atRule.block ? ` {\n  ${atRule.block}\n}` : ";";
		parts.push(`@${atRule.name}${prelude}${block}`);
	}

	for (const pageRule of ast.pageRules) {
		const selector = pageRule.selector ? ` ${pageRule.selector}` : "";
		const inner: string[] = [];

		for (const decl of pageRule.declarations) {
			inner.push(`  ${decl.property}: ${decl.value};`);
		}

		for (const box of pageRule.marginBoxes) {
			const boxDecls = box.declarations
				.map((d) => `    ${d.property}: ${d.value};`)
				.join("\n");

			inner.push(`  @${box.marginBox} {\n${boxDecls}\n  }`);
		}

		parts.push(`@page${selector} {\n${inner.join("\n")}\n}`);
	}

	for (const rule of ast.rules) {
		const decls = rule.declarations.map((d) => `  ${d.property}: ${d.value};`).join("\n");
		parts.push(`${rule.selector} {\n${decls}\n}`);
	}

	return parts.join("\n\n");
}

export function stripPageRules(css: string): string {
	const parsedAst = csstree.parse(css, {
		positions: true,
		parseAtrulePrelude: false,
		parseRulePrelude: false,
		parseValue: false,
		parseCustomProperty: false,
	});

	csstree.walk(parsedAst, {
		visit: "Atrule",
		enter(node, item, list) {
			if (node.name.toLowerCase() === "page" && list && item) {
				if (node.block && node.block.children) {
					let hasAtrule = false;
					node.block.children.forEach((child, childItem, childList) => {
						if (child.type === "Declaration") {
							childList.remove(childItem);
						} else if (child.type === "Atrule") {
							hasAtrule = true;
						}
					});

					if (!hasAtrule) {
						list.remove(item);
					}
				} else {
					list.remove(item);
				}
			}
		},
	});

	return csstree.generate(parsedAst);
}
