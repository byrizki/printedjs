import type { PlaygroundFixture } from "../types/playground.js";

export const POLICY_FIXTURE: PlaygroundFixture = {
	id: "insurance-policy",
	title: "Insurance Policy Statement (BigInt & Helpers)",
	category: "templates",
	description:
		"Demonstrates BigInt numeric normalization, Numeral.js currency formatting, Dayjs date calculations, and tabular layout.",
	data: {
		policyNumber: "POL-ID-2026-99081",
		insuredPerson: {
			fullName: "Aditya Wiratama",
			dob: "1988-04-12",
			idCard: "3171041204880003",
			occupation: "Principal Software Architect",
			address: "Jl. Sudirman Kav. 52-53, Jakarta Selatan",
		},
		policyPlan: "Executive Life & Critical Illness Protection Plus",
		commencementDate: "2026-01-01",
		maturityDate: "2056-01-01",
		currencyCode: "IDR",
		coverages: [
			{
				benefit: "Basic Term Life Protection",
				sumAssured: 2500000000,
				termYears: 30,
				waitingPeriodDays: 0,
			},
			{
				benefit: "Comprehensive Major Critical Illness (60 Conditions)",
				sumAssured: 1500000000,
				termYears: 30,
				waitingPeriodDays: 90,
			},
			{
				benefit: "Total & Permanent Disability (TPD)",
				sumAssured: 2000000000,
				termYears: 30,
				waitingPeriodDays: 180,
			},
			{
				benefit: "Accidental Death & Dismemberment Rider",
				sumAssured: 1000000000,
				termYears: 30,
				waitingPeriodDays: 0,
			},
		],
		annualPremium: 38500000,
		paymentMode: "Annual",
		beneficiaries: [
			{ name: "Dewi Lestari", relationship: "Spouse", sharePercentage: 70 },
			{ name: "Kenzo Wiratama", relationship: "Child", sharePercentage: 30 },
		],
	},
	html: `
<style>
	@page {
		size: A4;
		margin: 25mm 20mm;
		@top-left {
			content: "Aeterna Life Assurance Group";
			font-size: 8pt;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			color: #64748b;
		}
		@top-right {
			content: "Schedule of Insurance | Policy <%= policyNumber %>";
			font-size: 8pt;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			color: #64748b;
		}
		@bottom-center {
			content: "Page " counter(page) " of " counter(pages);
			font-size: 9pt;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			color: #94a3b8;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		line-height: 1.45;
		margin: 0;
	}

	.policy-banner {
		background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
		color: #ffffff;
		padding: 24px;
		border-radius: 8px;
		margin-bottom: 24px;
	}

	.policy-title {
		font-size: 20px;
		font-weight: 800;
		margin: 0 0 6px 0;
		letter-spacing: -0.3px;
	}

	.policy-plan {
		font-size: 14px;
		color: #a7f3d0;
		font-weight: 500;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin-bottom: 24px;
		font-size: 11px;
	}

	.info-box {
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 14px 16px;
		background: #f8fafc;
	}

	.info-box h3 {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #047857;
		margin: 0 0 10px 0;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 3px 0;
		border-bottom: 1px dashed #e2e8f0;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		color: #64748b;
	}

	.info-value {
		font-weight: 600;
		color: #0f172a;
	}

	table.coverage-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 11px;
		margin-bottom: 24px;
	}

	table.coverage-table th {
		background: #f1f5f9;
		color: #0f172a;
		padding: 10px 12px;
		font-weight: 700;
		text-align: left;
		border-top: 1px solid #cbd5e1;
		border-bottom: 2px solid #cbd5e1;
	}

	table.coverage-table tr {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	table.coverage-table td {
		padding: 10px 12px;
		border-bottom: 1px solid #e2e8f0;
	}

	.amount-col {
		text-align: right;
		font-family: "JetBrains Mono", monospace;
		font-weight: 600;
		color: #047857;
	}

	.premium-card {
		background: #f0fdf4;
		border: 1px solid #86efac;
		border-radius: 6px;
		padding: 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.premium-label {
		font-size: 12px;
		color: #166534;
		font-weight: 600;
	}

	.premium-amount {
		font-size: 18px;
		font-weight: 800;
		color: #15803d;
	}

	.signature-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30px;
		margin-top: 36px;
		font-size: 10px;
		color: #475569;
	}

	.sign-box {
		border-top: 1px solid #94a3b8;
		padding-top: 8px;
	}
</style>

<div class="policy-banner">
	<h1 class="policy-title">Policy Information & Schedule</h1>
	<div class="policy-plan"><%= policyPlan %></div>
</div>

<div class="info-grid">
	<div class="info-box">
		<h3>Insured Particulars</h3>
		<div class="info-row">
			<span class="info-label">Full Name:</span>
			<span class="info-value"><%= insuredPerson.fullName %></span>
		</div>
		<div class="info-row">
			<span class="info-label">National Identity No:</span>
			<span class="info-value"><%= insuredPerson.idCard %></span>
		</div>
		<div class="info-row">
			<span class="info-label">Date of Birth:</span>
			<span class="info-value"><%= dayjs(insuredPerson.dob).format("DD MMMM YYYY") %></span>
		</div>
		<div class="info-row">
			<span class="info-label">Occupation:</span>
			<span class="info-value"><%= insuredPerson.occupation %></span>
		</div>
	</div>

	<div class="info-box">
		<h3>Contract Details</h3>
		<div class="info-row">
			<span class="info-label">Policy Reference:</span>
			<span class="info-value"><%= policyNumber %></span>
		</div>
		<div class="info-row">
			<span class="info-label">Commencement Date:</span>
			<span class="info-value"><%= dayjs(commencementDate).format("DD MMMM YYYY") %></span>
		</div>
		<div class="info-row">
			<span class="info-label">Maturity Date:</span>
			<span class="info-value"><%= dayjs(maturityDate).format("DD MMMM YYYY") %></span>
		</div>
		<div class="info-row">
			<span class="info-label">Payment Mode:</span>
			<span class="info-value"><%= paymentMode %></span>
		</div>
	</div>
</div>

<div class="premium-card">
	<div>
		<div class="premium-label">Total Annual Premium (<%= paymentMode %>)</div>
		<div style="font-size: 11px; color: #4b5563;">Guaranteed level premium throughout contract term</div>
	</div>
	<div class="premium-amount"><%= currency(annualPremium, "IDR") %></div>
</div>

<h3 style="font-size: 13px; color: #0f172a; margin-bottom: 8px;">Schedule of Benefit Limits</h3>

<table class="coverage-table">
	<thead>
		<tr>
			<th>Covered Benefit</th>
			<th style="width: 80px; text-align: center;">Term</th>
			<th style="width: 100px; text-align: center;">Waiting Period</th>
			<th class="amount-col" style="width: 180px;">Sum Assured</th>
		</tr>
	</thead>
	<tbody>
		<% coverages.forEach(function(cov) { %>
		<tr>
			<td><strong><%= cov.benefit %></strong></td>
			<td style="text-align: center;"><%= cov.termYears %> Yrs</td>
			<td style="text-align: center;"><%= cov.waitingPeriodDays === 0 ? "None" : cov.waitingPeriodDays + " Days" %></td>
			<td class="amount-col"><%= currency(cov.sumAssured, "IDR") %></td>
		</tr>
		<% }); %>
	</tbody>
</table>

<div class="info-box" style="margin-bottom: 24px;">
	<h3>Designated Beneficiaries</h3>
	<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 11px;">
		<% beneficiaries.forEach(function(b) { %>
		<div>
			<strong><%= b.name %></strong> (<%= b.relationship %>) &mdash; 
			<span style="color: #047857; font-weight: 700;"><%= b.sharePercentage %>% Share</span>
		</div>
		<% }); %>
	</div>
</div>

<div class="signature-section">
	<div class="sign-box">
		Authorized Officer &mdash; Aeterna Life Assurance
	</div>
	<div class="sign-box">
		Policy Owner Signature & Acceptance
	</div>
</div>
`.trim(),
};
