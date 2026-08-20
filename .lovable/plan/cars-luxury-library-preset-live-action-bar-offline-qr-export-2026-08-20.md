# Cars Luxury: library preset, live action bar, offline QR, export checks

## 1. Show the luxury cars template in the library automatically

Add a built-in preset (`cars-luxury-v1`) alongside the existing user templates:

- New `src/builder/presets.ts` exporting a ready `TemplateRecord` for card type `cars`: full field usage from the cars contract, luxury theme tokens (white / #F8F8F8 / gold #D4AF37, 28px radius, Inter + Playfair), and the G63 AMG demo data already in `demo-data.ts`.
- `store.ts` seeds this preset once on first read (and re-adds it if missing), so `/` lists it and `/t/cars-luxury-v1` opens it in the preview with the cars-luxury runtime. It stays editable and duplicable like any template.

## 2. Wire the floating action bar to real fields

In `src/builder/runtime/cars-luxury.js` the bar buttons resolve data with fallbacks and hide when the field is empty:

- Call: `phone` → `Phone` → `seller_phone`, `tel:` link.
- WhatsApp: `whatsapp` → `WhatsApp` → `seller_whatsapp`, `wa.me` link with a prefilled message containing the vehicle title.
- Location: `map_url` / `location_url` when present, otherwise a Google Maps search built from the `location` text (so the demo card's "New Cairo, Egypt" works).
- Share: uses `share_card` URL when present, else the current page URL; native share sheet with clipboard fallback and toast.
- QR: always available, opens the QR overlay.

## 3. Dynamic QR built from `share_card`

Replace the remote QR image service with a small self-contained QR encoder inside the runtime, drawing to a `<canvas>`:

- Encodes `share_card` (fallback: current URL), so the QR works offline, inside the sandboxed preview iframe, and in the exported ZIP with no network or dependency.
- Overlay shows the QR, the vehicle title, and a "copy link" action.
- `share_card` is added to the cars demo data and to the allowed-keys set so validation stays clean.

## 4. Manifest and ZIP export coverage

- Manifest for luxury layouts gains `layout: "cars-luxury"`, the rendered `sections` list, and the resolved field-usage buckets, so a consumer sees exactly which contract keys the card reads.
- Export keeps `index.html`, `styles.css`, `template.js`, `manifest.json`, `demo.json`, plus `assets/` image localization (unchanged).
- Extend `src/builder/__tests__/validate.test.ts`: the seeded cars preset validates with zero failures, the manifest contains the cars layout + every section, `share_card` and the action-bar keys are accepted, and the generated `template.js` contains no external QR URL.

## Technical notes

New: `src/builder/presets.ts`, QR encoder helper inside `cars-luxury.js`.
Edited: `src/builder/store.ts`, `src/builder/runtime/cars-luxury.js`, `src/builder/runtime/cars-luxury-css.ts` (QR canvas styles), `src/builder/runtime/generate.ts` (manifest fields), `src/builder/demo-data.ts` (`share_card`), `src/builder/validate.ts`, `src/builder/__tests__/validate.test.ts`.
Verified in the preview at 9:19 with Playwright: each action-bar button target, QR overlay rendering, and a validation run showing READY TO EXPORT.
