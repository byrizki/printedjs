export const GUIDE_STYLES_ID = "printedjs-devtools-guide-styles";

export const GUIDE_STYLES = `
/* Printedjs Devtools - Visual Page Guides */
[data-printedjs-guides="true"] :is(.printedjs_sheet, .pagedjs_sheet) {
	position: relative !important;
	outline: 1px dashed rgba(239, 68, 68, 0.45) !important;
	outline-offset: -1px;
}

[data-printedjs-guides="true"] :is(.printedjs_pagebox, .pagedjs_pagebox) {
	outline: 1px solid rgba(59, 130, 246, 0.7) !important;
}

[data-printedjs-guides="true"] :is(.printedjs_page_content, .pagedjs_page_content) {
	outline: 1px dashed rgba(16, 185, 129, 0.5) !important;
}

/* Margin Boxes Outline */
[data-printedjs-guides="true"] :is(.printedjs_margin, .pagedjs_margin) {
	outline: 1px dashed rgba(96, 165, 250, 0.35) !important;
	position: relative !important;
	min-height: 12px;
}

[data-printedjs-guides="true"] :is(.printedjs_margin, .pagedjs_margin):is(.hasContent, :not(:empty)) {
	background-color: rgba(96, 165, 250, 0.08) !important;
	outline: 1px solid rgba(96, 165, 250, 0.75) !important;
}

/* Margin Box Labels */
[data-printedjs-guides="true"] :is(.printedjs_margin, .pagedjs_margin)::after {
	position: absolute;
	top: 1px;
	left: 2px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
	font-size: 8px !important;
	font-weight: normal !important;
	font-style: normal !important;
	letter-spacing: normal !important;
	text-transform: none !important;
	color: rgba(100, 116, 139, 0.7) !important;
	pointer-events: none !important;
	opacity: 0.75 !important;
	line-height: 1 !important;
	z-index: 10 !important;
}

[data-printedjs-guides="true"] :is(.printedjs_margin-top-left-corner, .pagedjs_margin-top-left-corner)::after { content: "@top-left-corner"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-top-left, .pagedjs_margin-top-left)::after { content: "@top-left"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-top-center, .pagedjs_margin-top-center)::after { content: "@top-center"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-top-right, .pagedjs_margin-top-right)::after { content: "@top-right"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-top-right-corner, .pagedjs_margin-top-right-corner)::after { content: "@top-right-corner"; }

[data-printedjs-guides="true"] :is(.printedjs_margin-left-top, .pagedjs_margin-left-top)::after { content: "@left-top"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-left-middle, .pagedjs_margin-left-middle)::after { content: "@left-middle"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-left-bottom, .pagedjs_margin-left-bottom)::after { content: "@left-bottom"; }

[data-printedjs-guides="true"] :is(.printedjs_margin-right-top, .pagedjs_margin-right-top)::after { content: "@right-top"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-right-middle, .pagedjs_margin-right-middle)::after { content: "@right-middle"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-right-bottom, .pagedjs_margin-right-bottom)::after { content: "@right-bottom"; }

[data-printedjs-guides="true"] :is(.printedjs_margin-bottom-left-corner, .pagedjs_margin-bottom-left-corner)::after { content: "@bottom-left-corner"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-bottom-left, .pagedjs_margin-bottom-left)::after { content: "@bottom-left"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-bottom-center, .pagedjs_margin-bottom-center)::after { content: "@bottom-center"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-bottom-right, .pagedjs_margin-bottom-right)::after { content: "@bottom-right"; }
[data-printedjs-guides="true"] :is(.printedjs_margin-bottom-right-corner, .pagedjs_margin-bottom-right-corner)::after { content: "@bottom-right-corner"; }

/* Split Continuity Ribbons */
[data-printedjs-guides="true"] [data-split-to] {
	border-bottom: 2px dashed #f43f5e !important;
	position: relative !important;
}

[data-printedjs-guides="true"] [data-split-to]::after {
	content: "✂ splits to next page";
	position: absolute;
	bottom: -14px;
	right: 4px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
	font-size: 8px !important;
	font-weight: normal !important;
	font-style: normal !important;
	letter-spacing: normal !important;
	text-transform: none !important;
	color: #f43f5e !important;
	background: rgba(244, 63, 94, 0.1) !important;
	border: 1px solid rgba(244, 63, 94, 0.3) !important;
	padding: 1px 4px !important;
	border-radius: 2px !important;
	pointer-events: none !important;
	line-height: 1.2 !important;
	z-index: 10 !important;
}

[data-printedjs-guides="true"] [data-split-from] {
	border-top: 2px dashed #a855f7 !important;
	position: relative !important;
}

[data-printedjs-guides="true"] [data-split-from]::before {
	content: "➔ continued from previous page";
	position: absolute;
	top: -14px;
	left: 4px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
	font-size: 8px !important;
	font-weight: normal !important;
	font-style: normal !important;
	letter-spacing: normal !important;
	text-transform: none !important;
	color: #a855f7 !important;
	background: rgba(168, 85, 247, 0.1) !important;
	border: 1px solid rgba(168, 85, 247, 0.3) !important;
	padding: 1px 4px !important;
	border-radius: 2px !important;
	pointer-events: none !important;
	line-height: 1.2 !important;
	z-index: 10 !important;
}

/* Print Safety Guarantee: Never show in print output */
@media print {
	[data-printedjs-guides="true"] :is(.printedjs_sheet, .pagedjs_sheet),
	[data-printedjs-guides="true"] :is(.printedjs_pagebox, .pagedjs_pagebox),
	[data-printedjs-guides="true"] :is(.printedjs_page_content, .pagedjs_page_content),
	[data-printedjs-guides="true"] :is(.printedjs_margin, .pagedjs_margin),
	[data-printedjs-guides="true"] [data-split-to],
	[data-printedjs-guides="true"] [data-split-from] {
		outline: none !important;
		border: none !important;
		background: transparent !important;
	}

	[data-printedjs-guides="true"] :is(.printedjs_margin, .pagedjs_margin)::after,
	[data-printedjs-guides="true"] [data-split-to]::after,
	[data-printedjs-guides="true"] [data-split-from]::before,
	[data-printedjs-devtools-overlay],
	[data-printedjs-devtools-highlight],
	[data-printedjs-devtools-tooltip] {
		display: none !important;
	}
}
`;
