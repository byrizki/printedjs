import type { PlaygroundFixture } from "../types/playground.js";

export const REPORT_FIXTURE: PlaygroundFixture = {
	id: "multi-page-report",
	title: "Multi-Page Financial Report (Dynamic Table)",
	category: "templates",
	description:
		"Multi-page operational ledger with repeated table headers, running page headers via string-set, status tags, and summary statistics.",
	data: {
		reportTitle: "Q3 Fiscal Operations & Capital Ledger",
		department: "Cloud Engineering & Platform Infrastructure",
		generatedAt: "2026-09-29T08:00:00Z",
		auditor: "Deloitte & Touche LLP",
		fiscalQuarter: "FY2026-Q3",
		budgetAllocated: 2450000,
		transactions: Array.from({ length: 45 }, (_, idx) => {
			const id = idx + 1;
			const categories = ["Compute", "Storage", "Bandwidth", "Licensing", "Consulting"];
			const statuses = ["Approved", "Audited", "Pending"];
			const costs = [3200, 850, 14200, 5600, 9800, 21000, 4300, 1850];
			const cat = categories[idx % categories.length]!;
			const status = statuses[idx % statuses.length]!;
			const cost = costs[idx % costs.length]! * (1 + ((idx * 7) % 5) * 0.1);
			return {
				id: `TX-${1000 + id}`,
				date: `2026-08-${String((id % 28) + 1).padStart(2, "0")}`,
				category: cat,
				description: `${cat} Allocation Cluster node-${id}.core.prod`,
				amount: Math.round(cost),
				status,
			};
		}),
	},
	html: `
<style>
	@page {
		size: letter;
		margin: 22mm 20mm;
		@top-center {
			content: string(heading);
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		@bottom-left {
			content: "Internal Report &mdash; " string(quarter);
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
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		line-height: 1.4;
		margin: 0;
	}

	.report-header {
		break-inside: avoid;
		page-break-inside: avoid;
		string-set: heading content(text), quarter "<%= fiscalQuarter %>";
		border-bottom: 3px solid #3b82f6;
		padding-bottom: 12px;
		margin-bottom: 20px;
	}

	.report-title {
		font-size: 22px;
		font-weight: 800;
		color: #1e3a8a;
		margin: 0 0 4px 0;
	}

	.report-meta {
		font-size: 11px;
		color: #64748b;
		display: flex;
		gap: 20px;
	}

	.stats-row {
		break-inside: avoid;
		page-break-inside: avoid;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 12px 14px;
	}

	.stat-title {
		font-size: 10px;
		text-transform: uppercase;
		font-weight: 700;
		color: #64748b;
		letter-spacing: 0.5px;
	}

	.stat-val {
		font-size: 18px;
		font-weight: 800;
		color: #0f172a;
		margin-top: 4px;
	}

	table.ledger-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 10px;
		color: #1e293b;
	}

	table.ledger-table thead {
		display: table-header-group;
	}

	table.ledger-table th {
		background: #f1f5f9;
		color: #0f172a;
		padding: 8px 10px;
		border-top: 1px solid #cbd5e1;
		border-bottom: 2px solid #94a3b8;
		text-align: left;
		font-weight: 700;
	}

	table.ledger-table tr {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	table.ledger-table td {
		padding: 8px 10px;
		border-bottom: 1px solid #e2e8f0;
		color: #1e293b;
	}

	table.ledger-table tr:nth-child(even) td {
		background: #fcfcfd;
	}

	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 9px;
		font-weight: 600;
	}

	.badge-approved { background: #dcfce7; color: #15803d; }
	.badge-audited { background: #dbeafe; color: #1d4ed8; }
	.badge-pending { background: #fef3c7; color: #b45309; }

	.num-col {
		text-align: right;
		font-family: monospace;
	}
</style>

<div class="report-header">
	<h1 class="report-title"><%= reportTitle %></h1>
	<div class="report-meta">
		<div>Division: <strong><%= department %></strong></div>
		<div>Period: <strong><%= fiscalQuarter %></strong></div>
		<div>Audited by: <strong><%= auditor %></strong></div>
	</div>
</div>

<%
	let totalAmount = 0;
	transactions.forEach(function(tx) {
		totalAmount += tx.amount;
	});
	let burnRate = Math.round((totalAmount / budgetAllocated) * 100);
%>

<div class="stats-row">
	<div class="stat-card">
		<div class="stat-title">Allocated Budget</div>
		<div class="stat-val"><%= currency(budgetAllocated, "USD") %></div>
	</div>
	<div class="stat-card">
		<div class="stat-title">Total Disbursed</div>
		<div class="stat-val"><%= currency(totalAmount, "USD") %></div>
	</div>
	<div class="stat-card">
		<div class="stat-title">Quarter Burn Rate</div>
		<div class="stat-val"><%= burnRate %>%</div>
	</div>
</div>

<table class="ledger-table">
	<thead>
		<tr>
			<th style="width: 70px;">Tx ID</th>
			<th style="width: 80px;">Date</th>
			<th style="width: 90px;">Category</th>
			<th>Description</th>
			<th style="width: 70px; text-align: center;">Status</th>
			<th class="num-col" style="width: 90px;">Amount</th>
		</tr>
	</thead>
	<tbody>
		<% transactions.forEach(function(tx) { %>
		<tr>
			<td><strong><%= tx.id %></strong></td>
			<td><%= tx.date %></td>
			<td><%= tx.category %></td>
			<td><%= tx.description %></td>
			<td style="text-align: center;">
				<span class="badge badge-<%= tx.status.toLowerCase() %>"><%= tx.status %></span>
			</td>
			<td class="num-col"><%= currency(tx.amount, "USD") %></td>
		</tr>
		<% }); %>
	</tbody>
</table>
`.trim(),
};
