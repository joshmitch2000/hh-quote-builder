/**
 * Native Elementor step navigation.
 *
 * Clicks Elementor's own native next/previous buttons rather than
 * reimplementing step logic. Handles forward-skip of empty Step 2
 * (no add-ons) and backward-skip via a click listener on the native
 * "Go back" button + requestAnimationFrame re-click if it lands on an
 * empty Step 2.
 *
 * Editor-safe: skipped entirely in the Elementor editor preview — the
 * editor renders all steps stacked, so step navigation is meaningless and
 * clicking native next/prev buttons would fight the editor's own
 * widget-selection clicks. Detection uses the ?elementor-preview= URL
 * param (always present in the preview iframe; see
 * docs/elementor-editor-and-wppusher-research.md §1.1) because
 * window.elementor is NOT yet defined in the iframe when this deferred
 * bundle executes — the parent editor injects it only after the iframe's
 * load event (§1.3).
 */
export function initNav() {
  const formWrapper = document.getElementById("form");
  const isEditor = new URLSearchParams(window.location.search).has(
    "elementor-preview",
  );

  window.HHQuoteNav = (function () {
    function activeStepEl() {
      return formWrapper?.querySelector(".e-form__step:not(.elementor-hidden)");
    }
    function scrollToForm() {
      document
        .getElementById("package_quote_form")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    function clickNext() {
      activeStepEl()
        ?.querySelector(".e-form__buttons__wrapper__button-next")
        ?.click();
      scrollToForm();
    }
    return {
      afterPackageSelect(addonCount) {
        if (isEditor) return;
        clickNext();
        if (addonCount === 0) clickNext();
      },
    };
  })();

  if (isEditor) return;

  formWrapper?.addEventListener("click", (e) => {
    const btn = e.target.closest(".e-form__buttons__wrapper__button-previous");
    if (!btn) return;
    // rAF: guards Elementor's own step timing, not load timing — keep.
    requestAnimationFrame(() => {
      const addons = Alpine.store("quote")?.selectedPackage?.addons ?? [];
      const stillOnStep2 = document.querySelector(
        ".elementor-field-group-addons:not(.elementor-hidden)",
      );
      if (addons.length === 0 && stillOnStep2) btn.click();
    });
  });

  // ---------- Hide filters outside Step 1 ----------
  // Only the [package_filters] widget (a genuine DOM sibling of the form,
  // invisible to Elementor's own step-hiding) needs this. The disclaimer
  // lives inside Step 1's own field group, so native step-hiding covers it.
  function syncStepVisibility() {
    const isStep1 = !formWrapper
      ?.querySelector(".elementor-field-group-package")
      ?.classList.contains("elementor-hidden");
    document.querySelectorAll(".js-step1-only").forEach((el) => {
      el.style.display = isStep1 ? "" : "none";
    });
  }
  const fieldsWrapper = document.querySelector(".elementor-form-fields-wrapper");
  if (fieldsWrapper) {
    new MutationObserver(syncStepVisibility).observe(fieldsWrapper, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  }
  syncStepVisibility();
}
