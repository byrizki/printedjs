# Official Visual Test Baselines

This directory contains version-controlled golden baseline images and capture manifests used by the cross-browser visual regression suite (`tests/browser/visual-parity.spec.ts`).

## Overview

Unlike legacy baseline snapshots captured from Paged.js, these baselines are generated directly by **Printed.js** using normalized styling (`Liberation Serif`, explicit line-heights, standard viewport dimensions).

Crucially, these baselines reflect both fixed Paged.js bugs and native Printed.js platform features:
- **`tables/rebuild`**: Correctly splits multi-row tables across pages with proper header repetition, avoiding clipped content.
- **`named-page/page-group`**: Correctly groups and paginates named-page flows without missing pages.
- **`notes/footnotes-lastpage`**: Places footnotes properly on the final page rather than truncating or overflowing.
- **`filters/undisplayed`**: Properly ignores `display: none` elements without creating blank phantom pages.
- **`breaks/break-after` (`recto`, `verso`, `left`, `right`)**: Correctly inserts blank spacer pages to maintain page-parity constraints.
- **`counters/custom-counters` (Phase 17)**: Multi-section pagination with roman frontmatter, decimal restart, and alpha appendices.
- **`views/spread-view` (Phase 18)**: Facing 2-page spread mode with solo recto cover offset and center spine shadow.
- **`page-rules/mirrored-margins` (Phase 19)**: Mirrored binding margins with `margin-inside`, `margin-outside`, and `gutter`.


## Updating Baselines

To regenerate or add new fixture baselines:

```bash
pnpm exec tsx scripts/capture-printedjs-baselines.ts
```

This updates:
1. `<fixture-path>/document.png` (stitched document screenshot)
2. `<fixture-path>/capture.json` (render metadata including page dimensions and total pages)
3. `manifest.json` (checksum manifest of all tracked baselines)

Run the visual comparison suite across Chromium, Firefox, and WebKit:

```bash
pnpm test:visual
```
