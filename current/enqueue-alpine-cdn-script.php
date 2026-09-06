<?php
add_action('wp_enqueue_scripts', function () {

  wp_enqueue_script(
    'alpinejs',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.17.1/dist/cdn.min.js',
    [],
    null,
    array(
      'strategy'  => 'defer',
      'in_footer' => true
    )
  );
});
