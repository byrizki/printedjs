import { describe, expect, it } from "vitest";
import { findSourceLine, injectSourceLineNumbers } from "@printedjs/devtools";

const sampleTemplate = `
<style>
  @page { size: A4; margin: 20mm; }
</style>

<div class="policy-header" id="main-header">
  <div class="company-logo">Aeterna Life</div>
  <div class="policy-title">Schedule of Insurance</div>
</div>

<div class="policy-card">
  <div class="card-header">Policy Details</div>
  <p class="plan-name">Executive Life Protection</p>
</div>

<table class="coverage-table">
  <thead>
    <tr>
      <th>Benefit</th>
      <th>Sum Assured</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Term Life</td>
      <td>Rp 2.500.000.000</td>
    </tr>
  </tbody>
</table>
`;

function createMockElement(opts: {
	tag: string;
	id?: string;
	classes?: string[];
	text?: string;
	parent?: any;
	attrs?: Record<string, string>;
}) {
	const attrs = new Map<string, string>(Object.entries(opts.attrs ?? {}));

	const el: any = {
		tagName: opts.tag.toUpperCase(),
		id: opts.id ?? "",
		classList: {
			contains: (c: string) => (opts.classes ?? []).includes(c),
			[Symbol.iterator]: function* () {
				for (const c of opts.classes ?? []) yield c;
			},
		},
		textContent: opts.text ?? "",
		parentElement: opts.parent ?? null,
		getAttribute: (k: string) => attrs.get(k) ?? null,
		hasAttribute: (k: string) => attrs.has(k),
		closest: (selector: string) => {
			let curr: any = el;

			while (curr) {
				const list = Array.from(curr.classList);

				if (
					selector.includes("margin-content") &&
					list.includes("printedjs_margin-content")
				) {
					return curr;
				}

				if (
					selector.includes("margin-") &&
					list.some((c: any) => String(c).includes("margin-"))
				) {
					return curr;
				}

				curr = curr.parentElement;
			}

			return null;
		},
	};

	return el;
}

describe("source-locator", () => {
	it("returns explicit data-line attribute if present", () => {
		const el = createMockElement({
			tag: "div",
			attrs: { "data-line": "12" },
		});

		expect(findSourceLine(sampleTemplate, el)).toBe(12);
	});

	it("locates line by element id", () => {
		const el = createMockElement({
			tag: "div",
			id: "main-header",
		});

		// line 6 is <div class="policy-header" id="main-header">
		expect(findSourceLine(sampleTemplate, el)).toBe(6);
	});

	it("locates line by class name", () => {
		const el = createMockElement({
			tag: "div",
			classes: ["company-logo"],
		});

		// line 7 is <div class="company-logo">Aeterna Life</div>
		expect(findSourceLine(sampleTemplate, el)).toBe(7);
	});

	it("locates line by tag and class combination", () => {
		const el = createMockElement({
			tag: "table",
			classes: ["coverage-table"],
		});

		// line 16 is <table class="coverage-table">
		expect(findSourceLine(sampleTemplate, el)).toBe(16);
	});

	it("locates line by text content", () => {
		const el = createMockElement({
			tag: "p",
			text: "Executive Life Protection",
		});

		// line 13 is <p class="plan-name">Executive Life Protection</p>
		expect(findSourceLine(sampleTemplate, el)).toBe(13);
	});

	it("locates line by ascending to parent element", () => {
		const parent = createMockElement({
			tag: "div",
			classes: ["policy-card"],
		});

		const el = createMockElement({
			tag: "span",
			parent,
		});

		// line 11 is <div class="policy-card">
		expect(findSourceLine(sampleTemplate, el)).toBe(11);
	});

	it("returns null when no match found", () => {
		const el = createMockElement({
			tag: "section",
			classes: ["non-existent-class-xyz"],
		});

		expect(findSourceLine(sampleTemplate, el)).toBeNull();
	});

	it("injects data-source-line into HTML tags preserving template code and styles", () => {
		const template = `<div class="footer-details">
  <div>
    <h4>Remittance Instructions</h4>
    <div>Bank: <%= bankDetails.bank %></div>
  </div>
  <div>
    <h4>Terms & Conditions</h4>
    <p style="margin: 0;"><%= notes %></p>
  </div>
</div>`;

		const annotated = injectSourceLineNumbers(template);

		expect(annotated).toContain('<div data-source-line="1" class="footer-details">');
		expect(annotated).toContain('<div data-source-line="2">');
		expect(annotated).toContain('<h4 data-source-line="3">Remittance Instructions</h4>');
		expect(annotated).toContain(
			'<div data-source-line="4">Bank: <%= bankDetails.bank %></div>',
		);
		expect(annotated).toContain(
			'<p data-source-line="8" style="margin: 0;"><%= notes %></p>',
		);
		expect(annotated).not.toContain("<% data-source-line");
	});

	it("correctly pinpoints dynamic template element using data-source-line", () => {
		const template = `<div class="footer-details">
  <div>
    <h4>Terms & Conditions</h4>
    <p style="margin: 0;"><%= notes %></p>
  </div>
</div>`;

		// In rendered DOM, notes was evaluated to text, but carries data-source-line="4"
		const el = createMockElement({
			tag: "p",
			text: "Payment is due within 30 days of invoice date.",
			attrs: { "data-source-line": "4" },
		});

		expect(findSourceLine(template, el)).toBe(4);
	});

	it("accurately finds dynamic element inside parent block even without data-source-line", () => {
		const template = `<div class="footer-details">
  <div>
    <h4>Terms & Conditions</h4>
    <p style="margin: 0;"><%= notes %></p>
  </div>
</div>`;

		const parent = createMockElement({
			tag: "div",
			classes: ["footer-details"],
		});

		// Dynamic rendered text not in template, but parent container is footer-details
		const el = createMockElement({
			tag: "p",
			text: "Payment is due within 30 days of invoice date.",
			parent,
		});

		// Should pinpoint line 4 (<p style="margin: 0;"><%= notes %></p>), NOT line 1 (<div class="footer-details">)
		expect(findSourceLine(template, el)).toBe(4);
	});

	it("locates CSS Paged Media margin box rule when hovering page header/footer", () => {
		const template = `<style>
  @page {
    @bottom-left {
      content: "Printedjs Document Generation Engine";
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
    }
  }
</style>

<div class="header">
  <div>Header Content</div>
</div>`;

		const marginBoxParent = createMockElement({
			tag: "div",
			classes: ["printedjs_margin", "printedjs_margin-bottom-left"],
		});

		const marginContent = createMockElement({
			tag: "div",
			classes: ["printedjs_margin-content"],
			parent: marginBoxParent,
		});

		// Should resolve to line 3 (@bottom-left), NOT line 12 (<div class="header">)!
		expect(findSourceLine(template, marginContent)).toBe(3);

		const rightMarginBoxParent = createMockElement({
			tag: "div",
			classes: ["printedjs_margin", "printedjs_margin-bottom-right"],
		});

		const rightMarginContent = createMockElement({
			tag: "div",
			classes: ["printedjs_margin-content"],
			parent: rightMarginBoxParent,
		});

		// Should resolve to line 6 (@bottom-right)
		expect(findSourceLine(template, rightMarginContent)).toBe(6);
	});

	it("does not falsely match the first header div when element has no text or classes", () => {
		const template = `<div class="header">
  <h1>Page Title</h1>
</div>
<div>Other content</div>`;

		const emptyEl = createMockElement({
			tag: "div",
		});

		// Should NOT match line 1 (<div class="header">)
		expect(findSourceLine(template, emptyEl)).toBeNull();
	});
});
