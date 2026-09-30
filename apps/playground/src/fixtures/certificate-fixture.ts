import type { PlaygroundFixture } from "../types/playground.js";

export const CERTIFICATE_FIXTURE: PlaygroundFixture = {
	id: "certificate-landscape",
	title: "Certificate of Completion (Landscape)",
	category: "templates",
	description:
		"Landscape A4/Letter certificate with dynamic recipient data, issue date formatting, and decorative CSS borders.",
	data: {
		recipientName: "Dr. Elena Rostova",
		courseName: "Advanced Distributed Systems & High-Fidelity Web Document Layouts",
		issuer: "Printedjs Engineering Institute",
		signatoryName: "Prof. Arthur Pendelton",
		signatoryRole: "Dean of Computer Science",
		issueDate: "2026-09-29",
		certificateId: "CERT-PM-9921-X4",
		grade: "Distinction with Honors",
	},
	html: `
<style>
	@page {
		size: letter landscape;
		margin: 15mm;
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif;
		color: #1e293b;
		margin: 0;
		padding: 0;
	}

	.outer-border {
		border: 4px double #0284c7;
		padding: 24px;
		height: 90%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		text-align: center;
		background: #ffffff;
		box-sizing: border-box;
	}

	.inner-frame {
		border: 1px solid #94a3b8;
		padding: 32px;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-sizing: border-box;
	}

	.institute-title {
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 4px;
		color: #0284c7;
		font-weight: 700;
	}

	.main-heading {
		font-size: 32px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: 1px;
		text-transform: uppercase;
		margin: 12px 0 4px 0;
	}

	.sub-heading {
		font-size: 13px;
		color: #64748b;
		font-style: italic;
	}

	.recipient {
		font-size: 30px;
		font-weight: 700;
		color: #0369a1;
		border-bottom: 2px solid #0284c7;
		display: inline-block;
		padding: 0 40px 6px 40px;
		margin: 18px auto;
	}

	.course-description {
		font-size: 14px;
		color: #334155;
		max-width: 650px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.course-title {
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
	}

	.signatures-row {
		display: flex;
		justify-content: space-around;
		align-items: flex-end;
		margin-top: 30px;
		padding: 0 40px;
	}

	.sign-col {
		width: 200px;
		text-align: center;
	}

	.sign-line {
		border-top: 1px solid #475569;
		margin-top: 12px;
		padding-top: 6px;
		font-size: 11px;
		color: #475569;
	}

	.sign-name {
		font-weight: 700;
		color: #0f172a;
	}

	.cert-meta {
		font-size: 10px;
		color: #94a3b8;
		display: flex;
		justify-content: space-between;
		margin-top: 16px;
		padding: 0 10px;
	}
</style>

<div class="outer-border">
	<div class="inner-frame">
		<div>
			<div class="institute-title"><%= issuer %></div>
			<h1 class="main-heading">Certificate of Mastery</h1>
			<div class="sub-heading">This official certificate is proudly awarded to</div>
			<div class="recipient"><%= recipientName %></div>
		</div>

		<div class="course-description">
			In formal recognition of having successfully completed with distinction the intensive program in
			<div class="course-title"><%= courseName %></div>
			<div>Standing: <strong><%= grade %></strong></div>
		</div>

		<div>
			<div class="signatures-row">
				<div class="sign-col">
					<div style="font-family: serif; font-size: 18px; font-style: italic; color: #0369a1;">A. Pendelton</div>
					<div class="sign-line">
						<div class="sign-name"><%= signatoryName %></div>
						<div><%= signatoryRole %></div>
					</div>
				</div>
				<div class="sign-col">
					<div style="font-weight: 700; color: #0284c7; font-size: 14px;">VALIDATED SEAL</div>
					<div class="sign-line">
						<div class="sign-name"><%= dayjs(issueDate).format("MMMM DD, YYYY") %></div>
						<div>Date of Issuance</div>
					</div>
				</div>
			</div>

			<div class="cert-meta">
				<div>Credential Identifier: <strong><%= certificateId %></strong></div>
				<div>Printedjs Verified Digital Credential</div>
			</div>
		</div>
	</div>
</div>
`.trim(),
};
