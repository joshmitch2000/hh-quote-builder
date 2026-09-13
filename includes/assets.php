<?php
/**
 * Script registration and enqueueing.
 *
 * Ordering contract: the bundle registers its `alpine:init` listener, so it
 * MUST execute before Alpine itself. This is enforced via the dependency
 * array (alpinejs depends on hh-quote-bundle), not enqueue priority — WP
 * prints dependencies first, and deferred scripts execute in document order.
 */

if (! defined('ABSPATH')) exit;

function hhqb_should_load()
{
  // Elementor renders the preview iframe through wp_enqueue_scripts just
  // like the frontend, so is_page() already covers editor + preview.
  $should_load = is_page('wedding-music-packages');

  /**
   * Filter whether the quote builder scripts should load on this request.
   *
   * @param bool $should_load Default: true only on the quote page.
   */
  return apply_filters('hhqb_should_load', $should_load);
}

add_action('wp_enqueue_scripts', function () {
  if (! hhqb_should_load()) return;

  $bundle_path = HHQB_PATH . 'assets/js/bundle.js';
  $bundle_ver  = file_exists($bundle_path) ? (string) filemtime($bundle_path) : HHQB_VERSION;

  wp_register_script(
    'hh-quote-bundle',
    HHQB_URL . 'assets/js/bundle.js',
    [],
    $bundle_ver,
    [
      'strategy'  => 'defer',
      'in_footer' => true,
    ]
  );

  wp_register_script(
    'alpinejs',
    HHQB_URL . 'assets/vendor/alpinejs/cdn.min.js',
    ['hh-quote-bundle'],
    HHQB_ALPINE_VERSION,
    [
      'strategy'  => 'defer',
      'in_footer' => true,
    ]
  );

  // Only the alpinejs handle is enqueued; hh-quote-bundle prints first as a dependency.
  wp_enqueue_script('alpinejs');
});
