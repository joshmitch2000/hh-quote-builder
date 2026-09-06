/**
 * HH Quote Builder bundle entry point.
 *
 * Loaded with defer (see includes/assets.php), so the DOM is fully parsed
 * before this executes — no DOMContentLoaded/readyState guards needed.
 *
 * Per-section try/catch is intentional: an unrelated future error (bad ACF
 * data, Elementor markup change) should kill one section, not the whole file.
 */
import { initNav } from "./nav.js";
import { initStore } from "./store.js";
import { initBridge } from "./bridge.js";
import { initInject } from "./inject.js";

const sections = {
  nav: initNav,
  store: initStore,
  bridge: initBridge,
  inject: initInject,
};

for (const [name, init] of Object.entries(sections)) {
  try {
    init();
  } catch (err) {
    console.error(`[HH Quote Builder] Section "${name}" failed:`, err);
  }
}
