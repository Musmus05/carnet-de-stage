# Design

<!-- Visual system for Carnet de stage. Product truth lives in PRODUCT.md. -->

## World: Herbier de terrain

A naturalist's herbarium. Each internship application is a specimen: it gets an accession number (N° 001), a pressed-plant plate and a ruled label. The world lends the product four things only: type, palette, density and one signature move. Navigation, tables, forms and controls stay standard web components.

Light only, chosen from the use scene: a student at a laptop, in a library or at home, in daylight.

## Signature move

**The plant grows with the application.** `src/components/specimen-plate.tsx` draws a watercolour plant with [p5.brush](https://github.com/acamposuribe/p5.brush) (standalone WebGL2 build). The application id seeds its shape, so every record has its own plant; the status sets its stage:

| Status | Stage |
|---|---|
| À postuler | seed |
| Envoyée, Relancée | closed bud |
| Entretien | open flower (violet) |
| Offre | flower with red fruit |
| Refus | wilted, browned |
| Sans réponse, Abandonnée | faded |

The plate sits above a **specimen label** (`specimen-label.tsx`): a ruled slip with heading, accession number, title in serif, and dotted rows. Plates appear on the landing page, the login rail, the record page and empty states. Never in tables or the dashboard's working areas.

## Palette

Restrained, with a committed shell: the navigation rail is drenched in pressed-fern green.

| Token | Value | Role |
|---|---|---|
| `--sheet` | `#e9ece2` | page ground, grey-green mounting board |
| `--sheet-raised` | `#f7f8f2` | label paper, inputs, plates |
| `--folder` | `#dce1d2` | second neutral layer, tracks, skeletons |
| `--fern` | `#1e3a2b` | navigation rail |
| `--ink` / `--ink-2` / `--ink-3` | `#221f19` / `#514b41` / `#6a6457` | text, all ≥ 4.5:1 on the sheet |
| `--action` | `#24503a` | primary buttons |
| `--tape` | `#9a6a14` | focus ring, selection, "due soon" |
| `--danger` | `#9c3f33` | overdue, destructive |

Status colours (`--st-*`) always ship with a text label. The dashboard pipeline groups statuses into four stages whose colours passed the dataviz validator (CVD ΔE ≥ 8, normal-vision ΔE ≥ 15) on the sheet: preparing `#a8741a`, waiting `#2f64a8`, positive `#2f7a46`, closed `#9b4f86`. Each segment also carries a direct label with its count.

## Type

- **Hanken Grotesk** for the interface: labels, body, data, buttons.
- **Source Serif 4** for what a herbarium would write by hand on the label: page titles, company names, accession numbers, section headings.
- Fixed rem scale (product UI), tabular numerals (`.tnum`) for every count, date and number.

## Rules

- No cards inside cards; group with rules (1px `--rule`) and spacing.
- No eyebrow labels above headings; no gradient text; no decorative glow.
- Motion: 150 to 200 ms colour transitions only; reduced motion respected.
- Every interactive element: hover, focus-visible (tape outline), disabled, pending.
- Empty states teach the next action and show a seed-stage plate.
