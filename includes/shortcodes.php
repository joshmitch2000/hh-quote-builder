<?php
/**
 * Quote builder shortcodes.
 *
 * [package_filters] renders real Alpine markup directly in PHP — this is safe
 * ONLY because the shortcode sits in a plain Elementor Shortcode widget OUTSIDE
 * the Form widget, not subject to Elementor's HTML-field sanitization.
 *
 * The other three shortcodes are deliberately trivial empty <div>s: all
 * interactive markup for anything inside the Form widget is injected via JS
 * template literals and activated with Alpine.initTree() (see src/inject.js).
 * Do NOT reintroduce Alpine directives into PHP output that lands inside an
 * Elementor Form HTML field — they get stripped.
 */

if (! defined('ABSPATH')) exit;

/**
 * [package_filters] — outputs the JSON data payload once, plus the
 * coverage/style fieldsets. Rendered first per the Elementor structure panel,
 * so the JSON is guaranteed present before Alpine reads it.
 */
function package_filters_shortcode()
{
  $data = hh_get_quote_data();
  ob_start(); ?>
  <script type="application/json" id="hh-quote-data">
    <?php echo wp_json_encode($data); ?>
  </script>

  <div x-data id="filters">
    <fieldset class="filter" data-filter="coverage">
      <legend class="filter-title">Select your coverage</legend>
      <div class="filter-tabs filter-tabs--coverage">
        <template x-for="cov in $store.quote.availableCoverageList" :key="cov.slug">
          <label class="filter-tab">
            <input type="radio" name="coverage-filter" class="filter-tab__input"
              :value="cov.slug" x-model="$store.quote.coverage">
            <span x-text="cov.label"></span>
          </label>
        </template>
      </div>
    </fieldset>

    <fieldset class="filter" data-filter="style">
      <legend class="filter-title">Select your style</legend>
      <div class="filter-tabs filter-tabs--style">
        <template x-for="sty in $store.quote.styleList" :key="sty.slug">
          <label class="filter-tab"
            :class="{ 'filter-tab--disabled': !sty.isValid }"
            :title="sty.isValid ? null : `Not available for ${$store.quote.coverageLabel}`">
            <input type="radio" name="style-filter" class="filter-tab__input"
              :value="sty.slug" x-model="$store.quote.style" :disabled="!sty.isValid">
            <span x-text="sty.label"></span>
          </label>
        </template>
      </div>
    </fieldset>
  </div>
<?php
  return ob_get_clean();
}
add_shortcode('package_filters', 'package_filters_shortcode');

/**
 * [package_cards] — pure Alpine template, injected at runtime. No PHP loop.
 */
function package_cards_shortcode()
{
  ob_start(); ?>
  <div id="cards"></div>
<?php
  return ob_get_clean();
}
add_shortcode('package_cards', 'package_cards_shortcode');

/**
 * [addon_selector] — Step 2 content: selected package name, add-on rows,
 * running total. Injected at runtime.
 */
function addon_selector_shortcode()
{
  ob_start(); ?>
  <div id="addons-container"></div>
<?php
  return ob_get_clean();
}
add_shortcode('addon_selector', 'addon_selector_shortcode');

/**
 * [selection_summary] — Step 3 dynamic summary block. Injected at runtime.
 * Not yet placed in Elementor; JS handles its absence gracefully.
 */
function selection_summary_shortcode()
{
  ob_start(); ?>
  <div id="selection-summary"></div>
<?php
  return ob_get_clean();
}
add_shortcode('selection_summary', 'selection_summary_shortcode');
