/**
 * Template injection — runs on alpine:initialized, after Alpine's first pass.
 *
 * Elementor sanitizes Form-widget HTML fields (strips <input>, <select>,
 * <template>, x-* attributes), so all interactive markup inside the form
 * lives here as template-literal strings — they never touch PHP/kses, so
 * nothing gets stripped. Alpine.initTree() binds directives on content
 * added after Alpine.start() already ran.
 */
export function initInject() {
  // Re-entrancy guard: bfcache restores / plugin conflicts can double-fire
  // alpine:initialized; a second initTree on the same nodes would cause
  // duplicate bindings.
  let injected = false;

  document.addEventListener("alpine:initialized", () => {
    if (injected) return;
    injected = true;

    const cardsEl = document.getElementById("cards");
    if (cardsEl) {
      cardsEl.innerHTML = `
            <div x-data>
                <template x-for="pkg in $store.quote.visiblePackages" :key="pkg.coverage + pkg.style + pkg.label">
                    <div class="package-card">
                        <h3 class="package-card__title" x-text="pkg.label"></h3>
                        <p class="package-card__price">$<span x-text="$store.quote.formatNumber(pkg.price)"></span> <span>+ GST</span></p>
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
    if (addonsEl) {
      addonsEl.innerHTML = `
            <div x-data>
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

    // [selection_summary] isn't wired into Elementor yet — guard stays.
    const summaryEl = document.getElementById("selection-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `
                <div class="selection-summary" x-data>
                    <div class="selection-summary__left">
                        <h3>Selection summary</h3>
                        <ul class="summary-list">
                            <li>✓ <span x-text="\`\${$store.quote.coverageLabel} \${$store.quote.styleLabel}\`"></span></li>
                            <li>✓ <span x-text="$store.quote.selectedPackage?.label"></span></li>
                        </ul>
                        <template x-if="$store.quote.hasSelectedAddons">
                            <div class="selection-summary__addons">
                                <p class="summary-subtitle">Optional Add-ons</p>
                                <ul class="summary-list">
                                    <template x-for="line in $store.quote.addonSummaryLines" :key="line.id">
                                        <li>✓ <span x-text="line.text"></span></li>
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
  });
}
