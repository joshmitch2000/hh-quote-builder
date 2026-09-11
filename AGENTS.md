# Agent Guidelines: HH Quote Builder

Custom WordPress plugin (`hh-quote-builder`) providing an Alpine.js-powered wedding music package quote builder embedded inside an Elementor Form on `wedding-music-packages`. Deployed via WP Pusher / GitHub push-to-deploy.

When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

---

## Commands & Workflows

### Build & Verification

- **Build production JS bundle**: `npm run build` (`esbuild src/index.js --bundle --minify --format=iife --target=es2019 --outfile=assets/js/bundle.js`).
- **Syntax check**: `npm run check` (or `npm test`) — runs `node --check` across `src/*.js`.
- **E2E tests (Live Site)**: `npx playwright test e2e/live-site.spec.js` (runs against the live production page). **ONLY RUN THESE TESTS IF EXPLICITLY TOLD TO. DON'T ASSUME YOU HAVE TO RUN THEM EVERYTIME**
- **Compile MJML email templates**:
  ```bash
  npx mjml email-templates/client.mjml -o email-templates/client.html
  npx mjml email-templates/customer.mjml -o email-templates/customer.html
  ```

### Version Bumping Workflow

Whenever bumping the version, keep all 4 places in sync:

1. `package.json` (`"version"`)
2. `package-lock.json` (`"version"` and `packages[""].version`)
3. `hh-quote-builder.php` plugin header (`* Version: x.x.x`)
4. `hh-quote-builder.php` constant (`define('HHQB_VERSION', ... 'x.x.x');`)
   Make sure to ALWAYS bump the version if the change is considerable enough.
   Always re-run `npm run build` after editing `src/`. `bundle.js` is committed to git.

---

## Architectural Constraints (DO NOT BREAK)

### 1. Elementor Form HTML Stripping & Script Injection

- **Do not output Alpine directives inside Elementor Form HTML fields via PHP**: Elementor sanitizes Form HTML fields on save/render, stripping Alpine attributes (`x-data`, `x-bind`, `@click`, etc.).
- **Interactive form markup must be injected via JS template literals** in `src/inject.js` and bound with `Alpine.initTree()`.
- Shortcodes inside the form (`[package_cards]`, `[addon_selector]`, `[selection_summary]`) must remain empty `<div>` containers. Only `[package_filters]` outputs Alpine markup in PHP because it lives in an external Shortcode widget outside the Form widget.

### 2. Script Enqueue & Execution Order

- The plugin registers `hh-quote-bundle` (`assets/js/bundle.js`) and `alpinejs` (`assets/vendor/alpinejs/cdn.min.js`), both with `'strategy' => 'defer'` and `'in_footer' => true`.
- `alpinejs` explicitly depends on `hh-quote-bundle`. This guarantees the bundle's `alpine:init` listener attaches before Alpine initializes.

### 3. Elementor Editor Preview Timing (Late Payload Pattern)

- In the Elementor editor preview, widgets are rendered asynchronously via AJAX after `alpine:init`.
- `src/store.js` initializes with empty fallback data first so `$store.quote` is never undefined, and applies `#hh-quote-data` via a one-shot `MutationObserver` once the DOM node appears.
- `src/inject.js` runs a throttled `MutationObserver` in editor preview to re-inject containers when Elementor replaces widgets.
- `src/bridge.js` syncs computed Alpine values to Elementor's native hidden fields (`input[name="form_fields[...]"]`) via `Alpine.effect()`. It warns after a 4s timeout if any target hidden field is missing.

### 4. Elementor Hidden Form Fields & Form Data Bridge

- **`selected_coverage`**: Formatted label via `coverageLabel` (e.g. `"Full Day"`).
- **`selected_style`**: Formatted label via `styleLabel` (e.g. `"Full Package"`).
- **`package_name`**: Label string from `selectedPackage`.
- **`base_price`**: Comma-formatted integer string via `formatNumber(price)`.
- **`estimated_total`**: Comma-formatted integer string via `formatNumber(total)`.
- **`selected_addons_summary`**: Add-on strings joined by `" • "` or `"None selected"`.
  - _Note_: Elementor's backend sanitizes hidden fields with `sanitize_text_field()`, which strips raw HTML tags like `<br>`. Newline characters (`\n`) are collapsed in email client tables. Do not use raw HTML tags in hidden fields.

### 5. Email Templates (`email-templates/`)

- Templates are authored in MJML (`client.mjml`, `customer.mjml`) and compiled to static HTML (`client.html`, `customer.html`).
- **Never paste `.mjml` code into Elementor form email settings**: Elementor requires compiled HTML (`.html`).
- Styling uses neutral fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`), neutral colors (`#313A33` header, `#1a1a1a`, `#595959`), and sentence casing (avoid all-caps).
- `customer.mjml` must contain the indicative estimate disclaimer.
