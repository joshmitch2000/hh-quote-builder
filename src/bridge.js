/**
 * Elementor bridge — effect #2.
 *
 * On every reactive change, writes computed values into Elementor's real
 * native Hidden <input name="form_fields[...]"> elements. This is the only
 * point where Alpine state becomes what actually gets emailed/submitted.
 * Alpine cannot bind directly to Elementor's own hidden-field markup (no
 * Custom Attributes control on Form fields), so this imperative sync is
 * necessary and intentional — not a workaround to remove.
 *
 * The sync effect is registered unconditionally and simply no-ops for
 * inputs that don't exist yet — in the Elementor editor preview the form
 * widget is AJAX-rendered after alpine:init, so the inputs appear later
 * and the effect picks them up on the next reactive change.
 */
export function initBridge() {
  const FIELD_MAP = {
    selected_coverage: () => Alpine.store("quote").coverageLabel || "",
    selected_style: () => Alpine.store("quote").styleLabel || "",
    package_name: () => Alpine.store("quote").selectedPackage?.label || "",
    base_price: () => {
      const price = Alpine.store("quote").selectedPackage?.price;
      return price != null ? Alpine.store("quote").formatNumber(price) : "";
    },
    estimated_total: () =>
      Alpine.store("quote").selectedPackage
        ? Alpine.store("quote").formatNumber(Alpine.store("quote").total)
        : "",
    selected_addons_summary: () => {
      const lines = Alpine.store("quote").addonSummaryLines.map((l) => l.text);
      return lines.length > 0 ? lines.join(" • ") : "None selected";
    },
  };

  document.addEventListener("alpine:init", () => {
    Alpine.effect(() => {
      for (const [fieldId, getValue] of Object.entries(FIELD_MAP)) {
        const input = document.querySelector(
          `input[name="form_fields[${fieldId}]"]`,
        );
        if (input) input.value = getValue();
      }
    });

    // One-time sanity check: warn loudly if any target hidden field is
    // missing. Protects against someone editing the Elementor form later
    // and silently breaking quote submission. Delayed because in the
    // editor preview the form widget renders via AJAX after alpine:init —
    // checking immediately would false-positive there. Long enough for
    // the frontend too (fields are server-rendered well before this).
    setTimeout(() => {
      for (const fieldId of Object.keys(FIELD_MAP)) {
        if (!document.querySelector(`input[name="form_fields[${fieldId}]"]`)) {
          console.warn(
            `[HH Quote Builder] Missing Elementor hidden field: form_fields[${fieldId}]. ` +
              "Quote submissions will be incomplete until this field exists in the form.",
          );
        }
      }
    }, 4000);
  });
}
