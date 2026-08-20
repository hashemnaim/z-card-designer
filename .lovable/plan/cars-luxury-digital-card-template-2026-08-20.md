# Cars Luxury Digital Card Template

Add a dedicated premium automotive mobile-card layout (9:19), visually identical in language to the Real Estate Luxury card: white background, #F8F8F8 cards, gold #D4AF37 accent, 28px radii, Inter + Playfair Display, large whitespace.

## What gets built

1. **New runtime `cars-luxury`** — a standalone dependency-free renderer, mirroring the real-estate luxury runtime structure:
   - Hero: cover image with gradient, floating vehicle image, condition badge + Verified pill, title, gold price, meta row (brand · model · year · trim · body type), location line, 3-line short description.
   - Scroll choreography: hero collapses, vehicle thumb scales into a sticky glass-blur header keeping title + price visible.
   - Floating glass action bar always visible: Call, WhatsApp, Location, Share, QR.
   - Accordions, one open at a time, each with icon + title + small preview + arrow: Vehicle Specifications (2-col grid), Highlights (gold chips from boolean features only), Description (Read More past 3 lines), Gallery (4 thumbs, horizontal slider, fullscreen viewer), Featured Video (rounded thumbnail + centered play), Seller (circular photo, name/title/company, Call/WhatsApp/Email), Social Links (circular icons for present links only).
   - Smart rules: any empty field or section is skipped entirely, no blank space.

2. **New stylesheet generator** for the cars layout, sharing the same tokens/shadows/radii as the real-estate luxury CSS so both cards look like one family.

3. **Generator wiring** — `generate.ts` picks the cars-luxury runtime + CSS when `cardType === "cars"`, keeps `demo.json`, `manifest.json`, `styles.css`, `template.js` output and font preloads unchanged.

4. **Demo data** — a `CARS_LUXURY_EXTRAS` bank with the exact requested demo content: 2024 Mercedes-Benz G63 AMG, EGP 12,500,000, 8,500 km, Automatic, Gasoline, 4.0L Twin Turbo V8, 577 HP, Obsidian Black / Black Nappa Leather, New Cairo Egypt, seller Ahmed Hassan — Senior Automotive Consultant — Elite Motors, gallery + interior gallery + video thumbnail.

5. **Validation + tests** — extend the allowed-key set so cars-layout keys are accepted (same mechanism used for real-estate extras), and add Vitest cases asserting a cars template validates with zero failures and that its layout keys are not flagged as unknown.

## Field naming

Requested names are used verbatim in the renderer (`cover_image`, `featured_image`, `gallery`, `video_thumbnail`, `phone`, `whatsapp`, `email`, `website`, `snapchat`, `badge`, `save_contact`, `share_card`, …). Where the official cars contract uses a different key for the same value (`Phone`/`WhatsApp`, `gallery_images`), the runtime reads the requested name first and falls back to the contract key, so the card works with real Z Card API payloads without renaming anything in the contract.

## Technical notes

- New files: `src/builder/runtime/cars-luxury.js`, `src/builder/runtime/cars-luxury-css.ts`.
- Edited: `src/builder/runtime/generate.ts` (layout selection), `src/builder/demo-data.ts` (cars extras), `src/builder/validate.ts` (allowed keys), `src/builder/__tests__/validate.test.ts`.
- Icons drawn as inline SVG (no Font Awesome dependency) matching the named fa icons visually, keeping the export dependency-free.
- Verified in the live preview at 9:19 with Playwright: hero collapse, sticky glass header, accordion single-open behaviour, chips, gallery slider.
