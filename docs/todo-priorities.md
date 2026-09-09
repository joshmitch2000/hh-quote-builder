# Code Review & Development Priorities

This document outlines the remaining code review and hardening tasks for `hh-quote-builder`, organized in order of priority.

---

## Completed (P1 & P2)
- [x] **Automatic Asset Cache Busting:** Replaced hardcoded script versioning in `includes/assets.php` with `filemtime()` for `assets/js/bundle.js`.
- [x] **Single Source of Truth for Plugin Version:** PHP reads `Version` from plugin header dynamically.
- [x] **Filter/Package State Invalidation:** Added `Alpine.effect` in `src/store.js` that clears `selectedPackage` and `addonState` if coverage or style filters change.
- [x] **Step 1 Navigation Guard:** Added capture-phase click interception in `src/nav.js` to prevent advancing past Step 1 unless a package is selected.
- [x] **ACF Defensive Guard:** Added `function_exists('get_field')` check in `includes/data.php` to prevent fatal errors if ACF Pro is inactive.
- [x] **Floating-Point Precision:** Added `Math.round(total * 100) / 100` in `src/store.js` to eliminate currency float artifacts.
- [x] **Legacy Snippets Cleanup:** Archived `current/` snippets into `docs/legacy/`.
- [x] **Local Build Automation Scripts:** Added `npm test` (`npm run check`) and automatic bundle building on `npm version`.

---

## Priority 3: Testing & Staging Verification

### 3.1 Real UI Interaction E2E Testing
- **Location:** `e2e/live-site.spec.js`
- **Issue:** The package-selection test currently calls `store.selectPackage()` directly via `page.evaluate()`, bypassing the real button click, event bindings, and `HHQuoteNav` step transitions.
- **Task:** Update the test to click `.package-card__select` and assert that the Elementor form advances to Step 2.

### 3.2 Regression Test for State Invalidation
- **Task:** Add an E2E test verifying the back-and-switch flow:
  1. Select a package on Step 1 (advances to Step 2).
  2. Click the native "Previous" button back to Step 1.
  3. Switch coverage or style to a different option.
  4. Assert `selectedPackage` is cleared and hidden fields (`form_fields[package_name]`, `base_price`, etc.) are empty.
  5. Assert clicking native "Next" does not advance until a new package is selected.

### 3.3 Add-on and Summary End-to-End Flow
- **Task:** Add an E2E scenario covering:
  - Toggling flat add-ons.
  - Selecting quantity for quantity-based add-ons.
  - Verifying running total updates in Step 2.
  - Advancing to Step 3 and verifying `#selection-summary` reflects the chosen package, add-ons, and total.

### 3.4 Configurable Base URL & Multi-Browser Support
- **Location:** `playwright.config.js`
- **Task:** Support `BASE_URL` environment variable (e.g. `process.env.BASE_URL || 'https://himandhermusic.com'`) to allow testing against staging or local environments.
- **Task:** Enable WebKit (Safari) and Firefox projects in Playwright configuration to catch cross-browser differences.

---

## Priority 4: Accessibility (A11y) & UX

### 4.1 Form Label & Select Association
- **Location:** `src/inject.js`
- **Task:** The quantity `<select>` element in the add-on row currently lacks an explicit `id` connected to its `<label>`:
  ```html
  <label :for="`addon-qty-${addon.id}`">How many musicians would you like to add?</label>
  <select :id="`addon-qty-${addon.id}`" x-model="$store.quote.addonState[addon.id].qty">
  ```

### 4.2 Dynamic Live Region Announcements
- **Location:** `src/inject.js`
- **Task:** Add `aria-live="polite"` to `.total-box .amount` and `.selection-summary__total .amount` so screen reader users hear price recalculations when add-ons or packages are changed.

### 4.3 Accessible Disabled States for Style Filters
- **Location:** `includes/shortcodes.php`
- **Task:** Disabled styles currently rely on a HTML `title` tooltip. Add `aria-disabled="true"` and an accessible description explaining that the style is unavailable for the currently selected coverage.

### 4.4 Keyboard Focus Management & Reduced Motion
- **Location:** `src/nav.js`
- **Task:** When moving to the next or previous step, shift keyboard focus to the active step's heading or first interactive element.
- **Task:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before invoking `{ behavior: 'smooth' }` scroll.

---

## Priority 5: Code Quality Tooling & Advisory Checks

### 5.1 Fallow Advisory Scans
- **Tool:** [Fallow](https://fallow.tools/)
- **Task:** Run periodic dead code and duplication audits on JavaScript sources:
  ```bash
  npx fallow dead-code --ignore-patterns "assets/**" --ignore-patterns "docs/**"
  npx fallow dupes
  ```

### 5.2 PHP Code Standards & Static Analysis
- **Tools:** `phpcs` (WordPress-Coding-Standards), `phpstan` (`szepeviktor/phpstan-wordpress`)
- **Task:** Add a `composer.json` or dev dependency configuration to run PHPCS and PHPStan on `hh-quote-builder.php` and `includes/*.php`.
- **Task:** Run official WordPress `plugin-check` to confirm repository guidelines.

### 5.3 Git Pre-Commit Hook
- **Task:** Add a git pre-commit hook (or Husky/lint-staged) that runs `npm run check` so unbuilt or syntax-invalid code cannot be committed to `main`.
