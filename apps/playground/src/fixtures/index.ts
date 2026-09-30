import type { PlaygroundFixture } from "../types/playground.js";
import { CERTIFICATE_FIXTURE } from "./certificate-fixture.js";
import { COMPLEX_MATRIX_FIXTURE } from "./complex-matrix-fixture.js";
import { INVOICE_FIXTURE } from "./invoice-fixture.js";
import { PAGED_MEDIA_FIXTURES } from "./paged-media-fixtures.js";
import { POLICY_FIXTURE } from "./policy-fixture.js";
import { REPORT_FIXTURE } from "./report-fixture.js";
import { ROWSPAN_EXPANDING_FIXTURE } from "./rowspan-expanding-fixture.js";

export const FIXTURE_CATALOG: readonly PlaygroundFixture[] = [
	INVOICE_FIXTURE,
	ROWSPAN_EXPANDING_FIXTURE,
	COMPLEX_MATRIX_FIXTURE,
	POLICY_FIXTURE,
	REPORT_FIXTURE,
	CERTIFICATE_FIXTURE,
	...PAGED_MEDIA_FIXTURES,
];

export {
	CERTIFICATE_FIXTURE,
	COMPLEX_MATRIX_FIXTURE,
	INVOICE_FIXTURE,
	PAGED_MEDIA_FIXTURES,
	POLICY_FIXTURE,
	REPORT_FIXTURE,
	ROWSPAN_EXPANDING_FIXTURE,
};
