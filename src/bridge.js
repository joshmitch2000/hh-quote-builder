/**
 * Elementor bridge — effect #2.
 *
 * On every reactive change, writes computed values into Elementor's real
 * native Hidden <input name="form_fields[...]"> elements. This is the only
 * point where Alpine state becomes what actually gets emailed/submitted.
 * Alpine cannot bind directly to Elementor's own hidden-field markup (no
 * Custom Attributes control on Form fields), so this imperative sync is
 * necessary and intentional — not a workaround to remove.
 */
export function initBridge() {
  const FIELD_MAP = {
    selected_coverage: () => Alpine.store("quote").coverage || "",
    selected_style: () => Alpine.store("quote").style || "",
    package_name: () => Alpine.store("quote").selectedPackage?.label || "",
    base_price: () => Alpine.store("quote").selectedPackage?.price ?? "",
    estimated_total: () =>
      Alpine.store("quote").selectedPackage
        ? Alpine.store("quote").total
        : "",
    selected_addons_summary: () =>
      Alpine.store("quote")
        .addonSummaryLines.map((l) => l.text)
        .join(", "),
  };

  document.addEventListener("alpine:init", () => {
    // One-time sanity check: warn loudly if any target hidden field is
    // missing. Protects against someone editing the Elementor form later
    // and silently breaking quote submission.
    for (const fieldId of Object.keys(FIELD_MAP)) {
      if (!document.querySelector(`input[name="form_fields[${fieldId}]"]`)) {
        console.warn(
          `[HH Quote Builder] Missing Elementor hidden field: form_fields[${fieldId}]. ` +
            "Quote submissions will be incomplete until this field exists in the form.",
        );
      }
    }

    Alpine.effect(() => {
      for (const [fieldId, getValue] of Object.entries(FIELD_MAP)) {
        const input = document.querySelector(
          `input[name="form_fields[${fieldId}]"]`,
        );
        if (input) input.value = getValue();
      }
    });
  });
}
