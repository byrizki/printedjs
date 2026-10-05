export const PAGE_SHELL_CSS = `
:root {
	--printedjs-width: 8.5in;
	--printedjs-height: 11in;
	--printedjs-width-right: var(--printedjs-width);
	--printedjs-height-right: var(--printedjs-height);
	--printedjs-width-left: var(--printedjs-width);
	--printedjs-height-left: var(--printedjs-height);
	--printedjs-pagebox-width: 8.5in;
	--printedjs-pagebox-height: 11in;
	--printedjs-footnotes-height: 0mm;
	--printedjs-margin-top: 1in;
	--printedjs-margin-right: 1in;
	--printedjs-margin-bottom: 1in;
	--printedjs-margin-left: 1in;
	--printedjs-padding-top: 0mm;
	--printedjs-padding-right: 0mm;
	--printedjs-padding-bottom: 0mm;
	--printedjs-padding-left: 0mm;
	--printedjs-border-top: 0mm;
	--printedjs-border-right: 0mm;
	--printedjs-border-bottom: 0mm;
	--printedjs-border-left: 0mm;
	--printedjs-bleed-top: 0mm;
	--printedjs-bleed-right: 0mm;
	--printedjs-bleed-bottom: 0mm;
	--printedjs-bleed-left: 0mm;
	--printedjs-crop-color: black;
	--printedjs-crop-shadow: white;
	--printedjs-crop-offset: 2mm;
	--printedjs-crop-stroke: 1px;
	--printedjs-cross-size: 5mm;
	--printedjs-mark-cross-display: none;
	--printedjs-mark-crop-display: none;
	--printedjs-page-count: 0;
	--printedjs-page-counter-increment: 1;
	--printedjs-footnotes-count: 0;
	--printedjs-column-gap-offset: 1000px;

	--pagedjs-width: var(--printedjs-width);
	--pagedjs-height: var(--printedjs-height);
	--pagedjs-width-right: var(--printedjs-width-right);
	--pagedjs-height-right: var(--printedjs-height-right);
	--pagedjs-width-left: var(--printedjs-width-left);
	--pagedjs-height-left: var(--printedjs-height-left);
	--pagedjs-pagebox-width: var(--printedjs-pagebox-width);
	--pagedjs-pagebox-height: var(--printedjs-pagebox-height);
	--pagedjs-footnotes-height: var(--printedjs-footnotes-height);
	--pagedjs-margin-top: var(--printedjs-margin-top);
	--pagedjs-margin-right: var(--printedjs-margin-right);
	--pagedjs-margin-bottom: var(--printedjs-margin-bottom);
	--pagedjs-margin-left: var(--printedjs-margin-left);
	--pagedjs-padding-top: var(--printedjs-padding-top);
	--pagedjs-padding-right: var(--printedjs-padding-right);
	--pagedjs-padding-bottom: var(--printedjs-padding-bottom);
	--pagedjs-padding-left: var(--printedjs-padding-left);
	--pagedjs-border-top: var(--printedjs-border-top);
	--pagedjs-border-right: var(--printedjs-border-right);
	--pagedjs-border-bottom: var(--printedjs-border-bottom);
	--pagedjs-border-left: var(--printedjs-border-left);
	--pagedjs-bleed-top: var(--printedjs-bleed-top);
	--pagedjs-bleed-right: var(--printedjs-bleed-right);
	--pagedjs-bleed-bottom: var(--printedjs-bleed-bottom);
	--pagedjs-bleed-left: var(--printedjs-bleed-left);
	--pagedjs-crop-color: var(--printedjs-crop-color);
	--pagedjs-crop-shadow: var(--printedjs-crop-shadow);
	--pagedjs-crop-offset: var(--printedjs-crop-offset);
	--pagedjs-crop-stroke: var(--printedjs-crop-stroke);
	--pagedjs-cross-size: var(--printedjs-cross-size);
	--pagedjs-mark-cross-display: var(--printedjs-mark-cross-display);
	--pagedjs-mark-crop-display: var(--printedjs-mark-crop-display);
	--pagedjs-page-count: var(--printedjs-page-count);
	--pagedjs-page-counter-increment: var(--printedjs-page-counter-increment);
	--pagedjs-footnotes-count: var(--printedjs-footnotes-count);
	--pagedjs-column-gap-offset: var(--printedjs-column-gap-offset);
}

@page {
	size: var(--printedjs-width, var(--pagedjs-width)) var(--printedjs-height, var(--pagedjs-height));
	margin: 0;
}

@media print {
	html {
		width: 100%;
		height: 100%;
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
	body {
		margin: 0;
		padding: 0;
		width: 100% !important;
		height: 100% !important;
		min-width: 100%;
		max-width: 100%;
		min-height: 100%;
		max-height: 100%;
	}
	[data-printedjs-root="true"] {
		width: 100% !important;
		height: 100% !important;
		min-width: 100%;
		max-width: 100%;
		min-height: 100%;
		max-height: 100%;
		display: block !important;
	}
	:is(.printedjs_pages, .pagedjs_pages) {
		width: auto;
		display: block !important;
		transform: none !important;
		height: 100% !important;
		min-height: 100%;
		max-height: 100%;
		overflow: visible;
	}
	:is(.printedjs_page, .pagedjs_page) {
		margin: 0;
		padding: 0;
		max-height: 100%;
		min-height: 100%;
		height: 100% !important;
		page-break-after: always;
		break-after: page;
	}
	:is(.printedjs_page, .pagedjs_page):last-child {
		page-break-after: avoid !important;
		break-after: avoid !important;
	}
	:is(.printedjs_sheet, .pagedjs_sheet) {
		margin: 0;
		padding: 0;
		max-height: 100%;
		min-height: 100%;
		height: 100% !important;
	}
}

:is(.printedjs_pages, .pagedjs_pages) {
	box-sizing: border-box;
	counter-reset: page 0 pages var(--printedjs-page-count, var(--pagedjs-page-count, 1)) footnote var(--printedjs-footnotes-count, var(--pagedjs-footnotes-count, 0)) footnote-marker var(--printedjs-footnotes-count, var(--pagedjs-footnotes-count, 0));
}

:is(.printedjs_page, .pagedjs_page) {
	box-sizing: border-box;
	counter-increment: page var(--printedjs-page-counter-increment, var(--pagedjs-page-counter-increment, 1));
	width: var(--printedjs-width, var(--pagedjs-width));
	height: var(--printedjs-height, var(--pagedjs-height));
	position: relative;
	page-break-after: always;
	break-after: page;
}

:is(.printedjs_page, .pagedjs_page):is(.printedjs_right_page, .pagedjs_right_page) {
	width: var(--printedjs-width-right, var(--pagedjs-width-right, var(--printedjs-width, var(--pagedjs-width))));
	height: var(--printedjs-height-right, var(--pagedjs-height-right, var(--printedjs-height, var(--pagedjs-height))));
}

:is(.printedjs_page, .pagedjs_page):is(.printedjs_left_page, .pagedjs_left_page) {
	width: var(--printedjs-width-left, var(--pagedjs-width-left, var(--printedjs-width, var(--pagedjs-width))));
	height: var(--printedjs-height-left, var(--pagedjs-height-left, var(--printedjs-height, var(--pagedjs-height))));
}

:is(.printedjs_sheet, .pagedjs_sheet) {
	box-sizing: border-box;
	width: 100%;
	height: 100%;
	overflow: hidden;
	position: relative;
	display: grid;
	grid-template-columns: [bleed-left] var(--printedjs-bleed-left, var(--pagedjs-bleed-left)) [sheet-center] calc(100% - var(--printedjs-bleed-left, var(--pagedjs-bleed-left)) - var(--printedjs-bleed-right, var(--pagedjs-bleed-right))) [bleed-right] var(--printedjs-bleed-right, var(--pagedjs-bleed-right));
	grid-template-rows: [bleed-top] var(--printedjs-bleed-top, var(--pagedjs-bleed-top)) [sheet-middle] calc(100% - var(--printedjs-bleed-top, var(--pagedjs-bleed-top)) - var(--printedjs-bleed-bottom, var(--pagedjs-bleed-bottom))) [bleed-bottom] var(--printedjs-bleed-bottom, var(--pagedjs-bleed-bottom));
}

:is(.printedjs_bleed, .pagedjs_bleed) {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: nowrap;
	overflow: hidden;
	box-sizing: border-box;
}

:is(.printedjs_bleed-top, .pagedjs_bleed-top) {
	grid-column: bleed-left / -1;
	grid-row: bleed-top;
	flex-direction: row;
}

:is(.printedjs_bleed-bottom, .pagedjs_bleed-bottom) {
	grid-column: bleed-left / -1;
	grid-row: bleed-bottom;
	flex-direction: row;
}

:is(.printedjs_bleed-left, .pagedjs_bleed-left) {
	grid-column: bleed-left;
	grid-row: bleed-top / -1;
	flex-direction: column;
}

:is(.printedjs_bleed-right, .pagedjs_bleed-right) {
	grid-column: bleed-right;
	grid-row: bleed-top / -1;
	flex-direction: column;
}

:is(.printedjs_marks-crop, .pagedjs_marks-crop) {
	display: var(--printedjs-mark-crop-display, var(--pagedjs-mark-crop-display));
	flex-grow: 0;
	flex-shrink: 0;
	z-index: 10;
	box-sizing: border-box;
}

:is(.printedjs_bleed-top, .pagedjs_bleed-top) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(1),
:is(.printedjs_bleed-bottom, .pagedjs_bleed-bottom) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(1) {
	width: calc(var(--printedjs-bleed-left, var(--pagedjs-bleed-left)) - var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)));
	border-right: var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)) solid var(--printedjs-crop-color, var(--pagedjs-crop-color));
	box-shadow: 1px 0px 0px 0px var(--printedjs-crop-shadow, var(--pagedjs-crop-shadow));
}

:is(.printedjs_bleed-top, .pagedjs_bleed-top) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(3),
:is(.printedjs_bleed-bottom, .pagedjs_bleed-bottom) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(3) {
	width: calc(var(--printedjs-bleed-right, var(--pagedjs-bleed-right)) - var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)));
	border-left: var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)) solid var(--printedjs-crop-color, var(--pagedjs-crop-color));
	box-shadow: -1px 0px 0px 0px var(--printedjs-crop-shadow, var(--pagedjs-crop-shadow));
}

:is(.printedjs_bleed-top, .pagedjs_bleed-top) :is(.printedjs_marks-crop, .pagedjs_marks-crop) {
	align-self: flex-start;
	height: calc(var(--printedjs-bleed-top, var(--pagedjs-bleed-top)) - var(--printedjs-crop-offset, var(--pagedjs-crop-offset)));
}

:is(.printedjs_bleed-bottom, .pagedjs_bleed-bottom) :is(.printedjs_marks-crop, .pagedjs_marks-crop) {
	align-self: flex-end;
	height: calc(var(--printedjs-bleed-bottom, var(--pagedjs-bleed-bottom)) - var(--printedjs-crop-offset, var(--pagedjs-crop-offset)));
}

:is(.printedjs_bleed-left, .pagedjs_bleed-left) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(1),
:is(.printedjs_bleed-right, .pagedjs_bleed-right) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(1) {
	height: calc(var(--printedjs-bleed-top, var(--pagedjs-bleed-top)) - var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)));
	border-bottom: var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)) solid var(--printedjs-crop-color, var(--pagedjs-crop-color));
	box-shadow: 0px 1px 0px 0px var(--printedjs-crop-shadow, var(--pagedjs-crop-shadow));
}

:is(.printedjs_bleed-left, .pagedjs_bleed-left) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(3),
:is(.printedjs_bleed-right, .pagedjs_bleed-right) :is(.printedjs_marks-crop, .pagedjs_marks-crop):nth-child(3) {
	height: calc(var(--printedjs-bleed-bottom, var(--pagedjs-bleed-bottom)) - var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)));
	border-top: var(--printedjs-crop-stroke, var(--pagedjs-crop-stroke)) solid var(--printedjs-crop-color, var(--pagedjs-crop-color));
	box-shadow: 0px -1px 0px 0px var(--printedjs-crop-shadow, var(--pagedjs-crop-shadow));
}

:is(.printedjs_bleed-left, .pagedjs_bleed-left) :is(.printedjs_marks-crop, .pagedjs_marks-crop) {
	width: calc(var(--printedjs-bleed-left, var(--pagedjs-bleed-left)) - var(--printedjs-crop-offset, var(--pagedjs-crop-offset)));
	align-self: flex-start;
}

:is(.printedjs_bleed-right, .pagedjs_bleed-right) :is(.printedjs_marks-crop, .pagedjs_marks-crop) {
	width: calc(var(--printedjs-bleed-right, var(--pagedjs-bleed-right)) - var(--printedjs-crop-offset, var(--pagedjs-crop-offset)));
	align-self: flex-end;
}

:is(.printedjs_marks-middle, .pagedjs_marks-middle) {
	display: flex;
	flex-grow: 1;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
}

:is(.printedjs_marks-cross, .pagedjs_marks-cross) {
	display: var(--printedjs-mark-cross-display, var(--pagedjs-mark-cross-display));
	background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSIzMi41MzdweCIgaGVpZ2h0PSIzMi41MzdweCIgdmlld0JveD0iMC4xMDQgMC4xMDQgMzIuNTM3IDMyLjUzNyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwLjEwNCAwLjEwNCAzMi41MzcgMzIuNTM3IiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMy4zODkzIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ik0yOS45MzEsMTYuMzczYzAsNy40ODktNi4wNjgsMTMuNTYtMTMuNTU4LDEzLjU2Yy03LjQ4MywwLTEzLjU1Ny02LjA3Mi0xMy41NTctMTMuNTZjMC03LjQ4Niw2LjA3NC0xMy41NTQsMTMuNTU3LTEzLjU1NEMyMy44NjIsMi44MTksMjkuOTMxLDguODg3LDI5LjkzMSwxNi4zNzN6Ii8+PGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjMuMzg5MyIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMC4xMDQiIHkxPSIxNi4zNzMiIHgyPSIzMi42NDIiIHkyPSIxNi4zNzMiLz48bGluZSBmaWxsPSJub25lIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMy4zODkzIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHgxPSIxNi4zNzMiIHkxPSIwLjEwNCIgeDI9IjE2LjM3MyIgeTI9IjMyLjY0MiIvPjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIzLjM4OTMiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgZD0iTTI0LjUwOCwxNi4zNzNjMCw0LjQ5Ni0zLjYzOCw4LjEzNS04LjEzNSw4LjEzNWMtNC40OTEsMC04LjEzNS0zLjYzOC04LjEzNS04LjEzNWMwLTQuNDg5LDMuNjQ0LTguMTM1LDguMTM1LTguMTM1QzIwLjg2OSw4LjIzOSwyNC41MDgsMTEuODg0LDI0LjUwOCwxNi4zNzN6Ii8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjAuNjc3OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNMjkuOTMxLDE2LjM3M2MwLDcuNDg5LTYuMDY4LDEzLjU2LTEzLjU1OCwxMy41NmMtNy40ODMsMC0xMy41NTctNi4wNzItMTMuNTU3LTEzLjU2YzAtNy40ODYsNi4wNzQtMTMuNTU0LDEzLjU1Ny0xMy41NTRDMjMuODYyLDIuODE5LDI5LjkzMSw4Ljg4NywyOS45MzEsMTYuMzczeiIvPjxsaW5lIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIwLjY3NzgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgeDE9IjAuMTA0IiB5MT0iMTYuMzczIiB4Mj0iMzIuNjQyIiB5Mj0iMTYuMzczIi8+PGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjAuNjc3OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMTYuMzczIiB5MT0iMC4xMDQiIHgyPSIxNi4zNzMiIHkyPSIzMi42NDIiLz48cGF0aCBkPSJNMjQuNTA4LDE2LjM3M2MwLDQuNDk2LTMuNjM4LDguMTM1LTguMTM1LDguMTM1Yy00LjQ5MSwwLTguMTM1LTMuNjM4LTguMTM1LTguMTM1YzAtNC40ODksMy42NDQtOC4xMzUsOC4xMzUtOC4xMzVDMjAuODY5LDguMjM5LDI0LjUwOCwxMS44ODQsMjQuNTA4LDE2LjM3MyIvPjxsaW5lIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIwLjY3NzgiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgeDE9IjguMjM5IiB5MT0iMTYuMzczIiB4Mj0iMjQuNTA4IiB5Mj0iMTYuMzczIi8+PGxpbmUgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjAuNjc3OCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiB4MT0iMTYuMzczIiB5MT0iOC4yMzkiIHgyPSIxNi4zNzMiIHkyPSIyNC41MDgiLz48L3N2Zz4=);
	background-repeat: no-repeat;
	background-position: 50% 50%;
	background-size: var(--printedjs-cross-size, var(--pagedjs-cross-size));
	z-index: 10;
	width: var(--printedjs-cross-size, var(--pagedjs-cross-size));
	height: var(--printedjs-cross-size, var(--pagedjs-cross-size));
}

:is(.printedjs_pagebox, .pagedjs_pagebox) {
	box-sizing: border-box;
	width: var(--printedjs-pagebox-width, var(--pagedjs-pagebox-width));
	height: var(--printedjs-pagebox-height, var(--pagedjs-pagebox-height));
	position: relative;
	display: grid;
	grid-template-columns: [left] var(--printedjs-margin-left, var(--pagedjs-margin-left)) [center] calc(var(--printedjs-pagebox-width, var(--pagedjs-pagebox-width)) - var(--printedjs-margin-left, var(--pagedjs-margin-left)) - var(--printedjs-margin-right, var(--pagedjs-margin-right))) [right] var(--printedjs-margin-right, var(--pagedjs-margin-right));
	grid-template-rows: [header] var(--printedjs-margin-top, var(--pagedjs-margin-top)) [page] calc(var(--printedjs-pagebox-height, var(--pagedjs-pagebox-height)) - var(--printedjs-margin-top, var(--pagedjs-margin-top)) - var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom))) [footer] var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom));
	grid-column: sheet-center;
	grid-row: sheet-middle;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) * {
	box-sizing: border-box;
}

:is(.printedjs_margin-top, .pagedjs_margin-top) {
	width: calc(var(--printedjs-pagebox-width, var(--pagedjs-pagebox-width)) - var(--printedjs-margin-left, var(--pagedjs-margin-left)) - var(--printedjs-margin-right, var(--pagedjs-margin-right)));
	height: var(--printedjs-margin-top, var(--pagedjs-margin-top));
	grid-column: center;
	grid-row: header;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: 100%;
}

:is(.printedjs_margin-top-left-corner-holder, .pagedjs_margin-top-left-corner-holder) {
	width: var(--printedjs-margin-left, var(--pagedjs-margin-left));
	height: var(--printedjs-margin-top, var(--pagedjs-margin-top));
	display: flex;
	grid-column: left;
	grid-row: header;
}

:is(.printedjs_margin-top-right-corner-holder, .pagedjs_margin-top-right-corner-holder) {
	width: var(--printedjs-margin-right, var(--pagedjs-margin-right));
	height: var(--printedjs-margin-top, var(--pagedjs-margin-top));
	display: flex;
	grid-column: right;
	grid-row: header;
}

:is(.printedjs_margin-top-left-corner, .pagedjs_margin-top-left-corner) {
	width: var(--printedjs-margin-left, var(--pagedjs-margin-left));
}

:is(.printedjs_margin-top-right-corner, .pagedjs_margin-top-right-corner) {
	width: var(--printedjs-margin-right, var(--pagedjs-margin-right));
}

:is(.printedjs_margin-right, .pagedjs_margin-right) {
	height: calc(var(--printedjs-pagebox-height, var(--pagedjs-pagebox-height)) - var(--printedjs-margin-top, var(--pagedjs-margin-top)) - var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom)));
	width: var(--printedjs-margin-right, var(--pagedjs-margin-right));
	grid-column: right;
	grid-row: page;
	display: grid;
	grid-template-rows: repeat(3, 33.3333%);
	grid-template-columns: 100%;
}

:is(.printedjs_margin-bottom, .pagedjs_margin-bottom) {
	width: calc(var(--printedjs-pagebox-width, var(--pagedjs-pagebox-width)) - var(--printedjs-margin-left, var(--pagedjs-margin-left)) - var(--printedjs-margin-right, var(--pagedjs-margin-right)));
	height: var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom));
	grid-column: center;
	grid-row: footer;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: 100%;
}

:is(.printedjs_margin-bottom-left-corner-holder, .pagedjs_margin-bottom-left-corner-holder) {
	width: var(--printedjs-margin-left, var(--pagedjs-margin-left));
	height: var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom));
	display: flex;
	grid-column: left;
	grid-row: footer;
}

:is(.printedjs_margin-bottom-right-corner-holder, .pagedjs_margin-bottom-right-corner-holder) {
	width: var(--printedjs-margin-right, var(--pagedjs-margin-right));
	height: var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom));
	display: flex;
	grid-column: right;
	grid-row: footer;
}

:is(.printedjs_margin-bottom-left-corner, .pagedjs_margin-bottom-left-corner) {
	width: var(--printedjs-margin-left, var(--pagedjs-margin-left));
}

:is(.printedjs_margin-bottom-right-corner, .pagedjs_margin-bottom-right-corner) {
	width: var(--printedjs-margin-right, var(--pagedjs-margin-right));
}

:is(.printedjs_margin-left, .pagedjs_margin-left) {
	height: calc(var(--printedjs-pagebox-height, var(--pagedjs-pagebox-height)) - var(--printedjs-margin-top, var(--pagedjs-margin-top)) - var(--printedjs-margin-bottom, var(--pagedjs-margin-bottom)));
	width: var(--printedjs-margin-left, var(--pagedjs-margin-left));
	grid-column: left;
	grid-row: page;
	display: grid;
	grid-template-rows: repeat(3, 33.3333%);
	grid-template-columns: 100%;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-left-corner, .pagedjs_margin-top-left-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-right-corner, .pagedjs_margin-top-right-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-left-corner, .pagedjs_margin-bottom-left-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-right-corner, .pagedjs_margin-bottom-right-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-left, .pagedjs_margin-top-left),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-right, .pagedjs_margin-top-right),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-left, .pagedjs_margin-bottom-left),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-right, .pagedjs_margin-bottom-right),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-center, .pagedjs_margin-top-center),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-center, .pagedjs_margin-bottom-center),
:is(.printedjs_margin-right-middle, .pagedjs_margin-right-middle),
:is(.printedjs_margin-left-middle, .pagedjs_margin-left-middle) {
	display: flex;
	align-items: center;
}

:is(.printedjs_margin-right-top, .pagedjs_margin-right-top),
:is(.printedjs_margin-left-top, .pagedjs_margin-left-top) {
	display: flex;
	align-items: flex-start;
}

:is(.printedjs_margin-right-bottom, .pagedjs_margin-right-bottom),
:is(.printedjs_margin-left-bottom, .pagedjs_margin-left-bottom) {
	display: flex;
	align-items: flex-end;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-left, .pagedjs_margin-top-left),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-right-corner, .pagedjs_margin-top-right-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-left, .pagedjs_margin-bottom-left),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-right-corner, .pagedjs_margin-bottom-right-corner) {
	text-align: left;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-left-corner, .pagedjs_margin-top-left-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-right, .pagedjs_margin-top-right),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-left-corner, .pagedjs_margin-bottom-left-corner),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-right, .pagedjs_margin-bottom-right) {
	text-align: right;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-top-center, .pagedjs_margin-top-center),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-bottom-center, .pagedjs_margin-bottom-center),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-left-top, .pagedjs_margin-left-top),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-left-middle, .pagedjs_margin-left-middle),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-left-bottom, .pagedjs_margin-left-bottom),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-right-top, .pagedjs_margin-right-top),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-right-middle, .pagedjs_margin-right-middle),
:is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin-right-bottom, .pagedjs_margin-right-bottom) {
	text-align: center;
}

:is(.printedjs_pages, .pagedjs_pages) :is(.printedjs_margin, .pagedjs_margin) :is(.printedjs_margin-content, .pagedjs_margin-content) {
	width: 100%;
}

:is(.printedjs_pages, .pagedjs_pages) :is(.printedjs_pagebox, .pagedjs_pagebox) :is(.printedjs_margin, .pagedjs_margin):not(.hasContent) {
	visibility: hidden;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) {
	grid-column: center;
	grid-row: page;
	width: 100%;
	height: 100%;
	padding: var(--printedjs-padding-top, var(--pagedjs-padding-top)) var(--printedjs-padding-right, var(--pagedjs-padding-right)) var(--printedjs-padding-bottom, var(--pagedjs-padding-bottom)) var(--printedjs-padding-left, var(--pagedjs-padding-left));
	border-top: var(--printedjs-border-top, var(--pagedjs-border-top));
	border-right: var(--printedjs-border-right, var(--pagedjs-border-right));
	border-bottom: var(--printedjs-border-bottom, var(--pagedjs-border-bottom));
	border-left: var(--printedjs-border-left, var(--pagedjs-border-left));
	box-sizing: border-box;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > :is(.printedjs_page_content, .pagedjs_page_content) {
	width: 100%;
	height: calc(100% - var(--printedjs-footnotes-height, var(--pagedjs-footnotes-height)));
	position: relative;
	box-sizing: border-box;
}

:is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > :is(.printedjs_footnote_area, .pagedjs_footnote_area) {
	position: relative;
	overflow: hidden;
	height: var(--printedjs-footnotes-height, var(--pagedjs-footnotes-height));
	display: flex;
	justify-content: flex-end;
	flex-flow: column;
}

:is(.printedjs_footnote_empty, .pagedjs_footnote_empty) {
	display: none;
}

:is(.printedjs_footnote_call, .pagedjs_footnote_call) {
	font-size: 0.75em;
	line-height: 0;
	vertical-align: super;
	cursor: default;
}

[data-footnote-marker]::before {
	content: attr(data-footnote-marker) ". ";
	font-weight: bold;
}

:is(.printedjs_footnote_inner_content, .pagedjs_footnote_inner_content) > :is(.printedjs_footnote, .pagedjs_footnote, [data-note="footnote"]):not([data-note-display="inline"]) {
	display: block;
}

:is(.printedjs_page_content, .pagedjs_page_content) > div {
	height: inherit;
}

:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-to] {
	margin-bottom: unset;
	padding-bottom: unset;
}

:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-from] {
	text-indent: unset;
	margin-top: unset;
	padding-top: unset;
	initial-letter: unset;
}

:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-from] > *::first-letter,
:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-from]::first-letter {
	color: unset;
	font-size: unset;
	font-weight: unset;
	font-family: unset;
	line-height: unset;
	float: unset;
	padding: unset;
	margin: unset;
}

:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-to]:not([data-footnote-call]):after,
:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-to]:not([data-footnote-call])::after {
	content: unset;
}

:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-from]:not([data-footnote-call]):before,
:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div [data-split-from]:not([data-footnote-call])::before {
	content: unset;
}

:is(.printedjs_pages, .pagedjs_pages) > :is(.printedjs_page, .pagedjs_page) > :is(.printedjs_sheet, .pagedjs_sheet) > :is(.printedjs_pagebox, .pagedjs_pagebox) > :is(.printedjs_area, .pagedjs_area) > div li[data-split-from]:first-of-type {
	list-style: none;
}

[data-align-last-split-element="justify"] {
	text-align-last: justify !important;
}
`;

function cls(name: string, pagedjsCompatible = false): string {
	if (pagedjsCompatible) {
		return `printedjs_${name} pagedjs_${name}`;
	}

	return `printedjs_${name}`;
}

export interface PageShellOptions {
	readonly physicalPageNumber?: number | undefined;
	readonly logicalPageNumber?: number | undefined;
	readonly counterStyle?: string | undefined;
	readonly counterFormatted?: string | undefined;
	readonly counterReset?: number | undefined;
}

export function createPageShell(
	pageNumber: number,
	doc: Document = document,
	pagedjsCompatible = false,
	pageName?: string,
	options?: PageShellOptions,
): HTMLElement {
	const page = doc.createElement("div");
	page.id = `page-${pageNumber}`;

	const physicalPage = options?.physicalPageNumber ?? pageNumber;
	const logicalPage = options?.logicalPageNumber ?? pageNumber;
	const counterStyle = options?.counterStyle ?? "decimal";
	const formatted = options?.counterFormatted ?? String(logicalPage);

	page.setAttribute("data-page-number", String(logicalPage));
	page.setAttribute("data-physical-page-number", String(physicalPage));
	page.setAttribute("data-page-style", counterStyle);
	page.setAttribute("data-page-formatted", formatted);
	page.setAttribute("data-printedjs-page", "");
	page.style?.setProperty?.("--printedjs-page-number", String(logicalPage));

	if (options?.counterReset !== undefined) {
		const resetVal = Math.max(0, options.counterReset - 1);

		if (page.style) {
			page.style.counterReset = `page ${resetVal}`;
		}

		page.setAttribute("data-counter-reset", String(options.counterReset));
	}

	if (pageName) {
		page.setAttribute("data-page", pageName);
	}

	const classes: string[] = ["printedjs_page"];

	if (pagedjsCompatible) {
		classes.push("pagedjs_page");
	}

	if (pageName) {
		classes.push(`printedjs_${pageName}_page`);

		if (pagedjsCompatible) {
			classes.push(`pagedjs_${pageName}_page`);
		}
	}

	if (pageNumber === 1) {
		classes.push("printedjs_first_page");

		if (pagedjsCompatible) {
			classes.push("pagedjs_first_page");
		}
	}

	if (pageNumber % 2 === 1) {
		classes.push("printedjs_right_page");

		if (pagedjsCompatible) {
			classes.push("pagedjs_right_page");
		}
	} else {
		classes.push("printedjs_left_page");

		if (pagedjsCompatible) {
			classes.push("pagedjs_left_page");
		}
	}

	page.className = classes.join(" ");

	page.innerHTML = `
	<div class="${cls("sheet", pagedjsCompatible)}" data-printedjs-sheet="">
		<div class="${cls("bleed", pagedjsCompatible)} ${cls("bleed-top", pagedjsCompatible)}">
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
			<div class="${cls("marks-middle", pagedjsCompatible)}">
				<div class="${cls("marks-cross", pagedjsCompatible)}"></div>
			</div>
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
		</div>
		<div class="${cls("bleed", pagedjsCompatible)} ${cls("bleed-bottom", pagedjsCompatible)}">
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
			<div class="${cls("marks-middle", pagedjsCompatible)}">
				<div class="${cls("marks-cross", pagedjsCompatible)}"></div>
			</div>
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
		</div>
		<div class="${cls("bleed", pagedjsCompatible)} ${cls("bleed-left", pagedjsCompatible)}">
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
			<div class="${cls("marks-middle", pagedjsCompatible)}">
				<div class="${cls("marks-cross", pagedjsCompatible)}"></div>
			</div>
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
		</div>
		<div class="${cls("bleed", pagedjsCompatible)} ${cls("bleed-right", pagedjsCompatible)}">
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
			<div class="${cls("marks-middle", pagedjsCompatible)}">
				<div class="${cls("marks-cross", pagedjsCompatible)}"></div>
			</div>
			<div class="${cls("marks-crop", pagedjsCompatible)}"></div>
		</div>
		<div class="${cls("pagebox", pagedjsCompatible)}" data-printedjs-pagebox="">
			<div class="${cls("margin-top-left-corner-holder", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-top-left-corner", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-top", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-top-left", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-top-center", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-top-right", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-top-right-corner-holder", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-top-right-corner", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-right", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-right-top", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-right-middle", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-right-bottom", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-left", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-left-top", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-left-middle", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-left-bottom", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-bottom-left-corner-holder", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-bottom-left-corner", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-bottom", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-bottom-left", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-bottom-center", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-bottom-right", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("margin-bottom-right-corner-holder", pagedjsCompatible)}">
				<div class="${cls("margin", pagedjsCompatible)} ${cls("margin-bottom-right-corner", pagedjsCompatible)}"><div class="${cls("margin-content", pagedjsCompatible)}"></div></div>
			</div>
			<div class="${cls("area", pagedjsCompatible)}" data-printedjs-area="">
				<div class="${cls("page_content", pagedjsCompatible)}" data-printedjs-content=""><div></div></div>
				<div class="${cls("footnote_area", pagedjsCompatible)}">
					<div class="${cls("footnote_content", pagedjsCompatible)} ${cls("footnote_empty", pagedjsCompatible)}">
						<div class="${cls("footnote_inner_content", pagedjsCompatible)}"></div>
					</div>
				</div>
			</div>
		</div>
	</div>`;

	return page;
}
