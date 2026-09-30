# Printedjs Release Readiness

This document specifies release readiness criteria, package distribution inventories, export integrity validation, and verification protocols across all Printedjs packages.

---

## Package Distribution Inventory

The Printedjs monorepo publishes 7 scoped packages, each adhering to strict architectural boundaries:

| Package                   | Status | Zero DOM?        | Distribution Formats  | Primary Responsibility                                                              |
| :------------------------ | :----- | :--------------- | :-------------------- | :---------------------------------------------------------------------------------- |
| **`@printedjs/core`**     | Ready  | **Yes**          | ESM + Types           | Pure paginator contracts, state machines, and CSS AST facade.                       |
| **`@printedjs/browser`**  | Ready  | No               | ESM + IIFE + Types    | Browser renderer, DOM layout adapter, measurement, surfaces (`root` and `iframe`).  |
| **`@printedjs/plugins`**  | Ready  | **Yes** (Facade) | ESM + IIFE + Types    | Standard paged media plugins: `@page`, breaks, running headers, footnotes, columns. |
| **`@printedjs/devtools`** | Ready  | No               | ESM + Types           | Diagnostic tracing, render metrics, and non-layout visual inspector overlay.        |
| **`@printedjs/polyfill`** | Ready  | No               | ESM + IIFE + Types    | Drop-in legacy browser compatibility layer and Paged.js `Previewer` API emulation.  |
| **`@printedjs/minimal`**  | Ready  | No               | ESM + IIFE + Types    | All-in-one minimal bundle (`printedjs.min.js`) for CDN and script-tag deployments.  |
| **`@printedjs/cli`**      | Ready  | No               | ESM + CLI Bin + Types | Headless PDF rendering with dual Playwright and Puppeteer browser engines.          |

---

## Automated Verification Pipeline

Prior to tagging or publishing any release, the automated verification pipeline must pass with zero warnings or errors:

```bash
# 1. Code formatting, ESLint rules, TypeScript project references, and Vitest suite
pnpm verify

# 2. Production build across all 7 packages and applications
pnpm build

# 3. Packaging and public export integrity checks
pnpm pack:check

# 4. Full browser parity and layout matrix tests (Headless Chromium)
pnpm test:browser
```

---

## Package Export & Distribution Validation

The `pnpm pack:check` script executes two automated validation utilities:

1. **`scripts/check-public-exports.ts`**:
   - Ensures all package `package.json` entries (`main`, `module`, `types`, `exports`) resolve to existing files in `dist/`.
   - Validates that TypeScript declaration maps and `.d.ts` definitions exist for every exported symbol.
   - Validates that CLI bin entries (`printedjs`) point to executable, compiled JavaScript files.

2. **`scripts/check-package-contents.ts`**:
   - Inspects generated tarball archives for each package.
   - Verifies that internal development artifacts (`.tsbuildinfo`, test files, source files, Vitest configs) are never leaked into published packages.
   - Verifies that required metadata (`README.md`, `LICENSE`, `package.json`) is present in each package root.

---

## Release Checklist & Gating

Before initiating a release:

- [ ] All working trees are clean (`git status --porcelain` returns empty).
- [ ] No local development paths, credentials, or proprietary filenames are tracked in the repository.
- [ ] `pnpm verify` passes (Prettier, ESLint 9, `tsc --build`, Vitest).
- [ ] `pnpm build` completes with all packages compiling cleanly via `tsup` and `tsc`.
- [ ] `pnpm pack:check` passes without unresolved export warnings.
- [ ] Visual regression and browser parity tests (`pnpm test:browser`) pass within allowable pixel tolerances.
- [ ] Package version bumps match Semantic Versioning (SemVer) across interdependent workspace dependencies.
