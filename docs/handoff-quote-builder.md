# Handoff: Him & Her Music — Wedding Quote Builder

**Date:** 2026-09-06
**Handoff reason:** User is moving this work to a local directory / local dev environment.
**Focus of next session (per user):** Continuing architecture work locally — likely scaffolding the custom WordPress plugin, self-hosting Alpine.js, and migrating logic off Fluent Snippets.

## Source of truth

The full system architecture (data model, PHP/JS structure, the Elementor sanitization constraint, deliberate UX decisions, and outstanding items) is documented in:

- `./docs/quote-builder-architecture-summary.md` (uploaded by user this session — carry this file into the local directory; it was not modified and is not duplicated here)

Read that file first. This handoff only covers what was decided/added **in this conversation**, on top of that document.

## What happened this session

An architecture review was performed against the summary doc above, covering stability, maintainability, and the current live bug (top-level DOM queries in a non-deferred `<head>` script throwing before `alpine:init` registers). Conclusions and decisions reached:

1. **Root cause confirmed**: the JS file mixes two timing regimes (DOM-dependent code vs. Alpine-init code that must register before Alpine's CDN script runs) in one script with no isolation, so an early throw kills everything after it.
2. **Decision: move to a small custom plugin**, deployed via WP Pusher from a GitHub repo, rather than a must-use plugin or theme `functions.php`. Rationale: survives theme changes, matches WP Pusher's intended use case, allows proper activation hooks later.
3. **Decision: once real `wp_enqueue_script()` control exists, most of the defensive timing code (the `whenReady()`/`DOMContentLoaded` guard) becomes unnecessary**, because `defer` guarantees DOM-parsed-before-execution. Ordering `alpine:init` before Alpine's own script should be enforced via WordPress's dependency array (declare the custom bundle as a dependency of the `alpinejs` handle), not via enqueue priority — priority is fragile and hook-order-dependent.
4. **What should still be kept regardless of enqueue fix** (these aren't timing workarounds, they guard against unrelated failure modes):
   - `try/catch` around each top-level script section (protects against unrelated future errors, e.g. bad ACF data).
   - Re-entrancy guard on the `alpine:initialized` injection handler (protects against bfcache restores / plugin conflicts double-firing it).
   - A one-time sanity check in the Alpine→Elementor hidden-field bridge effect that warns to console if any target `form_fields[...]` input is missing (protects against someone editing the Elementor form later and silently breaking quote submission — this fails *silently* today, which was flagged as the highest-consequence risk in the system).
5. **Decision: self-host Alpine.js** (this message, not yet executed). Rationale: once the plugin has its own `assets/` folder and enqueue control, self-hosting removes the CDN as an external dependency, removes the need for a separate WP Rocket CDN-exclusion rule, and lets Alpine's version be pinned/versioned in git alongside the rest of the plugin. Tradeoff: version bumps become manual.
6. **Still recommended, not yet done**: keep WP Rocket's "Combine JS Files" exclusion for both script handles even after the dependency-array fix, as a belt-and-suspenders measure — combining can still reorder/concatenate scripts in ways that bypass the declared dependency relationship.

## Open items carried over from the architecture summary (unchanged, still outstanding)

See "Known outstanding items" in `./docs/quote-builder-architecture-summary.md` for full detail. Not re-litigated this session:
- Head-placement JS fix not yet confirmed working (superseded by the enqueue-based approach above — confirm whether the fix is still needed as an interim step before the plugin migration, or whether the migration happens first).
- Step 3 fields not finalized in Elementor (user's task).
- `[selection_summary]` shortcode exists but isn't wired into the page yet.
- "Request Custom Quote" flow intentionally descoped, not confirmed with end client.

## New action items from this session

- [ ] Scaffold custom plugin: main plugin file with header block, `includes/` for PHP logic migrated out of Fluent Snippets, `assets/` for JS bundle + self-hosted Alpine copy.
- [ ] Register scripts with dependency-array ordering (custom bundle as a dependency of the `alpinejs` handle), both `defer`, both `in_footer`.
- [ ] Self-host a current Alpine.js release in `assets/`; pin the version in the plugin.
- [ ] Once enqueue control is live, strip the `whenReady()`/readyState-check wrapper from the DOM-dependent sections (Sections 1–2 in the architecture summary's JS structure) — keep the `try/catch` per section and the two re-entrancy/sanity-check guards described above.
- [ ] Split the single JS file into logical modules (`nav.js`, `store.js`, `bridge.js`, `inject.js`) bundled with a minimal build step (esbuild suggested — no need for webpack).
- [ ] Set up WP Pusher pointing at the plugin's GitHub repo.
- [ ] Add WP Rocket "Combine JS Files" exclusions for both the custom bundle and the (now self-hosted) Alpine script.
- [ ] Optional/lower priority: basic ESLint config (`no-undef`, `no-unused-vars`) in the repo to catch top-level-throw-style bugs before deploy.

## Decisions explicitly NOT to revisit (constraints confirmed twice this session)

- Elementor Form-widget HTML fields must stay empty `<div>`s with all interactive markup injected via JS template literals — do not reintroduce Alpine directives into PHP output inside a Form widget.
- Invalid styles stay disabled (not hidden); first coverage pre-selected on load; quantity add-ons keep select-only UI. These are deliberate product/UX decisions, not bugs.

## Suggested skills for the next agent

None of the currently available built-in skills map directly to WordPress/PHP/Alpine.js plugin development — this is general coding work, not a document/spreadsheet/slide deliverable, so `docx`/`pptx`/`xlsx`/`pdf` skills don't apply here.

If the next session involves the user uploading existing plugin files, the architecture doc, or exported code for review, invoke:
- **`file-reading`** — if any uploaded file's content isn't already visible in context (e.g. a zipped plugin folder, a binary export).

If at any point this workflow becomes recurring enough to warrant its own reusable skill (e.g. a repeatable "WordPress/Elementor architecture review" checklist), consider:
- **`skill-creator`** — to formalize the review checklist used in this session (Elementor sanitization constraints, timing-regime separation, hidden-field bridge sanity checks) into a reusable skill.
