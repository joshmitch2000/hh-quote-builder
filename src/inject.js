/**
 * Template injection — runs on alpine:initialized, after Alpine's first pass.
 *
 * Elementor sanitizes Form-widget HTML fields (strips <input>, <select>,
 * <template>, x-* attributes), so all interactive markup inside the form
 * lives here as template-literal strings — they never touch PHP/kses, so
 * nothing gets stripped. Alpine.initTree() binds directives on content
 * added after Alpine.start() already ran.
 *
 * Editor preview (see docs/elementor-editor-and-wppusher-research.md §1.4):
 * the iframe's initial HTML contains NO widget markup — Elementor replaces
 * the_content with an empty wrapper and renders every widget via AJAX after
 * page load, and re-renders (jQuery .empty().append()) on panel changes.
 * So at alpine:initialized the shortcode containers usually don't exist
 * yet, and when they do get re-rendered the container nodes themselves are
 * discarded. Hence the observer watches document.documentElement with
 * subtree (a node Elementor never replaces) and simply re-runs injectAll,
 * which fills any present-but-empty container. Editor-only: the frontend
 * never re-renders, so it gets zero observer overhead.
 */
export function initInject() {
  // The preview iframe URL always carries ?elementor-preview=<id>
  // (Elementor core/base/document.php get_preview_url()). This is reliable
  // at deferred-script execution time, unlike window.elementor, which the
  // parent editor only injects into the iframe after its load event.
  const isEditorPreview = new URLSearchParams(window.location.search).has(
    "elementor-preview",
  );

  function injectAll() {
    const cardsEl = document.getElementById("cards-container");
    if (cardsEl && !cardsEl.hasChildNodes()) {
      cardsEl.innerHTML = `
            <div id="cards" x-data>
                <template x-for="(pkg, index) in $store.quote.visiblePackages" :key="pkg.coverage + pkg.style + pkg.label">
                    <div class="package-card" :style="{ '--card-index': index }">
                        <h3 class="package-card__title" x-text="pkg.label"></h3>
                        <p class="package-card__price">$<span x-text="$store.quote.formatNumber(pkg.price)" class="price-amount"></span> <span class="price-suffix">+ GST</span></p>
                        <p class="package-card__description" x-text="pkg.description"></p>
                        <button type="button" class="package-card__select" @click="$store.quote.selectPackage(pkg)">Select this package</button>
                        <div class="package-card__divider" aria-hidden="true"></div>
                        <ul class="package-card__features">
                            <template x-for="feature in pkg.features" :key="feature">
                                <li x-text="feature"></li>
                            </template>
                        </ul>
                    </div>
                </template>
                <p class="placeholder" x-show="!$store.quote.coverage || !$store.quote.style">
                    Select a coverage and style above to see packages.
                </p>
            </div>
        `;
      Alpine.initTree(cardsEl);
    }

    const addonsEl = document.getElementById("addons-container");
    if (addonsEl && !addonsEl.hasChildNodes()) {
      addonsEl.innerHTML = `
            <div id="addons" x-data>
                <p class="addons-selected-package" x-text="$store.quote.selectedPackage?.label"></p>
                <h3>Select optional add-ons</h3>
                <template x-for="addon in $store.quote.selectedPackage?.addons ?? []" :key="addon.id">
                    <div class="addon-row" :class="{ 'addon-row--quantity': addon.type === 'quantity' }">
                        <label>
                            <input type="checkbox" x-model="$store.quote.addonState[addon.id].checked">
                            <span x-text="\`\${addon.label} ($\${$store.quote.formatNumber(addon.price)} + GST\${addon.unit ? ' ' + addon.unit : ''})\`"></span>
                        </label>
                        <div class="addon-row__qty" x-show="addon.type === 'quantity' && $store.quote.addonState[addon.id].checked">
                            <label>How many musicians would you like to add?</label>
                            <select x-model="$store.quote.addonState[addon.id].qty">
                                <option value="">Select number</option>
                                <template x-for="n in addon.max" :key="n">
                                    <option :value="n" x-text="n"></option>
                                </template>
                            </select>
                        </div>
                    </div>
                </template>
                <div class="total-box">
                    <div>Estimated total:</div>
                    <div class="amount"><span x-text="'$' + $store.quote.formatNumber($store.quote.total)"></span> <span>+ GST</span></div>
                </div>
            </div>
        `;
      Alpine.initTree(addonsEl);
    }

    const summaryEl = document.getElementById("selection-summary-container");
    if (summaryEl && !summaryEl.hasChildNodes()) {
      summaryEl.innerHTML = `
                <div id="selection-summary" x-data>
                    <div class="selection-summary__left">
                        <h3>Selection summary</h3>
                        <ul class="summary-list">
                            <li><span x-text="\`\${$store.quote.coverageLabel} + \${$store.quote.styleLabel}\`"></span></li>
                            <li><span x-text="$store.quote.selectedPackage?.label" class="package-label"></span><span x-text="$store.quote.selectedPackage?.price" class="package-price"></span></li>
                        </ul>
                        <template x-if="$store.quote.hasSelectedAddons">
                            <div class="selection-summary__addons">
                                <p class="summary-subtitle">Optional Add-ons</p>
                                <ul class="summary-list">
                                    <template x-for="line in $store.quote.addonSummaryLines" :key="line.id">
                                        <li><span x-text="line.text"></span></li>
                                    </template>
                                </ul>
                            </div>
                        </template>
                    </div>
                    <div class="selection-summary__total">
                        <div>Approximate total</div>
                        <div class="amount"><span x-text="'$' + $store.quote.formatNumber($store.quote.total)"></span> <span>+ GST</span></div>
                    </div>
                </div>
            `;
      Alpine.initTree(summaryEl);
    }
  }

  document.addEventListener("alpine:initialized", () => {
    injectAll();

    // Re-render the card grid whenever the visible package list changes.
    // #cards is injected via Alpine.initTree as a DETACHED tree from the
    // #filters tree — so when a coverage/style radio (bound in #filters)
    // mutates the store, the cards tree's own x-for does NOT reliably
    // re-subscribe, and the grid goes stale (renders 0 cards while
    // store.visiblePackages is non-empty). Rebuilding the inner #cards div
    // on identity change is explicit and cheap: the div is presentational
    // only, all selection state lives in the store. Runs on frontend AND
    // editor — the gap exists in both.
    //
    // Layout-shift guard: emptying the container collapses its height to 0,
    // which yanks the content below up and back down (the "flash"). Lock the
    // container's height to its current rendered height for the duration of
    // the rebuild so nothing below it moves; release after re-inject. Also
    // skip the rebuild entirely when the package list hasn't actually changed
    // (identity key comparison) so redundant filter changes don't rebuild.
    let lastKeys = null;
    const packageKeys = (pkgs) =>
      pkgs.map((p) => `${p.coverage}|${p.style}|${p.label}`).join(",");

    Alpine.effect(() => {
      const packages = Alpine.store("quote")?.visiblePackages ?? [];
      const keys = packageKeys(packages);
      if (keys === lastKeys) return; // nothing changed → no rebuild
      lastKeys = keys;

      const cardsEl = document.getElementById("cards-container");
      if (!cardsEl) return;

      // First population is handled by injectAll above; only rebuild when the
      // grid is already populated.
      if (!cardsEl.hasChildNodes()) return;

      // Lock height so content below doesn't jump during the empty→refill gap.
      const height = cardsEl.offsetHeight;
      cardsEl.style.minHeight = `${height}px`;

      cardsEl.innerHTML = "";
      Alpine.nextTick(() => {
        injectAll();
        // Re-trigger the enter animation each rebuild: the class persists on
        // the container across rebuilds, so remove → reflow → re-add to
        // restart it, then release the height lock after the new grid paints.
        cardsEl.classList.remove("cards--entering");
        void cardsEl.offsetWidth; // force reflow so the animation restarts
        cardsEl.classList.add("cards--entering");
        requestAnimationFrame(() => {
          cardsEl.style.minHeight = "";
        });
      });
    });

    if (!isEditorPreview) return;

    // Editor preview: containers arrive via AJAX after this point, and
    // Elementor's re-renders replace the container nodes entirely — so
    // observing the containers themselves is useless. Watch the document
    // root instead and re-run injectAll on any mutation; the guards below
    // keep it cheap and loop-free.
    let scheduled = false;
    let reinjecting = false;
    const observer = new MutationObserver(() => {
      // Alpine.initTree() mutates DOM heavily while binding; guard against
      // re-entrancy so binding mutations don't recursively retrigger us.
      if (reinjecting) return;
      // Coalesce mutation bursts (Elementor re-renders many widgets at
      // once) into a single injectAll per frame.
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        reinjecting = true;
        try {
          injectAll();
        } finally {
          reinjecting = false;
        }
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}
