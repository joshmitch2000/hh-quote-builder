<?php
/**
 * Shared data builder — every shortcode reads from this once,
 * so package/add-on data is computed exactly one way, one place.
 */

if (! defined('ABSPATH')) exit;

/**
 * Decode HTML entities in a user-facing string so the JS payload is plain
 * text. ACF/post titles can arrive encoded (esc_html on save or a filter);
 * the bundle renders labels via Alpine x-text, which inserts them as
 * literal text — so any encoding upstream would show through verbatim
 * (e.g. "&#038;" instead of "&"). html_entity_decode is safe here: the
 * payload is JSON, and x-text never parses HTML.
 */
function hhqb_plain($value)
{
  return is_string($value) ? html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8') : $value;
}

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
        if ($feature) $features[] = hhqb_plain($feature);
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
          'label' => hhqb_plain(get_the_title($addon_post)),
          'price' => (float) preg_replace('/[^0-9.]/', '', get_field('price', $addon_post->ID)),
          'type'  => get_field('type', $addon_post->ID),
          'unit'  => hhqb_plain(get_field('unit_label', $addon_post->ID)),
          'max'   => $max_qty ? (int) $max_qty : null,
        ];
      endwhile;
    }

    $packages_payload[] = [
      'coverage'    => $coverage,
      'style'       => $style,
      'label'       => hhqb_plain(get_the_title($package_id)),
      'price'       => $price_numeric,
      'description' => hhqb_plain(get_field('short_description', $package_id)),
      'features'    => $features,
      'addons'      => $addons_payload,
    ];
  }

  $default_coverage = array_key_first($available_coverage);

  // First style valid for the default coverage. Key order here is package
  // insertion order — the same order the JS styleList getter iterates
  // styleToCoverages, so this matches the first enabled style tab in the UI
  // and the store's first-valid fallback when coverage changes.
  $default_style = null;
  foreach (array_keys($style_to_coverages) as $style_slug) {
    if (isset($style_to_coverages[$style_slug][$default_coverage])) {
      $default_style = $style_slug;
      break;
    }
  }

  $data = [
    'packages'          => $packages_payload,
    'coverageChoices'   => $coverage_field['choices'] ?? [],
    'styleChoices'      => $style_field['choices'] ?? [],
    'availableCoverage' => array_keys($available_coverage),
    'styleToCoverages'  => array_map('array_keys', $style_to_coverages),
    'defaultCoverage'   => $default_coverage,
    'defaultStyle'      => $default_style,
  ];

  return $data;
}
