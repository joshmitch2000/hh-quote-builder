# Architecture Summary: Him & Her Music — Wedding Quote Builder

## Stack
WordPress + Elementor Pro (native multi-step Form widget) + ACF Pro (CPTs) + Alpine.js (CDN, deferred) + Fluent Snippets (PHP/JS hosting — no file/hosting access available, otherwise would be theme files or a plugin via WP Pusher).

## Data model
- **`package` CPT**: title=name; ACF fields `coverage` (Select, slug-valued), `style` (Select, slug-valued), `price` (Text), `short_description` (Textarea), `features` (Repeater), `available_addons` (Repeater: `addon` Post Object → `add-on` CPT, `max_quantity` Number).
- **`add-on` CPT**: title=name; ACF fields `price` (Text), `type` (Select: flat/quantity), `unit_label` (Text).
- Coverage/Style deliberately plain ACF Selects, not WP taxonomies (each package has exactly one of each; taxonomy-based filtering was evaluated and rejected earlier for other reasons).

## Critical constraint driving the whole JS architecture
**Elementor sanitizes content inside Form widget "HTML" field types** (kses-style filtering) — strips `<input>`, `<select>`, `<template>` tags and any non-standard attributes (`x-for`, `x-model`, `:value`, `@click`, etc.). This was discovered the hard way, twice (once for a vanilla-JS checkbox/select approach, once for an Alpine `<template>` approach).

**Resolution**: any Form HTML field that needs interactive/templated content is rendered by PHP as a **trivial empty `<div id="...">`**. All actual markup (including Alpine directives) lives as **JS template-literal strings**, injected via `innerHTML` at runtime, then activated with `Alpine.initTree(el)`. This is the load-bearing pattern of the whole build — do not reintroduce Alpine directives into PHP output that lands inside a Form HTML field.

**Exception**: `[package_filters]` shortcode renders real Alpine markup directly in PHP — this is safe *only* because that shortcode sits in a plain Elementor Shortcode widget **outside** the Form widget entirely, not subject to the same filtering.

## PHP (Fluent Snippets)
- `hh_get_quote_data()` — single shared data builder (memoized via `static`), queries the `package` CPT once, resolves each package's `available_addons` repeater into flat add-on objects, returns packages + coverage/style choice-label maps + derived "which coverage/style combos actually exist" data.
- `[package_filters]` — prints `hh_get_quote_data()` as `<script type="application/json" id="hh-quote-data">`, plus real Alpine-templated coverage/style `<fieldset>`s (safe, per exception above).
- `[package_cards]`, `[addon_selector]`, `[selection_summary]` — each just `return '<div id="...">'`. No PHP loop, no Alpine markup. (`selection_summary` not yet placed in Elementor; Step 3 fields still being finalized by user.)

## JS (single file — location TBD, currently inlined via `nowprocket` in `<head>`, non-deferred)

**Known live bug, root cause identified, fix drafted, not yet confirmed working**: top-level DOM-querying code (`document.getElementById('form').addEventListener(...)`, a `MutationObserver` on `.elementor-form-fields-wrapper`) runs immediately since the script isn't deferred/module-scoped — but `<head>` placement means it executes before `<body>`/`#form` exist, throwing an uncaught error that halts the rest of the script file, preventing the `alpine:init` listener (further down in the same file) from ever registering. Fix: wrap DOM-dependent setup in a `DOMContentLoaded`-or-already-ready guard; leave `alpine:init`/`alpine:initialized` listeners unwrapped since they must register before Alpine's own deferred CDN script executes (which happens before `DOMContentLoaded` fires).

**Structure**:
1. `window.HHQuoteNav` — imperative step navigation. Clicks Elementor's own native `.e-form__buttons__wrapper__button-next/-previous` buttons rather than reimplementing step logic. Handles forward-skip of empty Step 2 (no add-ons); backward-skip via a click listener on the native "Go back" button + `requestAnimationFrame` re-click if it lands on an empty Step 2. Skipped entirely in the Elementor editor (`window.elementor` present): all steps render stacked there, so navigation is meaningless and clicking native buttons would fight widget selection.
2. `syncStepVisibility()` + `MutationObserver` — hides the `[package_filters]` widget (genuine DOM sibling of the form, invisible to Elementor's own step-hiding) outside Step 1. The disclaimer text no longer needs this — it was moved inside Step 1's own field group, so native step-hiding covers it for free now.
3. `Alpine.store('quote', {...})` registered inside `alpine:init` — single source of truth: `packages`, `coverageChoices`/`styleChoices` (slug→label maps from ACF field config, never guessed/reconstructed from slugs), `coverage`/`style`/`selectedPackage`/`addonState`, derived getters (`visiblePackages`, `total`, `addonSummaryLines`, `hasSelectedAddons`, `coverageLabel`/`styleLabel`), `formatNumber()` (always comma-formatted per explicit user preference), `selectPackage()` (sets state, triggers nav).
4. `Alpine.effect()` #1 — auto-clears an invalid style selection when coverage changes (prevents stale-selection bug from the pre-Alpine build).
5. `Alpine.effect()` #2 — the **Elementor bridge**: on every reactive change, writes computed values into Elementor's real native Hidden `<input name="form_fields[...]">` elements (`selected_coverage`, `selected_style`, `package_name`, `base_price`, `estimated_total`, `selected_addons_summary`). This is the only point where Alpine state becomes what actually gets emailed/submitted — Alpine has no way to bind directly to Elementor's own hidden-field markup (no Custom Attributes control on Form fields), so this imperative sync is necessary and intentional, not a workaround to remove.
6. `alpine:initialized` listener — injects the actual template-literal HTML into `#cards-container`, `#addons-container`, `#selection-summary` (if present), then calls `Alpine.initTree(el)` on each. A MutationObserver on the three containers re-injects if they're emptied — on the frontend this never fires, but the Elementor editor re-renders widgets on every panel change and would otherwise wipe the injected markup permanently.

## Deliberate product/UX decisions (don't "fix" without checking)
- Disabled (not hidden) invalid style options, with `title` tooltip — shows full catalog breadth.
- First available coverage pre-selected on load; style left unselected — deliberate middle ground between fully-empty and fully-defaulted state.
- "Request Custom Quote" (for zero-match coverage/style combos) intentionally **descoped for now** — not confirmed with end client yet, may return later.
- Quantity-type add-ons show only a select (no visible checkbox) — checkbox exists in state/logic but not in UI, per explicit client-screenshot spec.

## Known outstanding items
1. Confirm the head-placement JS fix above actually resolves the store-undefined error (untested at time of writing).
2. Step 3 fields not finalized in Elementor yet (user's task); `[selection_summary]` shortcode exists and JS handles its absence gracefully (`if (summaryEl)` guard) but isn't wired into the page.
3. Long-term file hosting: currently Fluent Snippets by necessity (no hosting/file-manager access); WP Pusher (deploys from GitHub into a real plugin/theme folder via WP admin only) flagged as the path to real version-controlled files without needing hosting access.
4. WP Rocket is active on the site — both the custom JS (`nowprocket` attribute) and the Alpine CDN script need to stay excluded from WP Rocket's JS delay/combine optimizations, or timing bugs like this one will recur.
