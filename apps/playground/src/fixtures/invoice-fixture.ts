import type { PlaygroundFixture } from "../types/playground.js";

export const INVOICE_FIXTURE: PlaygroundFixture = {
	id: "invoice-dynamic",
	title: "Corporate Invoice (Eta / EJS)",
	category: "templates",
	description:
		"Dynamic business invoice rendered with Eta/EJS template syntax, item iteration, calculated subtotals, tax, and currency helpers.",
	data: {
		invoiceNumber: "INV-2026-0842",
		issueDate: "2026-09-29",
		dueDate: "2026-10-29",
		sender: {
			company: "Apex Cloud Technologies, Inc.",
			address: "100 Montgomery St, Suite 2100",
			city: "San Francisco, CA 94104",
			email: "billing@apexcloud.io",
			taxId: "US-84920412",
		},
		recipient: {
			name: "Sarah Jenkins",
			company: "Global Nexus Logistics Ltd.",
			address: "450 Canary Wharf, Floor 14",
			city: "London E14 5AA, United Kingdom",
			email: "accounts@globalnexus.co.uk",
		},
		items: [
			{
				id: 1,
				description: "Enterprise Cloud Infrastructure Cluster (Q3 Reserve)",
				quantity: 3,
				rate: 1450,
			},
			{
				id: 2,
				description: "High-Throughput Pagination & PDF Rendering Engine License",
				quantity: 1,
				rate: 3200,
			},
			{
				id: 3,
				description: "Dedicated Solution Architecture & Integration Support (Hours)",
				quantity: 16,
				rate: 175,
			},
			{
				id: 4,
				description: "Automated Document Validation & Snapshot Pipeline Setup",
				quantity: 1,
				rate: 1200,
			},
		],
		taxRate: 0.1,
		discountRate: 0.05,
		notes:
			"Payment is due within 30 days of invoice date. Electronic wire transfer preferred.",
		bankDetails: {
			bank: "Silicon Valley Commercial Bank",
			accountName: "Apex Cloud Tech Inc.",
			iban: "US44SVBK98234120938472",
			swift: "SVBKUS33XXX",
		},
	},
	html: `
<style>
	@page {
		size: A4;
		margin: 20mm;
		@bottom-left {
			content: "Printedjs Document Generation Engine";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-right {
			content: "Page " counter(page) " of " counter(pages);
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		color: #1e293b;
		line-height: 1.5;
		margin: 0;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 2px solid #0284c7;
		padding-bottom: 20px;
		margin-bottom: 24px;
	}

	.brand-name {
		font-size: 22px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.5px;
	}

	.brand-sub {
		font-size: 11px;
		color: #64748b;
		margin-top: 4px;
	}

	.invoice-title-block {
		text-align: right;
	}

	.invoice-title {
		font-size: 24px;
		font-weight: 800;
		color: #0284c7;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		margin: 0;
	}

	.invoice-number {
		font-size: 12px;
		font-weight: 600;
		color: #475569;
		margin-top: 4px;
	}

	.parties-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		margin-bottom: 28px;
		font-size: 11px;
	}

	.party-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 14px 16px;
	}

	.party-label {
		font-weight: 700;
		text-transform: uppercase;
		color: #0284c7;
		font-size: 10px;
		letter-spacing: 0.5px;
		margin-bottom: 6px;
	}

	.party-name {
		font-weight: 700;
		font-size: 12px;
		color: #0f172a;
		margin-bottom: 4px;
	}

	.dates-bar {
		display: flex;
		gap: 24px;
		background: #0f172a;
		color: #f8fafc;
		padding: 10px 16px;
		border-radius: 6px;
		font-size: 11px;
		margin-bottom: 24px;
	}

	.date-item span {
		color: #94a3b8;
		margin-right: 6px;
	}

	table.invoice-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 24px;
		font-size: 11px;
	}

	table.invoice-table th {
		background: #f1f5f9;
		color: #334155;
		text-transform: uppercase;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.5px;
		padding: 10px 12px;
		border-top: 1px solid #cbd5e1;
		border-bottom: 2px solid #cbd5e1;
		text-align: left;
	}

	table.invoice-table tr {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	table.invoice-table td {
		padding: 12px;
		border-bottom: 1px solid #e2e8f0;
		color: #334155;
	}

	table.invoice-table tr:nth-child(even) td {
		background: #fafafa;
	}

	.text-right {
		text-align: right;
	}

	.summary-section {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 30px;
	}

	.summary-table {
		width: 280px;
		font-size: 11px;
		border-collapse: collapse;
	}

	.summary-table td {
		padding: 6px 10px;
	}

	.summary-table .total-row td {
		border-top: 2px solid #0284c7;
		font-size: 13px;
		font-weight: 800;
		color: #0f172a;
		padding-top: 10px;
	}

	.footer-details {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		border-top: 1px solid #e2e8f0;
		padding-top: 16px;
		font-size: 10px;
		color: #64748b;
	}

	.footer-details h4 {
		margin: 0 0 4px 0;
		color: #334155;
		font-size: 10px;
		text-transform: uppercase;
	}
</style>

<div class="header">
	<div>
		<div class="brand-name"><%= sender.company %></div>
		<div class="brand-sub"><%= sender.address %>, <%= sender.city %> | <%= sender.email %></div>
	</div>
	<div class="invoice-title-block">
		<h1 class="invoice-title">Invoice</h1>
		<div class="invoice-number"># <%= invoiceNumber %></div>
	</div>
</div>

<div class="dates-bar">
	<div class="date-item">
		<span>Issue Date:</span>
		<strong><%= dayjs(issueDate).format("MMM DD, YYYY") %></strong>
	</div>
	<div class="date-item">
		<span>Payment Due:</span>
		<strong><%= dayjs(dueDate).format("MMM DD, YYYY") %></strong>
	</div>
	<div class="date-item">
		<span>Tax Identification:</span>
		<strong><%= sender.taxId %></strong>
	</div>
</div>

<div class="parties-grid">
	<div class="party-card">
		<div class="party-label">Billed By</div>
		<div class="party-name"><%= sender.company %></div>
		<div><%= sender.address %></div>
		<div><%= sender.city %></div>
		<div>Email: <%= sender.email %></div>
	</div>
	<div class="party-card">
		<div class="party-label">Billed To</div>
		<div class="party-name"><%= recipient.name %></div>
		<div><%= recipient.company %></div>
		<div><%= recipient.address %></div>
		<div><%= recipient.city %></div>
	</div>
</div>

<%
	let subtotal = 0;
	items.forEach(function(item) {
		subtotal += item.quantity * item.rate;
	});
	let discount = subtotal * (discountRate || 0);
	let taxableAmount = subtotal - discount;
	let taxAmount = taxableAmount * (taxRate || 0);
	let grandTotal = taxableAmount + taxAmount;
%>

<table class="invoice-table">
	<thead>
		<tr>
			<th style="width: 40px;">#</th>
			<th>Description</th>
			<th class="text-right" style="width: 60px;">Qty</th>
			<th class="text-right" style="width: 100px;">Unit Rate</th>
			<th class="text-right" style="width: 110px;">Amount</th>
		</tr>
	</thead>
	<tbody>
		<% items.forEach(function(item, index) { 
			let lineTotal = item.quantity * item.rate;
		%>
		<tr>
			<td><%= index + 1 %></td>
			<td><strong><%= item.description %></strong></td>
			<td class="text-right"><%= item.quantity %></td>
			<td class="text-right"><%= currency(item.rate, "USD") %></td>
			<td class="text-right"><%= currency(lineTotal, "USD") %></td>
		</tr>
		<% }); %>
	</tbody>
</table>

<div class="summary-section">
	<table class="summary-table">
		<tr>
			<td>Subtotal:</td>
			<td class="text-right"><%= currency(subtotal, "USD") %></td>
		</tr>
		<tr>
			<td>Discount (<%= Math.round(discountRate * 100) %>%):</td>
			<td class="text-right">-<%= currency(discount, "USD") %></td>
		</tr>
		<tr>
			<td>Estimated Tax (<%= Math.round(taxRate * 100) %>%):</td>
			<td class="text-right"><%= currency(taxAmount, "USD") %></td>
		</tr>
		<tr class="total-row">
			<td>Total Due:</td>
			<td class="text-right"><%= currency(grandTotal, "USD") %></td>
		</tr>
	</table>
</div>

<div class="footer-details">
	<div>
		<h4>Remittance Instructions</h4>
		<div>Bank: <%= bankDetails.bank %></div>
		<div>Account: <%= bankDetails.accountName %></div>
		<div>IBAN: <%= bankDetails.iban %></div>
		<div>SWIFT/BIC: <%= bankDetails.swift %></div>
	</div>
	<div>
		<h4>Terms & Conditions</h4>
		<p style="margin: 0;"><%= notes %></p>
	</div>
</div>
`.trim(),
};
