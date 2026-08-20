# Pre-Export Validation Summary + Automated Validation Tests

## Goal

Before exporting a template, show a clear panel that summarises every error and warning — naming the exact field that failed and why — and add automated tests so design-specific field keys can never silently re-break validation.

## 1. Field-level reasons in the validation engine

Today checks report a group message plus a comma-joined detail string (e.g. `cover_image, agent_photo`). Extend each check result with an optional structured list of offending fields so the UI can explain each one:

- Add `fields?: Array<{ key: string; reason: string; hint?: string }>` to `CheckResult` in `src/builder/validate.ts`.
- Populate it for the field-driven checks:
  - `demo-keys` — key is not in the official contract for this card type (and not a design extra) → hint: remove it or use the matching contract key.
  - `demo-required` — field is marked required by this design but has no value in the demo JSON.
  - `contract-required-used` — field is required by the official contract but this design marks it unused (warning).
  - `manifest-keys` — each missing manifest key with why it's needed.
- Keep the existing `detail` string so nothing else breaks.

## 2. Pre-export summary panel

New component `src/builder/editor/ExportSummary.tsx`, rendered at the top of the Package Files tab (above the file tabs) and reused as a header in the Validation tab:

- Status chip: `READY TO EXPORT` / `BLOCKED` with counts (failures, warnings, checks).
- Two grouped lists: **Blocking errors** and **Warnings**. Each row shows the check message, and under it one line per failing field: `field_key — reason` with the fix hint in muted text.
- Empty state when there is nothing to fix.
- The Export ZIP button stays disabled while blocked, with a short reason line instead of only a toast.
- Bilingual labels via the existing `useI18n` keys (adding any missing keys to `src/lib/i18n.tsx`).

`ValidationPane` keeps its per-check list and gains the same field-level detail rows.

## 3. Automated validation tests

Add Vitest (dev dependency + `test` script) with `src/builder/__tests__/validate.test.ts` covering:

- Every card type (`personal`, `real-estate`, `cars`) with default demo data validates with zero failures — the regression guard against new pre-export failures.
- Luxury real-estate design extras (`cover_image`, `verified_badge`, `agent_photo`, …) are accepted by `allowedKeys` and do not appear as unknown keys.
- A genuinely invented key produces a `demo-keys` failure that names that key in `fields`.
- A required field emptied in demo data produces a `demo-required` failure naming it.
- `validatePayload` reports `unknownKeys` and `missingRequired` correctly for a pasted payload.
- Generated files always expose `window.ZCardTemplate.render`, consume `window.ZCARD_DATA`, and the demo file is named `demo.json`.

## Technical notes

- Files touched: `src/builder/validate.ts`, `src/builder/editor/FilesPane.tsx`, `src/builder/editor/ValidationPane.tsx`, new `src/builder/editor/ExportSummary.tsx`, `src/lib/i18n.tsx`, `package.json`, new test file.
- No changes to the export ZIP format, runtime generators, or contracts.
- Tests are pure functions over `validate.ts` / `generate.ts` — no DOM or browser needed.

## Noted for later (not in this plan)

You chose full AI-generated design. Improving template quality — having the AI produce the card's HTML/CSS layout itself (within contract-safe guardrails) instead of only theme tokens — will be a separate follow-up plan.
