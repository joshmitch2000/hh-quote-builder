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

  function getActiveStepNumber() {
    if (
      !formWrapper
        ?.querySelector(".elementor-field-group-package")
        ?.classList.contains("elementor-hidden")
    ) {
      return 1;
    }
    if (
      !formWrapper
        ?.querySelector(".elementor-field-group-addons")
        ?.classList.contains("elementor-hidden")
    ) {
      return 2;
    }
    return 3;
  }

  function scrollToActiveStep() {
    const step = getActiveStepNumber();
    const targetEl =
      step === 1
        ? document.querySelector(".js-step1-only") || formWrapper
        : formWrapper || document.getElementById("package_quote_form");

    if (!targetEl) return;

    const stickyHeader =
      document.getElementById("header_menu_section") ||
      document.querySelector(".elementor-sticky--active, .elementor-sticky");
    const headerOffset = stickyHeader ? stickyHeader.offsetHeight : 0;
    const buffer = 16;
    const targetY =
      window.scrollY +
      targetEl.getBoundingClientRect().top -
      headerOffset -
      buffer;

    if (Math.abs(window.scrollY - targetY) < 10) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: Math.max(0, Math.round(targetY)),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  let scrollRafId = null;
  function scheduleScroll() {
    if (scrollRafId) cancelAnimationFrame(scrollRafId);
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        const addons = Alpine.store("quote")?.selectedPackage?.addons ?? [];
        const stillOnStep2 = document.querySelector(
          ".elementor-field-group-addons:not(.elementor-hidden)",
        );
        if (addons.length === 0 && stillOnStep2) return;

        scrollToActiveStep();
      });
    });
  }

  window.HHQuoteNav = (function () {
    function activeStepEl() {
      return formWrapper?.querySelector(".e-form__step:not(.elementor-hidden)");
    }
    function clickNext() {
      activeStepEl()
        ?.querySelector(".e-form__buttons__wrapper__button-next")
        ?.click();
    }
    return {
      scrollToForm: scheduleScroll,
      afterPackageSelect(addonCount) {
        if (isEditor) return;
        clickNext();
        if (addonCount === 0) clickNext();
      },
    };
  })();

  if (isEditor) return;

  formWrapper?.addEventListener(
    "click",
    (e) => {
      // Guard step 1: do not allow advancing if no package is selected.
      const nextBtn = e.target.closest(
        ".e-form__buttons__wrapper__button-next",
      );
      if (nextBtn) {
        const isStep1 = !formWrapper
          ?.querySelector(".elementor-field-group-package")
          ?.classList.contains("elementor-hidden");
        if (isStep1 && !Alpine.store("quote")?.selectedPackage) {
          e.preventDefault();
          e.stopImmediatePropagation();
          document
            .getElementById("cards-container")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      const prevBtn = e.target.closest(
        ".e-form__buttons__wrapper__button-previous",
      );
      if (!prevBtn) return;
      // rAF: guards Elementor's own step timing, not load timing — keep.
      requestAnimationFrame(() => {
        const addons = Alpine.store("quote")?.selectedPackage?.addons ?? [];
        const stillOnStep2 = document.querySelector(
          ".elementor-field-group-addons:not(.elementor-hidden)",
        );
        if (addons.length === 0 && stillOnStep2) prevBtn.click();
      });
    },
    { capture: true },
  );

  // ---------- Hide filters outside Step 1 & sync step navigation scroll ----------
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

  let lastStep = getActiveStepNumber();
  function handleStepMutation() {
    syncStepVisibility();
    const currentStep = getActiveStepNumber();
    if (currentStep !== lastStep) {
      lastStep = currentStep;
      scheduleScroll();
    }
  }

  const fieldsWrapper = document.querySelector(".elementor-form-fields-wrapper");
  if (fieldsWrapper) {
    new MutationObserver(handleStepMutation).observe(fieldsWrapper, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  }
  syncStepVisibility();
}
