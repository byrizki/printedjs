import type { PlaygroundFixture } from "../types/playground.js";

export const ROWSPAN_EXPANDING_FIXTURE: PlaygroundFixture = {
	id: "rowspan-expanding-table",
	title: "Multi-Page Spanning Rowspan (Expanding Across Pages)",
	category: "templates",
	description:
		"Demonstrates large table rowspan cells (rowspan 15 and 20) spanning across multiple page boundaries with automatic continuation cell replication and background preservation.",
	data: {
		planTitle: "Horizon Executive Wealth & Asset Preservation",
		policyNumber: "POL-2026-EXP-772",
		insuredName: "Morgan Vance (Standard Risk)",
		sumAssured: 2500000000,
		annualPremium: 75000000,
		projectionYears: Array.from({ length: 35 }, (_, i) => {
			const year = i + 1;
			const age = 35 + year;
			const isPhase1 = year <= 15;
			const isPhase2 = year > 15;
			const premium = year <= 10 ? 75000000 : 0;

			const guaranteedCash = Math.round(
				premium * year * 0.85 + (year > 10 ? (year - 10) * 45000000 : 0),
			);

			const projectedCash = Math.round(guaranteedCash * (1 + year * 0.035));
			const deathBenefit = 2500000000 + projectedCash;

			return {
				year,
				age,
				isPhase1,
				isPhase2,
				premium,
				guaranteedCash,
				projectedCash,
				deathBenefit,
			};
		}),
	},
	html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
@page {
  size: A4 portrait;
  margin: 18mm 14mm 20mm 14mm;
  @top-left {
    content: "HORIZON GLOBAL ASSET MANAGEMENT";
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  @top-right {
    content: "LONG-TERM FINANCIAL PROJECTION";
    font-size: 7.5pt;
    letter-spacing: 0.5px;
    color: #64748b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  @bottom-left {
    content: "Sample Document &bull; Private & Generic Illustration Schedule";
    font-size: 7.5pt;
    color: #94a3b8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 7.5pt;
    font-weight: 600;
    color: #475569;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 8pt;
  line-height: 1.35;
  color: #1e293b;
  margin: 0;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid #0f172a;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.report-title {
  font-size: 14pt;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #0f172a;
  margin: 0 0 2px 0;
}

.report-subtitle {
  font-size: 8pt;
  color: #64748b;
  font-weight: 500;
}

.meta-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.meta-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  padding: 6px 10px;
}

.meta-card-label {
  font-size: 6.5pt;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 2px;
}

.meta-card-value {
  font-size: 8.5pt;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}

/* Projection table with expanding multi-page rowspan */
table.spanning-matrix {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 7.5pt;
}

table.spanning-matrix th,
table.spanning-matrix td {
  border: 1px solid #e2e8f0;
  padding: 4.5px 6px;
  box-sizing: border-box;
}

table.spanning-matrix thead th {
  background: #0f172a;
  color: #ffffff;
  font-weight: 700;
  text-align: center;
  font-size: 7.5pt;
  letter-spacing: 0.2px;
  vertical-align: middle;
}

table.spanning-matrix thead tr.subhead th {
  background: #1e293b;
  font-size: 7pt;
  font-weight: 600;
  color: #e2e8f0;
}

/* Elegant Slate-Indigo Rowspan (Phase 1) */
td.phase-rowspan-1 {
  background: #f8fafc !important;
  color: #1e293b;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  border-left: 3px solid #6366f1 !important;
  border-right: 1px solid #cbd5e1 !important;
}

/* Elegant Emerald-Mint Rowspan (Phase 2) */
td.phase-rowspan-2 {
  background: #f0fdf4 !important;
  color: #065f46;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
  border-left: 3px solid #10b981 !important;
  border-right: 1px solid #a7f3d0 !important;
}

.phase-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 6.5pt;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.phase-tag-1 {
  background: #e0e7ff;
  color: #3730a3;
}

.phase-tag-2 {
  background: #d1fae5;
  color: #065f46;
}

.text-center { text-align: center; }
.text-right { text-align: right; }
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

tr:nth-child(even) td:not([rowspan]) {
  background: #fafafa;
}

.badge-status {
  display: inline-block;
  padding: 1.5px 6px;
  border-radius: 10px;
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-paying {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-vested {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}
</style>
</head>
<body>

<div class="report-header">
  <div>
    <h1 class="report-title"><%= planTitle %></h1>
    <div class="report-subtitle">Multi-Page Spanning Table with Continuous Active Rowspan Architecture</div>
  </div>
</div>

<div class="meta-cards">
  <div class="meta-card">
    <div class="meta-card-label">Policy Identifier</div>
    <div class="meta-card-value font-mono"><%= policyNumber %></div>
  </div>
  <div class="meta-card">
    <div class="meta-card-label">Insured Person</div>
    <div class="meta-card-value"><%= insuredName %></div>
  </div>
  <div class="meta-card">
    <div class="meta-card-label">Basic Sum Assured</div>
    <div class="meta-card-value font-mono"><%= currency(sumAssured, "IDR") %></div>
  </div>
  <div class="meta-card">
    <div class="meta-card-label">Annual Premium (10Y)</div>
    <div class="meta-card-value font-mono"><%= currency(annualPremium, "IDR") %></div>
  </div>
</div>

<table class="spanning-matrix repeat-spans repeat-header">
  <colgroup>
    <col style="width: 100px;">
    <col style="width: 38px;">
    <col style="width: 38px;">
    <col style="width: 88px;">
    <col style="width: 106px;">
    <col style="width: 110px;">
    <col style="width: 136px;">
    <col style="width: 72px;">
  </colgroup>
  <thead>
    <tr>
      <th rowspan="2">Phase / Period</th>
      <th rowspan="2">Yr</th>
      <th rowspan="2">Age</th>
      <th rowspan="2">Annual Premium</th>
      <th colspan="2">Cash Values (Nilai Tunai)</th>
      <th rowspan="2">Total Death Benefit</th>
      <th rowspan="2">Status</th>
    </tr>
    <tr class="subhead">
      <th>Guaranteed</th>
      <th>Projected Total</th>
    </tr>
  </thead>
  <tbody>
    <% projectionYears.forEach(function(row, idx) { %>
    <tr>
      <% if (row.year === 1) { %>
        <td class="phase-rowspan-1" rowspan="15">
          <div style="padding: 8px 2px;">
            <div class="phase-tag phase-tag-1">Phase 1</div>
            <div style="font-size: 8pt; font-weight: 800; color: #1e293b;">ACCUMULATION</div>
            <div style="font-size: 7pt; color: #6366f1; margin-top: 3px; font-weight: 600;">Years 1 &ndash; 15</div>
          </div>
        </td>
      <% } else if (row.year === 16) { %>
        <td class="phase-rowspan-2" rowspan="20">
          <div style="padding: 8px 2px;">
            <div class="phase-tag phase-tag-2">Phase 2</div>
            <div style="font-size: 8pt; font-weight: 800; color: #065f46;">MATURITY GROWTH</div>
            <div style="font-size: 7pt; color: #10b981; margin-top: 3px; font-weight: 600;">Years 16 &ndash; 35</div>
          </div>
        </td>
      <% } %>
      <td class="text-center font-mono font-bold"><%= row.year %></td>
      <td class="text-center font-mono"><%= row.age %></td>
      <td class="text-right font-mono"><%= row.premium > 0 ? currency(row.premium, "IDR") : "-" %></td>
      <td class="text-right font-mono"><%= currency(row.guaranteedCash, "IDR") %></td>
      <td class="text-right font-mono" style="font-weight: 600; color: #0f172a;"><%= currency(row.projectedCash, "IDR") %></td>
      <td class="text-right font-mono" style="font-weight: 700; color: #047857;"><%= currency(row.deathBenefit, "IDR") %></td>
      <td class="text-center">
        <% if (row.premium > 0) { %>
          <span class="badge-status badge-paying">Paying</span>
        <% } else { %>
          <span class="badge-status badge-vested">Vested</span>
        <% } %>
      </td>
    </tr>
    <% }); %>
  </tbody>
</table>

</body>
</html>
`,
};
