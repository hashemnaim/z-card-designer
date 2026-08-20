# Z Card Template Builder — V1 Plan

An internal, developer-focused tool (Linear/Vercel/Raycast aesthetic) for authoring Z Card templates from official data contracts, previewing them with demo data, validating, and exporting a standalone ZIP.

Confirmed decisions: templates stored in browser local storage; AI generation enabled via Lovable AI; bilingual (EN/AR) builder UI with RTL toggle; one flexible, theme-driven layout per card type.

## Foundations

- Copy the three uploaded contracts into `src/contracts/` (`personal.template.json`, `real-estate.template.json`, `cars.template.json`) plus a registry that exposes card types, fields, sections, required/optional lists, and `schema_version`. Contracts are read-only and never modified by the builder.
- Contract loader utilities: field lookup by key, section grouping, type metadata (text, textarea, phone, email, gallery, image, url, number, select, boolean, social types), and a key-allowlist used for demo/JSON validation.
- Design system: dark-first developer console tokens in `src/styles.css` (near-black surfaces, thin borders, one restrained accent, mono for keys/IDs). No hardcoded color utilities.

## Screens

1. **Home / Library** (`/`) — header with "Z Card Template Builder", prominent `+ New Template`, card-type filter chips, search, and a grid of template cards showing mini preview, name, ID, card type, style, version, validation status, last updated. Actions: Open, Preview, Duplicate (new ID), Export, Delete.
2. **Wizard** (`/new`) — 6 steps, each validated before advancing:
   - Card Type (loads contract, shows required vs optional field counts)
   - Style (presets: Luxury, Minimal, Modern, Premium, Corporate, Elegant, Dark, Light, Editorial, Bold, Futuristic, Clean + free-text custom description)
   - Visual Reference (image/screenshot upload stored as data URL, reference URL, notes — inspiration only)
   - Field Priority (every contract field marked Required for this design / Recommended / Optional / Not used; contract-required fields locked as used)
   - Language & Direction (ar/RTL, en/LTR, both, auto)
   - Identity (name, auto-suggested ID + slug like `personal-luxury-v1`, version `1.0.0`, uniqueness check) with a final summary + Confirm before the template is created.
3. **Workspace** (`/t/$templateId`) — three panes:
   - Left: contract fields grouped by section with key, label, type, required badge, and usage selector.
   - Center: live mobile canvas (390–430px) rendering the actual exported runtime inside a sandboxed iframe, so preview and export are byte-identical. Data source switch: Demo Data / Custom JSON / API-like payload, with a paste-and-validate panel reporting unknown keys, missing required fields, and JSON errors.
   - Right: theme + metadata controls (palette, typography pair, spacing density, radius, section order and visibility, hero/media treatment, contact button style, RTL/LTR, name/version/slug).
4. **Export panel** — pre-export summary (template ID, card type, schema version, version, used/required fields, demo filename, file list, validation status) with blocking errors listed, then `Export Template` → ZIP download.

## AI generation

A server function (`src/lib/ai.functions.ts`) calls Lovable AI with the style description, card type, selected fields, section list, and reference notes. It returns only a strict theme/layout config object (colors, fonts, radius, density, section order, emphasis) validated with Zod against the contract's key allowlist — it never emits field keys that aren't in the contract, and never emits HTML or renderer code. Failures fall back to the chosen style preset.

## Exported template package

Generated per template ID, from a vanilla-JS renderer template:

```text
<template-id>/
├── index.html
├── styles.css
├── template.js
├── manifest.json
├── <template-id>.demo.json
└── assets/
```

- `index.html`: loads `styles.css`, creates `#zcard-root`, loads `template.js`, reads `window.ZCARD_DATA`.
- `styles.css`: template-only styles, all classes prefixed `zc-`, theme values injected as CSS variables from the workspace config.
- `template.js`: dependency-free renderer exposing `window.ZCardTemplate.render(data)`, auto-rendering from `window.ZCARD_DATA`, re-renderable. Builds DOM with `createElement`/`textContent`/`setAttribute` (no `innerHTML` for user data), sanitizes/whitelists URL schemes, renders galleries and social links, supports RTL/LTR, and applies the missing-data rules: missing/null/empty-string/empty-array fields hidden, empty sections removed entirely, unknown keys ignored, no placeholder values invented.
- `manifest.json`: id, slug, name, version, card_type, schema_version, entry, style, script, demo_data, supports.rtl/ltr/languages, field_usage (required/recommended/optional). References the contract by `card_type` + `schema_version`; does not duplicate it.
- Demo JSON: generated with the exact contract API keys only, realistic per-type values (Arabic-friendly), name always `<template-id>.demo.json`.

## Validation (blocks export)

Manifest completeness; presence of all five files; demo JSON parses, contains only contract keys, and satisfies the design's required fields; renderer smoke test — render demo data in a hidden sandboxed iframe and confirm `window.ZCardTemplate.render(data)` runs and produces nodes; security check that no user value is injected as raw HTML. Results shown as pass/warn/fail rows.

## Technical notes

- Routes: `/`, `/new`, `/t/$templateId`, `/t/$templateId/export`. Each route gets its own `head()` metadata.
- Persistence: `localStorage` under a versioned key, read inside `useEffect`/handlers only (no SSR access), with a small store module (`src/builder/store`) handling CRUD, duplication, and schema migration.
- Structure: `src/contracts/`, `src/builder/{wizard,editor,preview,export,store}`, `src/templates/runtime/` (renderer source as string modules + generators), `src/components/`, `src/lib/`.
- ZIP: `jszip` + `file-saver`-style blob download, all generated in the browser.
- Reference images live in local storage as data URLs and are not shipped into the ZIP unless the user marks them as template assets (then they land in `assets/`).

## Out of scope

No auth, billing, marketplace, Z Card backend/API, card management, or analytics.

## Deliverable report

On completion I'll document project structure, contract loading, wizard flow, template storage, demo/manifest generation, preview, validation, ZIP export output, known limitations, and the recommended path for consuming the ZIP in Z Card Admin.
