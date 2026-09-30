# Paged.js legacy fixture attribution

`tests/fixtures/` contains normalized copies of input files from
[`pagedjs/specs`](https://github.com/pagedjs/pagedjs/tree/main/specs), copied from
upstream `pagedjs/specs` for legacy parity capture. Original
relative paths are retained below this directory so HTML-relative styles, scripts,
and assets preserve legacy topology. Original source path(s) for each candidate are
recorded in `manifest.ts`.

Paged.js is MIT licensed. Full upstream license: `PAGEDJS-LICENSE.md`.

Capture server replaces legacy `../../../dist/paged.polyfill.js` references at serve
time with its built upstream artifact route. Fixture source itself remains copied
without semantic repair. This is harness routing, not an accepted-rendering change.

Local assets referenced by legacy fixtures are copied beside those fixtures and declared
in `manifest.ts`. Legacy `specs` references `images/cover.jpg` but does not contain it;
exact shared upstream source is `examples/assets/aurorae/images/cover.jpg`. It is copied
unchanged beside each fixture to preserve legacy relative resolution.
