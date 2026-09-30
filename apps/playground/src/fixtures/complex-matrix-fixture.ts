import type { PlaygroundFixture } from "../types/playground.js";

export const COMPLEX_MATRIX_FIXTURE: PlaygroundFixture = {
	id: "complex-matrix-table",
	title: "Complex Table (Non-Repeating Header, Rowspan/Colspan)",
	category: "templates",
	description:
		"Multi-page enterprise infrastructure matrix with complex multi-level non-repeating headers, colspan region banners, and automated rowspan continuation splitting seamlessly across page boundaries.",
	data: {
		matrixTitle: "Global Infrastructure Capacity & Compliance Matrix",
		reportingPeriod: "FY2026-Q3 Active Operational Telemetry",
		auditedBy: "Enterprise Systems Architecture Office",
		regions: [
			{
				name: "US-East (N. Virginia)",
				zone: "us-east-1",
				tier: "Tier-4 Core Facility",
				nodes: [
					{
						id: "use1-node-01",
						subsystem: "Ingress Router",
						cpu: 72,
						memory: "256 GB",
						iops: "480k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 3850,
					},
					{
						id: "use1-node-02",
						subsystem: "Compute Pool Alpha",
						cpu: 88,
						memory: "512 GB",
						iops: "920k",
						sla: "Nominal",
						auditStatus: "Certified",
						cost: 6420,
					},
					{
						id: "use1-node-03",
						subsystem: "Distributed NVMe Cache",
						cpu: 64,
						memory: "1,024 GB",
						iops: "1,450k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 8900,
					},
					{
						id: "use1-node-04",
						subsystem: "Disaster Recovery Gateway",
						cpu: 31,
						memory: "128 GB",
						iops: "180k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 2150,
					},
				],
			},
			{
				name: "US-West (Oregon)",
				zone: "us-west-2",
				tier: "Tier-3 Standard Facility",
				nodes: [
					{
						id: "usw2-node-01",
						subsystem: "Edge Accelerator",
						cpu: 61,
						memory: "256 GB",
						iops: "340k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 3400,
					},
					{
						id: "usw2-node-02",
						subsystem: "Compute Pool Beta",
						cpu: 79,
						memory: "512 GB",
						iops: "810k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 5900,
					},
					{
						id: "usw2-node-03",
						subsystem: "Object Storage Shard",
						cpu: 52,
						memory: "384 GB",
						iops: "560k",
						sla: "Nominal",
						auditStatus: "Certified",
						cost: 4800,
					},
					{
						id: "usw2-node-04",
						subsystem: "Internal RPC Bus",
						cpu: 44,
						memory: "128 GB",
						iops: "290k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 2300,
					},
				],
			},
			{
				name: "EU-Central (Frankfurt)",
				zone: "eu-central-1",
				tier: "Tier-4 Sovereign Enclave",
				nodes: [
					{
						id: "euc1-node-01",
						subsystem: "GDPR Cryptographic Vault",
						cpu: 49,
						memory: "512 GB",
						iops: "620k",
						sla: "Optimal",
						auditStatus: "Audited ISO27001",
						cost: 7200,
					},
					{
						id: "euc1-node-02",
						subsystem: "EU Banking Ingress",
						cpu: 76,
						memory: "256 GB",
						iops: "510k",
						sla: "Optimal",
						auditStatus: "Audited SOC2",
						cost: 4100,
					},
					{
						id: "euc1-node-03",
						subsystem: "Compute Pool Gamma",
						cpu: 84,
						memory: "768 GB",
						iops: "1,120k",
						sla: "Nominal",
						auditStatus: "Audited ISO27001",
						cost: 7800,
					},
					{
						id: "euc1-node-04",
						subsystem: "Sovereign Backup Sync",
						cpu: 38,
						memory: "256 GB",
						iops: "220k",
						sla: "Optimal",
						auditStatus: "Audited ISO27001",
						cost: 3100,
					},
				],
			},
			{
				name: "AP-East (Tokyo)",
				zone: "ap-northeast-1",
				tier: "Tier-4 Ultra-Low Latency",
				nodes: [
					{
						id: "apne1-node-01",
						subsystem: "Tokyo Stock Ingress",
						cpu: 82,
						memory: "256 GB",
						iops: "890k",
						sla: "Optimal",
						auditStatus: "Audited PCI-DSS",
						cost: 5200,
					},
					{
						id: "apne1-node-02",
						subsystem: "High Frequency Engine",
						cpu: 91,
						memory: "512 GB",
						iops: "1,680k",
						sla: "Warning",
						auditStatus: "Audited PCI-DSS",
						cost: 9400,
					},
					{
						id: "apne1-node-03",
						subsystem: "Analytics Pipeline",
						cpu: 68,
						memory: "512 GB",
						iops: "740k",
						sla: "Optimal",
						auditStatus: "Audited SOC2",
						cost: 6100,
					},
					{
						id: "apne1-node-04",
						subsystem: "Regional Failover Ring",
						cpu: 29,
						memory: "128 GB",
						iops: "150k",
						sla: "Optimal",
						auditStatus: "Audited PCI-DSS",
						cost: 2400,
					},
				],
			},
			{
				name: "AP-Southeast (Singapore)",
				zone: "ap-southeast-1",
				tier: "Tier-3 Standard Facility",
				nodes: [
					{
						id: "apse1-node-01",
						subsystem: "ASEAN Gateway Cluster",
						cpu: 58,
						memory: "256 GB",
						iops: "410k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 3600,
					},
					{
						id: "apse1-node-02",
						subsystem: "Compute Pool Delta",
						cpu: 73,
						memory: "512 GB",
						iops: "670k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 5400,
					},
					{
						id: "apse1-node-03",
						subsystem: "Regional Search Index",
						cpu: 65,
						memory: "384 GB",
						iops: "590k",
						sla: "Nominal",
						auditStatus: "Certified",
						cost: 4600,
					},
					{
						id: "apse1-node-04",
						subsystem: "Replication Splicer",
						cpu: 35,
						memory: "128 GB",
						iops: "190k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 2200,
					},
				],
			},
			{
				name: "SA-East (São Paulo)",
				zone: "sa-east-1",
				tier: "Tier-3 Edge Facility",
				nodes: [
					{
						id: "sae1-node-01",
						subsystem: "Latin America Ingress",
						cpu: 63,
						memory: "256 GB",
						iops: "360k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 3900,
					},
					{
						id: "sae1-node-02",
						subsystem: "Compute Pool Epsilon",
						cpu: 81,
						memory: "512 GB",
						iops: "720k",
						sla: "Nominal",
						auditStatus: "Certified",
						cost: 5800,
					},
					{
						id: "sae1-node-03",
						subsystem: "Regional Datastore",
						cpu: 57,
						memory: "256 GB",
						iops: "440k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 4200,
					},
					{
						id: "sae1-node-04",
						subsystem: "Border Gateway Protocol",
						cpu: 33,
						memory: "128 GB",
						iops: "160k",
						sla: "Optimal",
						auditStatus: "Certified",
						cost: 2350,
					},
				],
			},
		],
		complianceAudits: [
			{
				caseId: "AUD-2026-081",
				scope: "Cryptographic Key Rotation & Enclave Attestation",
				framework: "ISO/IEC 27001:2022 §A.10.1",
				finding:
					"Hardware Security Modules (HSM) across EU-Central and US-East passed automated attestation. Zero unencrypted key materials detected in ephemeral volume snapshots.",
				status: "Compliant",
				remediationDeadline: "Q4 2026",
			},
			{
				caseId: "AUD-2026-094",
				scope: "Cross-Border PII Data Residency & Ingress Sharding",
				framework: "GDPR Art. 44-49 / EU-US DPF",
				finding:
					"All telemetry logs originating in EU-Central are tokenized within sovereign enclaves before cross-region replication to US-West analytics cluster.",
				status: "Verified",
				remediationDeadline: "Completed",
			},
			{
				caseId: "AUD-2026-102",
				scope: "High Frequency Trading Co-location & Tail Latency SLAs",
				framework: "MiFID II RTS 25 Clock Synchronization",
				finding:
					"PTP (Precision Time Protocol) drift in Tokyo apne1-node-02 measured under 42 nanoseconds. High CPU load nominal under peak market open.",
				status: "Under Review",
				remediationDeadline: "Q1 2027",
			},
			{
				caseId: "AUD-2026-118",
				scope: "Disaster Recovery RPO/RTO Multi-Region Failover Test",
				framework: "SOC2 Type II Availability Trust Criteria",
				finding:
					"Full simulated loss of primary US-East ingress router resulted in automated BGP route withdrawal and live session migration to US-West in 4.2 seconds (SLA target: < 15.0s).",
				status: "Compliant",
				remediationDeadline: "Completed",
			},
			{
				caseId: "AUD-2026-125",
				scope: "Zero-Trust Service Mesh mTLS Certificate Renewal Pipeline",
				framework: "NIST SP 800-207 Zero Trust Architecture",
				finding:
					"Automated Envoy sidecar mTLS short-lived certificates (24-hour TTL) verified across 100% of cluster nodes with SPIFFE/SPIRE workload identification.",
				status: "Compliant",
				remediationDeadline: "Continuous",
			},
			{
				caseId: "AUD-2026-140",
				scope: "Cold Storage Backup Immutability & Ransomware Airgap",
				framework: "SEC Rule 17a-4(f) WORM Compliance",
				finding:
					"Read-only ledger replication validated across SA-East and Singapore secondary air-gapped tape and cloud vault storage pools.",
				status: "Certified",
				remediationDeadline: "Completed",
			},
		],
	},
	html: `
<style>
	@page {
		size: letter landscape;
		margin: 16mm 14mm;
		@top-center {
			content: "Global Infrastructure Capacity & Compliance Matrix";
			font-size: 8pt;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			color: #64748b;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		@bottom-left {
			content: "Internal Operational Telemetry — Non-Repeating Header Matrix";
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
		color: #0f172a;
		line-height: 1.4;
		margin: 0;
	}

	.header-block {
		border-bottom: 2px solid #0284c7;
		padding-bottom: 10px;
		margin-bottom: 16px;
	}

	.header-title {
		font-size: 20px;
		font-weight: 800;
		color: #0f172a;
		margin: 0 0 4px 0;
	}

	.header-meta {
		font-size: 11px;
		color: #64748b;
		display: flex;
		gap: 20px;
	}

	table.matrix-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 10px;
		color: #0f172a;
	}

	/* Non-repeating table header & footer rule (displays once in source order) */
	thead.no-repeat,
	tfoot.no-repeat {
		display: table-row-group;
	}

	table.matrix-table tr {
		break-inside: avoid;
		page-break-inside: avoid;
	}

	table.matrix-table th,
	table.matrix-table td {
		border: 1px solid #cbd5e1;
		padding: 7px 9px;
		text-align: left;
	}

	table.matrix-table th {
		background: #f1f5f9;
		color: #0f172a;
		font-weight: 700;
		vertical-align: middle;
	}

	table.matrix-table th.metric-group {
		background: #e2e8f0;
		text-align: center;
		letter-spacing: 0.5px;
		font-size: 9px;
		text-transform: uppercase;
	}

	td.facility-cell {
		background: #f8fafc;
		vertical-align: top;
		border-right: 2px solid #94a3b8;
		padding: 10px 10px;
	}

	.facility-name {
		font-size: 11px;
		font-weight: 700;
		color: #0369a1;
	}

	.facility-sub {
		font-size: 9px;
		color: #64748b;
		margin-top: 3px;
	}

	.badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 8px;
		font-weight: 700;
	}

	.badge-optimal { background: #dcfce7; color: #15803d; }
	.badge-nominal { background: #dbeafe; color: #1d4ed8; }
	.badge-warning { background: #fef3c7; color: #b45309; }

	.num-col {
		text-align: right;
		font-family: "JetBrains Mono", monospace;
	}

	.region-banner-cell {
		background: #0f172a;
		color: #ffffff;
		font-size: 10px;
		font-weight: 700;
		padding: 6px 10px;
		letter-spacing: 0.5px;
	}

	.region-pill {
		display: inline-block;
		background: #0284c7;
		color: #ffffff;
		padding: 1px 6px;
		border-radius: 3px;
		font-size: 8px;
		margin-right: 8px;
		font-weight: 800;
	}

	/* Colspan Split-Page Case section styling */
	.section-divider-row td {
		background: #0284c7;
		color: #ffffff;
		font-size: 9.5px;
		font-weight: 700;
		padding: 6px 10px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.audit-row td {
		background: #ffffff;
		padding: 7px 9px;
		vertical-align: top;
	}

	.audit-row:nth-child(even) td {
		background: #f8fafc;
	}

	.audit-case-id {
		font-family: "JetBrains Mono", monospace;
		font-size: 9.5px;
		font-weight: 700;
		color: #0284c7;
	}

	.audit-framework {
		font-size: 8px;
		color: #64748b;
		margin-top: 2px;
	}

	.audit-scope-title {
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 2px;
	}

	.audit-finding-text {
		color: #334155;
		font-size: 9px;
		line-height: 1.35;
	}

	.audit-meta-cell {
		text-align: right;
		font-size: 8.5px;
	}

	.executive-row td {
		background: #f1f5f9;
		padding: 8px 10px;
		font-size: 9px;
		line-height: 1.4;
	}

	.attestation-cell {
		background: #f0fdf4 !important;
		border-top: 2px solid #16a34a !important;
		color: #166534;
		font-size: 9px;
		padding: 7px 10px;
	}

	table.matrix-table tfoot td {
		background: #f1f5f9;
		border-top: 2px solid #0f172a;
		font-weight: 700;
		padding: 9px;
	}
</style>

<div class="header-block">
	<h1 class="header-title"><%= matrixTitle %></h1>
	<div class="header-meta">
		<div>Period: <strong><%= reportingPeriod %></strong></div>
		<div>Audited by: <strong><%= auditedBy %></strong></div>
		<div>Header Policy: <strong style="color: #0284c7;">Non-Repeating thead</strong></div>
		<div>Colspan Case: <strong style="color: #0284c7;">Multi-Row Colspan Page Splitting</strong></div>
	</div>
</div>

<%
	let totalCost = 0;
	let totalNodes = 0;
	let sumCpu = 0;
	regions.forEach(function(r) {
		r.nodes.forEach(function(n) {
			totalCost += n.cost;
			sumCpu += n.cpu;
			totalNodes++;
		});
	});
	let avgCpu = Math.round(sumCpu / totalNodes);
%>

<table class="matrix-table no-repeat-header">
	<thead class="no-repeat" data-repeat="false">
		<tr>
			<th rowspan="2" style="width: 160px;">Region & Facility Enclave</th>
			<th rowspan="2" style="width: 120px;">Cluster Node</th>
			<th rowspan="2" style="width: 130px;">Subsystem</th>
			<th colspan="3" class="metric-group">Performance & Resource Telemetry</th>
			<th colspan="2" class="metric-group">Compliance & Reliability</th>
			<th rowspan="2" class="num-col" style="width: 100px;">OpEx / Mo</th>
		</tr>
		<tr>
			<th class="num-col" style="width: 75px;">CPU Load</th>
			<th class="num-col" style="width: 85px;">Memory</th>
			<th class="num-col" style="width: 80px;">IOPS</th>
			<th style="width: 85px; text-align: center;">SLA Status</th>
			<th style="width: 110px; text-align: center;">Audit Clearance</th>
		</tr>
	</thead>
	<tbody>
		<% regions.forEach(function(region) { %>
			<tr class="region-banner-row">
				<td colspan="9" class="region-banner-cell">
					<span class="region-pill"><%= region.zone %></span>
					<%= region.name %> &bull; <%= region.tier %> (<%= region.nodes.length %> Nodes Configured)
				</td>
			</tr>
			<% region.nodes.forEach(function(node, idx) { %>
				<tr>
					<% if (idx === 0) { %>
						<td rowspan="<%= region.nodes.length %>" class="facility-cell">
							<div class="facility-name"><%= region.name %></div>
							<div class="facility-sub"><%= region.zone %></div>
							<div class="facility-sub" style="color: #0284c7; font-weight: 600;"><%= region.tier %></div>
						</td>
					<% } %>
					<td><strong><%= node.id %></strong></td>
					<td><%= node.subsystem %></td>
					<td class="num-col"><%= node.cpu %>%</td>
					<td class="num-col"><%= node.memory %></td>
					<td class="num-col"><%= node.iops %></td>
					<td style="text-align: center;">
						<span class="badge badge-<%= node.sla.toLowerCase() %>"><%= node.sla %></span>
					</td>
					<td style="text-align: center; font-size: 9px;"><%= node.auditStatus %></td>
					<td class="num-col"><%= currency(node.cost, "USD") %></td>
				</tr>
			<% }); %>
		<% }); %>
		<!-- Colspan Split-Page Case: Multi-Row Audit & Compliance Log -->
		<tr class="section-divider-row">
			<td colspan="9">
				Section II &bull; Enterprise Compliance Audit &amp; SLA Incident Remediation Log (Colspan Split-Page Case)
			</td>
		</tr>
		<% complianceAudits.forEach(function(item) { %>
			<tr class="audit-row">
				<td colspan="2" class="audit-scope-cell">
					<div class="audit-case-id"><%= item.caseId %></div>
					<div class="audit-framework"><%= item.framework %></div>
				</td>
				<td colspan="5" class="audit-finding-cell">
					<div class="audit-scope-title"><%= item.scope %></div>
					<div class="audit-finding-text"><%= item.finding %></div>
				</td>
				<td colspan="2" class="audit-meta-cell">
					<div><span class="badge badge-optimal"><%= item.status %></span></div>
					<div style="font-size: 8px; color: #64748b; margin-top: 4px;">Deadline: <%= item.remediationDeadline %></div>
				</td>
			</tr>
		<% }); %>
		<tr class="executive-row">
			<td colspan="3"><strong>Executive Remediation Action Plan</strong></td>
			<td colspan="6">
				Automated runbooks configured for immediate failover. All nodes verified under SOC2 and ISO27001 continuous compliance telemetry agents. Zero active critical severity CVEs identified across kernel baseline v6.8.4-hardened.
			</td>
		</tr>
		<tr>
			<td colspan="9" class="attestation-cell">
				<strong>Compliance Sign-off:</strong> Attested by Enterprise Systems Architecture Office &amp; Global Security Assurance Council.
			</td>
		</tr>
	</tbody>
	<tfoot class="no-repeat" data-repeat="false">
		<tr>
			<td colspan="3"><strong>Enterprise Total (<%= regions.length %> Regions &bull; <%= totalNodes %> Nodes)</strong></td>
			<td class="num-col"><strong><%= avgCpu %>% avg</strong></td>
			<td class="num-col"><strong>Cluster Pool</strong></td>
			<td class="num-col"><strong>Distributed</strong></td>
			<td colspan="2" style="text-align: center; color: #15803d;"><strong>99.995% SLA Target Met</strong></td>
			<td class="num-col"><strong><%= currency(totalCost, "USD") %></strong></td>
		</tr>
	</tfoot>
</table>
`.trim(),
};
