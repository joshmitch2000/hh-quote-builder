<?php

/**
 * Shared data builder — every shortcode below reads from this once,
 * so package/add-on data is computed exactly one way, one place.
 */
function hh_get_quote_data()
{
  static $data = null;
  if ($data !== null) return $data;

  $packages = get_posts([
    'post_type'      => 'package',
    'posts_per_page' => -1,
    'orderby'        => 'menu_order title',
    'order'          => 'ASC',
  ]);

  $coverage_field = ! empty($packages) ? get_field_object('coverage', $packages[0]->ID) : null;
  $style_field    = ! empty($packages) ? get_field_object('style', $packages[0]->ID) : null;

  $available_coverage = [];
  $style_to_coverages = [];
  $packages_payload   = [];

  foreach ($packages as $package) {
    $package_id = $package->ID;
    $coverage   = get_field('coverage', $package_id);
    $style      = get_field('style', $package_id);
    if (! $coverage || ! $style) continue;

    $available_coverage[$coverage] = true;
    $style_to_coverages[$style][$coverage] = true;

    $price_numeric = (float) preg_replace('/[^0-9.]/', '', get_field('price', $package_id));

    $features = [];
    if (have_rows('features', $package_id)) {
      while (have_rows('features', $package_id)) : the_row();
        $feature = get_sub_field('package_feature');
        if ($feature) $features[] = $feature;
      endwhile;
    }

    $addons_payload = [];
    if (have_rows('available_addons', $package_id)) {
      while (have_rows('available_addons', $package_id)) : the_row();
        $addon_post = get_sub_field('addon');
        $max_qty    = get_sub_field('max_quantity');
        if (! $addon_post instanceof WP_Post) continue;

        $addons_payload[] = [
          'id'    => $addon_post->post_name,
          'label' => get_the_title($addon_post),
          'price' => (float) preg_replace('/[^0-9.]/', '', get_field('price', $addon_post->ID)),
          'type'  => get_field('type', $addon_post->ID),
          'unit'  => get_field('unit_label', $addon_post->ID),
          'max'   => $max_qty ? (int) $max_qty : null,
        ];
      endwhile;
    }

    $packages_payload[] = [
      'coverage'    => $coverage,
      'style'       => $style,
      'label'       => get_the_title($package_id),
      'price'       => $price_numeric,
      'description' => get_field('short_description', $package_id),
      'features'    => $features,
      'addons'      => $addons_payload,
    ];
  }

  $default_coverage = array_key_first($available_coverage);
  $default_style    = null;
  if ($style_field) {
    foreach ($style_field['choices'] as $slug => $label) {
      if (isset($style_to_coverages[$slug][$default_coverage])) {
        $default_style = $slug;
        break;
      }
    }
  }

  $data = [
    'packages'          => $packages_payload,
    'coverageChoices'   => $coverage_field['choices'] ?? [],
    'styleChoices'      => $style_field['choices'] ?? [],
    'availableCoverage' => array_keys($available_coverage),
    'styleToCoverages'  => array_map('array_keys', $style_to_coverages),
    'defaultCoverage'   => $default_coverage,
  ];

  return $data;
}

/**
 * [package_filters] — outputs the JSON data payload once, plus the
 * coverage/style fieldsets. Rendered first per your structure panel,
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
 * [package_cards] — pure Alpine template now, no PHP loop over packages.
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
 * running total. Matches your first screenshot's layout.
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
 * [selection_summary] — NEW, for Step 3. Not yet placed in Elementor —
 * needs an HTML field in Step 3 (you said you'd add the rest of Step 3's
 * fields yourself; this is just the dynamic summary block).
 */
function selection_summary_shortcode()
{
  ob_start(); ?>
  <div id="selection-summary"></div>
<?php
  return ob_get_clean();
}
add_shortcode('selection_summary', 'selection_summary_shortcode');
