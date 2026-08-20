# Export Package Parity with the Luxury Personal Reference

Make every exported ZIP follow the same file layout as the uploaded reference package, and add the contract + schema files that describe the card type.

## New ZIP layout

```text
<template-id>/
  index.html
  styles.css
  template.js
  manifest.json
  schema.json                  <- generated from the card-type contract
  personal.template.json       <- official contract, name follows card type
  demo.json                    <- raw demo data (localized asset paths)
  demo-data.js                 <- window.ZCARD_DEMO_DATA = { ...same data }
  assets/
    image-01.jpg ...           <- downloaded demo images
```

The contract file name follows the card type: `personal.template.json`, `real-estate.template.json`, or `cars.template.json`, copied verbatim from the builder's source of truth so exported packages always ship the exact official keys.

## demo.json + demo-data.js

Both files hold the same localized demo payload (images already rewritten to `assets/...`):

- `demo.json` stays the machine-readable data file referenced by the manifest.
- `demo-data.js` is generated from it and sets `window.ZCARD_DEMO_DATA`, with the same comment header style as the reference package (demo only, renderer never reads it).
- `index.html` gets the reference package's fallback block: load `demo-data.js`, then `window.ZCARD_DATA = window.ZCARD_DATA || window.ZCARD_DEMO_DATA`, so opening `index.html` locally renders the card with demo data while production data still wins.

## schema.json (generated per card type)

Built automatically from the selected card type's contract, so it always matches the flat official keys — no hand-written duplication:

- Draft 2020-12 object schema, `$id` and `x-schemaVersion` from the contract's `schema_version` (e.g. `cars-v1`).
- One property per contract field, typed from the field type (text/textarea → string, integer → integer, currency → number, switch/checkbox → boolean, gallery/multiselect → array of strings, image/url/video_url/map → string with `uri-reference`, select → string with `enum` from the contract options).
- `required` = the fields marked required in the template's field usage.
- `additionalProperties: true` so layout-specific extras (luxury real-estate / cars keys) never break validation.

## Manifest additions

`manifest.json` gains `schema: "schema.json"`, `contract: "<card-type>.template.json"`, `demo_data_js: "demo-data.js"`, and a `runtime` block mirroring the reference (`globalData`, `renderer`, `dependencies: []`), keeping all existing keys intact.

## Files pane and validation

- The Files pane tab list gains `schema.json`, `demo-data.js`, and the contract file so everything in the ZIP is previewable before export.
- The export toast keeps reporting file count, asset count and size.
- Validation gains checks that the schema, contract and demo-data files are generated and non-empty; new Vitest cases assert the ZIP-level file set, that `schema.json` parses and lists the required keys, and that `demo-data.js` assigns `window.ZCARD_DEMO_DATA`.

## Technical notes

- Edited: `src/builder/runtime/generate.ts` (schema generator, demo-data.js generator, contract passthrough, manifest keys, index.html fallback block), `src/builder/export.ts` (write the new files, share one localized payload between `demo.json` and `demo-data.js`), `src/builder/editor/FilesPane.tsx` (extra tabs), `src/builder/validate.ts`, `src/builder/__tests__/validate.test.ts`.
- No renderer or design changes; the runtime keeps reading `window.ZCARD_DATA` only.
