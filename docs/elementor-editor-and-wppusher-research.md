# Elementor editor preview & WP Pusher deployment — research

Investigation into why the quote builder renders on the frontend but not inside the Elementor editor preview. All claims traced to primary sources (Elementor source, WordPress core source/docs, WP Pusher official docs).

## Verdict (short answer)

| Hypothesis | Where the evidence points |
|---|---|
| New code never arrived on the server (WP Pusher-side) | **Unlikely, but verifiable in 2 minutes.** WP Pusher has no documented mechanism that would selectively drop or stale a committed `assets/js/bundle.js`. Since the *frontend* of the same deploy works, the deployment almost certainly arrived. Main WP Pusher failure modes (webhook not configured, wrong branch, 301 redirect on the Push-to-Deploy URL) are easy to rule out via its Log tab and GitHub's webhook settings. |
| `wp_enqueue_scripts` / `is_page('wedding-music-packages')` gate fails inside the preview iframe | **Refuted by Elementor source.** The iframe loads the page's normal permalink with `?elementor-preview=<id>`; the main query resolves normally, `wp_enqueue_scripts` fires, and the plugin's scripts will be printed in the iframe document. |
| Defer ordering broken (Alpine before bundle) | **Refuted by WordPress core docs + source.** Deferred scripts execute in document order; dependency ordering is preserved by the strategy-eligibility logic. |
| Bundle executes before the shortcode container exists in the DOM | **Primary suspect — plugin-side timing issue.** In the editor preview, Elementor replaces `the_content` with an *empty wrapper* and renders every widget (including the Shortcode widget's server-rendered HTML) **asynchronously via AJAX after page load**, injecting it with jQuery `.append()` inside `_.defer()`. On the frontend the same shortcode HTML is server-rendered into the initial HTML, so a deferred bundle finds its containers; in the editor preview it runs before they exist. |
| Bundle references `window.elementor` at parse/exec time | **Secondary plugin-side issue.** `window.elementor` is *not* defined inside the iframe when deferred scripts execute; the parent editor injects it into the iframe only after the iframe's `load` event. |
| jQuery `ready` timing | **Relevant nuance — Elementor behavior, not a bug.** The preview iframe calls `jQuery.holdReady(true)`; ready callbacks are held until the editor finishes its first render pass. |
| Elementor strips/blocks third-party deferred scripts in the preview | **No evidence of any such mechanism in source.** (It only adds `data-cfasync="false"` for Cloudflare Rocket Loader compat.) |

**Bottom line:** plugin-side lifecycle/timing issue, not a WP Pusher delivery failure. Fix direction: keep re-running injection as containers appear (a persistent `MutationObserver` on `document.documentElement` with `subtree: true` — observing the container nodes themselves is useless because Elementor's re-render *discards* those nodes), and detect the editor via the `?elementor-preview=` URL param rather than `window.elementor` at init time.

## 1. Elementor editor preview iframe mechanics

### 1.1 The preview is an iframe loading the page frontend with a query param

- The editor creates the iframe in JS: `<iframe id="elementor-preview-iframe" src="<preview URL>">` appended into `#elementor-preview-responsive-wrapper`, with an `onPreviewLoaded` handler bound to its `load` event.
  - https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/editor-base.js — `initPreview()`, L565–586 (iframe created L575–580, src = `this.config.initial_document.urls.preview` L577, load handler L585).
- The preview URL is the document's permalink plus `elementor-preview=<post_id>&ver=<time()>`:
  ```php
  $url = set_url_scheme( add_query_arg( [
      'elementor-preview' => $this->get_main_id(),
      'ver' => time(),
  ], $this->get_permalink() ) );
  ```
  - https://github.com/elementor/elementor/blob/main/core/base/document.php — `get_preview_url()`, L1000–1030 (filterable via `elementor/document/urls/preview`).
- Server-side, preview mode is detected purely from `$_GET['elementor-preview']` compared against `get_the_ID()`, plus an edit-capability check:
  - https://github.com/elementor/elementor/blob/main/includes/preview.php — `is_preview_mode()`, L183–201.
  - Note: the fact that this method compares the query param against `get_the_ID()` confirms the request's **main query resolves to the edited page** — so `is_page('wedding-music-packages')` will return `true` in the iframe request, and any `wp_enqueue_scripts` callback gated on it will run.

### 1.2 Does `wp_enqueue_scripts` fire in the iframe request?

**Yes.** The iframe URL is an ordinary frontend page request. WordPress core fires `wp_enqueue_scripts` from `wp_head`:
- https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/default-filters.php — L350: `add_action( 'wp_head', 'wp_enqueue_scripts', 1 );`

And Elementor's preview bootstrap explicitly hooks its own enqueues onto `wp_enqueue_scripts`:
- https://github.com/elementor/elementor/blob/main/includes/preview.php — `init()`, L114–117.

**Contrast — the editor *parent* document** (the editor UI itself, loaded at `?action=elementor`): there Elementor deliberately nukes all other plugins' enqueues:
- https://github.com/elementor/elementor/blob/main/core/editor/editor.php — L126–150 (`remove_all_actions( 'wp_enqueue_scripts' )` etc.). So plugin frontend scripts **never load in the parent editor frame** — by design. They load only in the iframe.

### 1.3 Globals inside the preview iframe window

- **`window.elementorFrontend` — defined inside the iframe.** The Elementor frontend JS instantiates it in whatever window loads `frontend.js`:
  - https://github.com/elementor/elementor/blob/main/assets/dev/js/frontend/frontend.js — L377–381:
    ```js
    window.elementorFrontend = new Frontend();
    if ( ! elementorFrontend.isEditMode() ) {
        jQuery( () => elementorFrontend.init() );
    }
    ```
  - Its config (`elementorFrontendConfig`) is printed as an inline `before` script attached to the `elementor-frontend` handle: https://github.com/elementor/elementor/blob/main/includes/frontend.php — `enqueue_scripts()` L617–639; https://github.com/elementor/elementor/blob/main/core/base/app.php — `print_config()` L31–43; https://github.com/elementor/elementor/blob/main/includes/utils.php — `print_js_config()` L611–622.
- **`elementorFrontend.isEditMode()` — exists and returns `true` inside the editor preview iframe.**
  - https://github.com/elementor/elementor/blob/main/assets/dev/js/frontend/frontend.js — L171–173: `isEditMode() { return this.config.environmentMode.edit; }`
  - The config value is set from `Preview::is_preview_mode()`: https://github.com/elementor/elementor/blob/main/includes/frontend.php — `get_init_settings()`, L1402, L1422–1423: `'environmentMode' => [ 'edit' => $is_preview_mode, ... ]`.
- **`window.elementor` — NOT defined inside the iframe at parse time.** It is injected into the iframe's window by the *parent* editor only after the iframe fires `load`:
  - https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/editor-base.js — `initFrontend()`, L618–630:
    ```js
    const frontendWindow = this.$preview[ 0 ].contentWindow;
    window.elementorFrontend = frontendWindow.elementorFrontend; // parent aliases iframe's object
    frontendWindow.elementor = this;                             // parent injects itself into iframe
    frontendWindow.elementorCommon = elementorCommon;
    elementorFrontend.init();
    ```
  - Implication: any third-party deferred script in the iframe that touches `window.elementor` during initial execution gets `undefined`. `window.elementor` in the parent frame is the editor app itself (`window.elementor = new Editor()` — https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/editor.js — L18).
- Also note frontend.js L217–219: in edit mode the frontend waits for `elementor.once( 'document:loaded', ... )` — i.e., in the iframe, Elementor's own frontend init is orchestrated by the parent editor, not by DOM ready.

### 1.4 How widget/shortcode output renders in the editor preview (the critical mechanism)

- **The server-rendered page inside the iframe contains no widget content.** In preview mode, `the_content` is replaced by an *empty wrapper div*:
  - https://github.com/elementor/elementor/blob/main/includes/preview.php — hook at L119: `add_filter( 'the_content', [ $this, 'builder_wrapper' ], 999999 );` and `builder_wrapper()` L228–238.
  - The official docs say the same: "Preview… is rendered by a JavaScript engine, typically without loading from the server side." — https://developers.elementor.com/docs/editor/elementor-preview/
- **Widgets without a JS template (which includes the Shortcode widget) are rendered remotely, via AJAX, after the iframe loads.**
  - Template-type detection: https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/elements/views/widget.js — `getTemplateType()` L82–91 (`'js'` if a JS template exists, else `'remote'`).
  - Remote render flow: https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/elements/views/base-widget.js — L13–18.
  - Server endpoint: `render_widget` AJAX action — https://github.com/elementor/elementor/blob/main/includes/managers/widgets.php — registered L763–764, handler `ajax_render_widget()` L484–508.
  - HTML injection into the iframe DOM happens *deferred*: https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/elements/views/widget.js — `attachElContent()` L99–107: `_.defer( () => { elementorFrontend.elements.window.jQuery( this.el ).empty().append( ..., this.getHTMLContent( html ) ); } );`
- **Consequence:** the `<div class="elementor-shortcode">…</div>` container produced by the Shortcode widget does not exist in the iframe DOM when deferred footer scripts execute. It arrives later, via AJAX + jQuery insertion.
- **jQuery ready is additionally held** in the preview iframe until the editor finishes its first pass:
  - Hold: https://github.com/elementor/elementor/blob/main/includes/preview.php — L252: `wp_add_inline_script( 'jquery-migrate', 'jQuery.holdReady( true );' );`
  - Release: https://github.com/elementor/elementor/blob/main/assets/dev/js/editor/editor-base.js — `onPreviewLoaded()` L1259–1316, with `elementorFrontend.elements.window.jQuery.holdReady( false );` at L1300.
- **How the Shortcode widget renders:** server-side `do_shortcode()`, wrapped in a div:
  - https://github.com/elementor/elementor/blob/main/includes/widgets/shortcode.php — `render()` L134–145.
  - It also declares `is_reload_preview_required() { return true; }` (L83–85), exposed to the editor JS: https://github.com/elementor/elementor/blob/main/includes/base/widget-base.php — L1507: `'reload_preview' => $this->is_reload_preview_required(),` — i.e., editing the shortcode's settings triggers a *full preview iframe reload*, not an in-place patch. (On initial editor load, however, the widget HTML is fetched via the AJAX mechanism above.)
- **Scripts inside AJAX-injected widget HTML do not get native `defer` semantics** if a shortcode's output itself contains `<script>` tags: Elementor inserts widget HTML via jQuery `.append()`, and jQuery executes inserted inline scripts via `DOMEval` and external scripts via synchronous XHR + `globalEval`:
  - https://github.com/jquery/jquery/blob/main/src/core/DOMEval.js
  - https://github.com/jquery/jquery/blob/main/src/manipulation/_evalUrl.js
- **Does Elementor strip/defer-block third-party scripts in the preview?** No such mechanism found in source. The only script-tag manipulation is adding `data-cfasync="false"` to every tag to defeat Cloudflare Rocket Loader: https://github.com/elementor/elementor/blob/main/includes/preview.php — `rocket_loader_filter()` L341–343. The preview also sends a no-cache directive (`Utils::do_not_cache()` at L127) and disables the admin bar (L112).

### 1.5 Official hooks for enqueueing into each context

All listed in Elementor's official hook index: https://developers.elementor.com/docs/hooks/php/

| Hook | Where it fires | Source |
|---|---|---|
| `elementor/preview/enqueue_scripts` | **Only in the preview iframe request** | https://github.com/elementor/elementor/blob/main/includes/preview.php — L338; docs: https://developers.elementor.com/docs/scripts-styles/preview-scripts/ |
| `elementor/preview/enqueue_styles` | Same — preview iframe only | https://github.com/elementor/elementor/blob/main/includes/preview.php — L299 |
| `elementor/editor/after_enqueue_scripts` (+ `before_`) | **Only in the editor parent document** | https://github.com/elementor/elementor/blob/main/core/editor/editor.php — L394–428; docs: https://developers.elementor.com/docs/scripts-styles/editor-scripts/ |
| `elementor/frontend/after_enqueue_scripts` (+ `before_`) | **Normal frontend and the preview iframe** | https://github.com/elementor/elementor/blob/main/includes/frontend.php — L617–639, `wp_footer()` L838–846; https://github.com/elementor/elementor/blob/main/includes/preview.php — L355–364 |

For JS-side re-initialization when a widget renders, the documented hooks are `elementorFrontend.hooks.addAction( 'frontend/element_ready/widget' | 'frontend/element_ready/global' | 'frontend/element_ready/{elementType.skinName}', cb )` and `elementor/frontend/init`: https://developers.elementor.com/docs/hooks/js/

## 2. WP Pusher deployment behavior

Primary sources: official docs at docs.wppusher.com + wppusher.com. **The WP Pusher plugin's own source code is not publicly available** — the GitHub org (https://github.com/wppusher) contains only documentation and small add-ons, so internal behavior can only be cited to official docs.

- **How it deploys:** No `git` on the server; WP Pusher "uses the APIs of these services [GitHub/Bitbucket/GitLab] to pull your code whenever it needs to install or update a plugin or theme" (https://docs.wppusher.com/article/11-hello-wppusher), and "hooks into core WordPress functionality… the upgrader, that is" (https://wppusher.com/faq; also https://wppusher.com/features). I.e., it fetches an archive/copy via the host's API and installs through WordPress's normal plugin upgrader. **No primary source indicates any build step** (no composer/npm run); the documented CI pattern is an *external* CI hitting the secret Push-to-Deploy URL after building (https://docs.wppusher.com/article/24-automatic-updates-with-push-to-deploy).
- **Push-to-Deploy (auto-deploy on push):**
  - Requires a webhook: for GitHub/Bitbucket, WP Pusher creates it automatically when you enable Push-to-Deploy (requires a saved API token); for GitLab you must create it manually. Sources: https://docs.wppusher.com/article/24-automatic-updates-with-push-to-deploy, https://docs.wppusher.com/article/20-github-webhooks-and-push-to-deploy, https://docs.wppusher.com/article/13-working-with-plugins-and-themes.
  - A token is needed "to use private repositories and to enable Push-to-Deploy" (https://docs.wppusher.com/article/6-getting-started). Private repositories require a paid license; free tier is "Only public repositories" (https://wppusher.com/#pricing). The docs do not state that Push-to-Deploy itself is paywalled beyond the token requirement.
  - **Without the webhook, nothing updates automatically**; the fallback is the manual "Update plugin/theme" button on the WP Pusher → Plugins/Themes screen (https://docs.wppusher.com/article/13-working-with-plugins-and-themes).
- **Failure modes that would make the new bundle never arrive / arrive stale** (all documented):
  - Push-to-Deploy simply not enabled, or the Push-to-Deploy URL returning a **301 redirect** (site_url trailing-slash mismatch) — GitHub does not follow redirects, so the update silently never fires: https://docs.wppusher.com/article/30-troubleshooting.
  - **Wrong branch**: "Repository branch: (Optional)… **Defaults to `master` if left blank**" (https://docs.wppusher.com/article/13-working-with-plugins-and-themes). If the repo's branch is `main` and the field was left blank, installs/updates would target a non-existent or stale branch.
  - "Link installed plugin" requires the server folder name to equal the repository name (same article).
- **File-related limits (export-ignore, .gitignore, symlinks, case-sensitivity, size limits):** **No primary source found.** The WP Pusher knowledge base has no article on these. *Inference, flagged as such:* since WP Pusher pulls via the Git host's API rather than a server-side `git clone`, `.gitignore` is irrelevant (it only affects what gets committed), while `.gitattributes export-ignore` *would* matter if the host serves an archive generated by `git archive` (which honors `export-ignore` — spec: https://git-scm.com/docs/gitattributes#_export_ignore). Verify empirically (see diagnostics).
- **Error reporting:** a "Log" tab in the WP Pusher settings area: "You can enable logging under the 'Log' tab in the WP Pusher settings area" (https://docs.wppusher.com/article/30-troubleshooting). Updates can also be triggered by hitting the Push-to-Deploy URL directly (https://docs.wppusher.com/article/13-working-with-plugins-and-themes).

## 3. WordPress deferred-script ordering (core)

- **Defer semantics & ordering:** "Scripts marked for deferred execution — via the `defer` script attribute — are only executed once the DOM tree has fully loaded (but before the `DOMContentLoaded` and window load events). **Deferred scripts are executed in the same order they were printed/added in the DOM**" — https://developer.wordpress.org/reference/functions/wp_register_script/ ("Delayed Script Loading" section).
- **Dependency tree respected:** "When applying a loading strategy via either the `wp_register_script()` and `wp_enqueue_script()` functions, the scripts dependency tree is taken into consideration and the most eligible loading strategy is applied. While the intended (delayed) strategy passed by the code author may not be the final one, it will never be a stricter one, thus maintaining the integrity of the dependency tree." — same page. The 6.3 dev note adds: a defer script's dependencies must be defer or blocking, and its dependents must be defer, otherwise the tree is downgraded to blocking to preserve execution order — https://make.wordpress.org/core/2023/07/14/registering-scripts-with-async-and-defer-attributes-in-wordpress-6-3/.
- **Core source confirmation** (https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/class-wp-scripts.php):
  - Delayed strategies list: L145 (`private $delayed_strategies = array( 'defer', 'async' );`).
  - Eligible-strategy resolution: `get_eligible_loading_strategy()` L1046+; called at L316; the `defer` attribute printed at L460–464.
  - Delayed scripts with header group are moved to the footer when dependents are in the footer: L323–340.
  - Caveat: a script with an inline script attached in the **after** position "cannot be delayed" (comment at L1117) — it becomes blocking. (Inline `before` scripts do not affect defer eligibility. Elementor's own `elementorFrontendConfig` is attached as `before`, so it does not break Elementor's deferred chain; see §1.3.)
- **Net for this plugin:** with bundle registered `defer` + `in_footer` and Alpine depending on the bundle, core will print bundle-then-Alpine in that order in the footer, both deferred, executing in that order before `DOMContentLoaded`. Ordering is **not** the problem. The problem is *when* that execution happens relative to Elementor's asynchronous widget rendering (§1.4).

## Open questions / what to check on the live site

1. **Does the bundle script tag exist in the iframe document at all?** Open the editor → DevTools → Network (filter `bundle.js` / `alpine`) → reload the editor. The iframe request is the page URL with `?elementor-preview=<id>&ver=…`.
   - If the request **404s or serves an old hash/content** → deployment problem; go to step 4.
   - If it **200s with the new content** → WP Pusher is exonerated; it's a timing/lifecycle issue (step 2).
2. **Does the shortcode container exist in the iframe DOM after the editor settles?** In DevTools console, switch the execution context to `#elementor-preview-iframe` and query the plugin's container selector. Also check:
   - `typeof elementorFrontend` → should be `"object"`; `elementorFrontend.isEditMode()` → should be `true` (per frontend.js L171–173 + frontend.php L1422–1423).
   - `typeof window.elementor` → `"object"` *after* load (it is injected by the parent, editor-base.js L623); if the bundle touched it at parse time there will be an early console error.
   - Whether the bundle executed *before* the container appeared: expected result in the iframe: container is `null` at deferred-execution time (because `the_content` is an empty wrapper until AJAX rendering completes — preview.php L228–238, widgets.php L484–508, widget.js L99–107).
3. **If the timing race is confirmed**, the plugin-side fix (no WP Pusher change needed): keep re-running injection as containers appear (persistent `MutationObserver` on `document.documentElement` with `subtree: true`), or initialize on `elementorFrontend.hooks.addAction( 'frontend/element_ready/widget', … )` / `frontend/element_ready/global` (https://developers.elementor.com/docs/hooks/js/). Optionally enqueue an editor-preview-only init script via `elementor/preview/enqueue_scripts` (https://developers.elementor.com/docs/scripts-styles/preview-scripts/).
4. **WP Pusher verification (to formally rule it out):**
   - WP admin → WP Pusher → Plugins/Themes: check the plugin row, click **Update plugin** manually, and compare the deployed `wp-content/plugins/hh-quote-builder/assets/js/bundle.js` against the file in the GitHub repo.
   - Enable the **Log** tab in WP Pusher settings and re-run an update to see errors (https://docs.wppusher.com/article/30-troubleshooting).
   - Verify the configured **branch** (blank = `master`; if the repo uses `main`, that's a staleness bug — https://docs.wppusher.com/article/13-working-with-plugins-and-themes).
   - GitHub repo → Settings → Webhooks: confirm the WP Pusher webhook exists and its Recent Deliveries show 200s (not 301s — https://docs.wppusher.com/article/30-troubleshooting).
   - Check the repo for `.gitattributes` with `export-ignore` covering `assets/` or `*.js`.
5. **Cache-busting:** the preview page itself is marked do-not-cache (preview.php L127), but the *JS file* can still be browser/CDN-cached — confirm the `?ver=` query string on the bundle's `<script>` tag changes after each deploy.
