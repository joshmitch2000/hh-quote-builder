/**
 * Alpine store — the single source of truth for quote state.
 *
 * Registered inside alpine:init, which is guaranteed to fire after this
 * bundle executes (the bundle is a declared dependency of the alpinejs
 * handle, and deferred scripts execute in document order).
 *
 * Also includes effect #1: auto-clear an invalid style selection when
 * coverage changes.
 */
export function initStore() {
  document.addEventListener("alpine:init", () => {
    // Guard against bad/missing ACF data killing Alpine's entire startup —
    // this listener runs during Alpine.start(), so an uncaught throw here
    // would take down every Alpine component on the page, not just ours.
    const dataEl = document.getElementById("hh-quote-data");
    if (!dataEl) {
      console.error("[HH Quote Builder] #hh-quote-data payload not found.");
      return;
    }
    let raw;
    try {
      raw = JSON.parse(dataEl.textContent);
    } catch (err) {
      console.error("[HH Quote Builder] Failed to parse quote data:", err);
      return;
    }

    Alpine.store("quote", {
      packages: raw.packages,
      coverageChoices: raw.coverageChoices,
      styleChoices: raw.styleChoices,
      availableCoverage: raw.availableCoverage,
      styleToCoverages: raw.styleToCoverages,
      coverage: raw.defaultCoverage,
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
        return total;
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
            return {
              id: a.id,
              text: `${qty > 1 ? qty + " " : ""}${a.label} + $${this.formatNumber(a.price * qty)}`,
            };
          })
          .filter(Boolean);
      },
      get hasSelectedAddons() {
        return this.addonSummaryLines.length > 0;
      },

      formatNumber(n) {
        return Number(n || 0).toLocaleString("en-US");
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

    // Effect #1 — auto-clear an invalid style when coverage changes.
    Alpine.effect(() => {
      const store = Alpine.store("quote");
      if (
        store.style &&
        !store.styleList.find((s) => s.slug === store.style && s.isValid)
      ) {
        store.style = null;
      }
    });
  });
}
