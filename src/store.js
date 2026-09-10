/**
 * Alpine store — the single source of truth for quote state.
 *
 * Registered inside alpine:init, which is guaranteed to fire after this
 * bundle executes (the bundle is a declared dependency of the alpinejs
 * handle, and deferred scripts execute in document order).
 *
 * Late-payload pattern (load-bearing — see
 * docs/elementor-editor-and-wppusher-research.md §1.4):
 * the store is ALWAYS registered at alpine:init, initially with empty
 * placeholder data, so Alpine expressions never read $store.quote as
 * undefined. On the frontend the #hh-quote-data JSON payload is
 * server-rendered and present at alpine:init, so the real data is applied
 * synchronously in the same tick — behavior identical to a store created
 * with real data. In the Elementor editor preview the payload arrives via
 * AJAX after alpine:init, so a one-shot MutationObserver applies it the
 * moment the shortcode widget renders, then disconnects.
 *
 * Also includes effect #1: when coverage changes and the current style is
 * no longer valid, auto-select the first valid style for the new coverage.
 */
export function initStore() {
  document.addEventListener("alpine:init", () => {
    Alpine.store("quote", {
      packages: [],
      coverageChoices: {},
      styleChoices: {},
      availableCoverage: [],
      styleToCoverages: {},
      coverage: null,
      style: null,
      selectedPackage: null,
      addonState: {},

      get availableCoverageList() {
        return this.availableCoverage.map((slug) => ({
          slug,
          label: this.coverageChoices[slug],
        }));
      },
      get styleList() {
        return Object.keys(this.styleToCoverages).map((slug) => ({
          slug,
          label: this.styleChoices[slug],
          isValid: this.coverage
            ? this.styleToCoverages[slug].includes(this.coverage)
            : false,
        }));
      },
      get coverageLabel() {
        return this.coverageChoices[this.coverage] || "";
      },
      get styleLabel() {
        return this.styleChoices[this.style] || "";
      },
      get visiblePackages() {
        if (!this.coverage || !this.style) return [];
        return this.packages.filter(
          (p) => p.coverage === this.coverage && p.style === this.style,
        );
      },
      get total() {
        if (!this.selectedPackage) return 0;
        let total = this.selectedPackage.price;
        for (const addon of this.selectedPackage.addons) {
          const sel = this.addonState[addon.id];
          if (!sel?.checked) continue;
          const qty = addon.type === "quantity" ? Number(sel.qty || 0) : 1;
          if (addon.type === "quantity" && !qty) continue;
          total += addon.price * qty;
        }
        return Math.round(total * 100) / 100;
      },
      get addonSummaryLines() {
        if (!this.selectedPackage) return [];
        return this.selectedPackage.addons
          .filter((a) => this.addonState[a.id]?.checked)
          .map((a) => {
            const qty =
              a.type === "quantity"
                ? Number(this.addonState[a.id].qty || 0)
                : 1;
            if (a.type === "quantity" && !qty) return null;
            const addonTotal = Math.round(a.price * qty * 100) / 100;
            const qtyPrefix = a.type === "quantity" ? `${qty}x ` : "";
            return {
              id: a.id,
              text: `${qtyPrefix}${a.label} + $${this.formatNumber(addonTotal)}`,
            };
          })
          .filter(Boolean);
      },
      get hasSelectedAddons() {
        return this.addonSummaryLines.length > 0;
      },

      formatNumber(n) {
        return Number(n || 0).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
      },

      clearSelection() {
        this.selectedPackage = null;
        this.addonState = {};
      },

      selectPackage(pkg) {
        this.selectedPackage = pkg;
        this.addonState = Object.fromEntries(
          pkg.addons.map((a) => [
            a.id,
            {
              checked: false,
              qty: null,
            },
          ]),
        );
        Alpine.nextTick(() =>
          window.HHQuoteNav.afterPackageSelect(pkg.addons.length),
        );
      },
    });

    // Apply the real payload. Frontend: element is server-rendered and
    // already present → synchronous, one-shot. Editor preview: element is
    // AJAXed in later → one-shot observer, disconnected on success.
    function applyPayload(raw) {
      const store = Alpine.store("quote");
      store.packages = raw.packages;
      store.coverageChoices = raw.coverageChoices;
      store.styleChoices = raw.styleChoices;
      store.availableCoverage = raw.availableCoverage;
      store.styleToCoverages = raw.styleToCoverages;
      store.coverage = raw.defaultCoverage;
      store.style = raw.defaultStyle ?? null;
    }

    function tryApplyFromDom() {
      const dataEl = document.getElementById("hh-quote-data");
      if (!dataEl) return false;
      let raw;
      try {
        raw = JSON.parse(dataEl.textContent);
      } catch (err) {
        console.error("[HH Quote Builder] Failed to parse quote data:", err);
        return true; // Don't keep retrying a permanently broken payload.
      }
      applyPayload(raw);
      return true;
    }

    if (!tryApplyFromDom()) {
      const observer = new MutationObserver(() => {
        if (tryApplyFromDom()) observer.disconnect();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    // Effect #1 — when coverage changes and the current style is no longer
    // valid, auto-select the first valid style for the new coverage (null
    // only if none exist). Before the payload arrives the store is empty
    // and styleList is [], so this is a no-op until real data lands.
    Alpine.effect(() => {
      const store = Alpine.store("quote");
      if (
        store.style &&
        !store.styleList.find((s) => s.slug === store.style && s.isValid)
      ) {
        const firstValid = store.styleList.find((s) => s.isValid);
        store.style = firstValid ? firstValid.slug : null;
      }
    });

    // Invalidate package selection when coverage or style changes.
    // If a user selected a package, went back to step 1, and switched
    // filters, clear the stale package so a quote never submits
    // mismatched filters and package data.
    Alpine.effect(() => {
      const store = Alpine.store("quote");
      if (store.selectedPackage) {
        if (
          store.selectedPackage.coverage !== store.coverage ||
          store.selectedPackage.style !== store.style
        ) {
          store.clearSelection();
        }
      }
    });
  });
}
