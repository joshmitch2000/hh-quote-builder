<?php
/**
 * Plugin Name:       HH Quote Builder
 * Description:       Wedding music package quote builder for Him & Her Music. Provides the [package_filters], [package_cards], [addon_selector] and [selection_summary] shortcodes, the shared quote data builder, and enqueues the Alpine.js-powered front-end bundle on the quote page.
 * Version:           1.2.5
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Him & Her Music
 * Text Domain:       hh-quote-builder
 */

if (! defined('ABSPATH')) exit;

$hhqb_plugin_data = function_exists('get_file_data')
  ? get_file_data(__FILE__, ['Version' => 'Version'])
  : [];
define('HHQB_VERSION', ! empty($hhqb_plugin_data['Version']) ? $hhqb_plugin_data['Version'] : '1.2.5');define('HHQB_ALPINE_VERSION', '3.17.1');
define('HHQB_PATH', plugin_dir_path(__FILE__));
define('HHQB_URL', plugin_dir_url(__FILE__));

require_once HHQB_PATH . 'includes/data.php';
require_once HHQB_PATH . 'includes/shortcodes.php';
require_once HHQB_PATH . 'includes/assets.php';
