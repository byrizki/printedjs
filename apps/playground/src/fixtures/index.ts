import type { PlaygroundFixture } from "../types/playground.js";
import { BOOK_SHOWCASE_FIXTURE } from "./book-showcase-fixture.js";
import { CERTIFICATE_FIXTURE } from "./certificate-fixture.js";
import { COMPLEX_MATRIX_FIXTURE } from "./complex-matrix-fixture.js";
import { INVOICE_FIXTURE } from "./invoice-fixture.js";
import { PAGED_MEDIA_FIXTURES } from "./paged-media-fixtures.js";
import { PHASE_17_COUNTERS_FIXTURE } from "./phase-17-counters-fixture.js";
import { PHASE_18_MAGAZINE_FIXTURE } from "./phase-18-magazine-fixture.js";
import { POLICY_FIXTURE } from "./policy-fixture.js";
import { REPORT_FIXTURE } from "./report-fixture.js";
import { ROWSPAN_EXPANDING_FIXTURE } from "./rowspan-expanding-fixture.js";
import { TEST_FIXTURES } from "./test-fixtures.js";

export const FIXTURE_CATALOG: readonly PlaygroundFixture[] = [
	INVOICE_FIXTURE,
	BOOK_SHOWCASE_FIXTURE,
	PHASE_17_COUNTERS_FIXTURE,
	PHASE_18_MAGAZINE_FIXTURE,
	ROWSPAN_EXPANDING_FIXTURE,
	COMPLEX_MATRIX_FIXTURE,
	POLICY_FIXTURE,
	REPORT_FIXTURE,
	CERTIFICATE_FIXTURE,
	...PAGED_MEDIA_FIXTURES,
	...TEST_FIXTURES,
];

export {
	BOOK_SHOWCASE_FIXTURE,
	CERTIFICATE_FIXTURE,
	COMPLEX_MATRIX_FIXTURE,
	INVOICE_FIXTURE,
	PAGED_MEDIA_FIXTURES,
	PHASE_17_COUNTERS_FIXTURE,
	PHASE_18_MAGAZINE_FIXTURE,
	POLICY_FIXTURE,
	REPORT_FIXTURE,
	ROWSPAN_EXPANDING_FIXTURE,
	TEST_FIXTURES,
};
