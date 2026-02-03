<?php
/*
Plugin Name: Mojo Guardian SEO Agent
Plugin URI: https://agenttestx-production-19d6.up.railway.app
Description: The official autonomous SEO infrastructure bridge for WordPress. Handles AI-powered redirects and metadata injections in real-time.
Version: 1.0.2
Author: Mojo AI Team
License: GPL2
*/

if (!defined('ABSPATH')) exit;

class Mojo_Guardian {
    private $api_key;
    private $manifest_url;
    private $manifest_cache_key = 'mojo_guardian_manifest';

    public function __construct() {
        $this->api_key = get_option('mojo_guardian_api_key');
        $this->manifest_url = get_option('mojo_guardian_manifest_url', 'https://mojo-saas.vercel.app/api/agent/manifest');

        // Admin Settings
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));

        // Core Logic
        if (!empty($this->api_key)) {
            add_action('template_redirect', array($this, 'handle_redirects'), 1);
            add_action('wp_head', array($this, 'inject_seo_meta'), 1);
        }
    }

    public function add_settings_page() {
        add_menu_page(
            'Mojo Guardian',
            'Mojo Guardian',
            'manage_options',
            'mojo-guardian',
            array($this, 'render_settings_page'),
            'dashicons-shield-alt',
            80
        );
    }

    public function register_settings() {
        register_setting('mojo_guardian_settings', 'mojo_guardian_api_key');
        register_setting('mojo_guardian_settings', 'mojo_guardian_manifest_url');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Mojo Guardian Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('mojo_guardian_settings'); ?>
                <?php do_settings_sections('mojo_guardian_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Mojo API Key</th>
                        <td><input type="text" name="mojo_guardian_api_key" value="<?php echo esc_attr(get_option('mojo_guardian_api_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Manifest URL</th>
                        <td><input type="text" name="mojo_guardian_manifest_url" value="<?php echo esc_attr(get_option('mojo_guardian_manifest_url', 'https://mojo-saas.vercel.app/api/agent/manifest')); ?>" class="regular-text" /></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr>
            <p><strong>Status:</strong> <?php echo empty($this->api_key) ? '<span style="color:red">Disconnected</span>' : '<span style="color:green">Active & Protecting</span>'; ?></p>
        </div>
        <?php
    }

    private function get_manifest() {
        $manifest = get_transient($this->manifest_cache_key);
        
        if (false === $manifest) {
            $response = wp_remote_get($this->manifest_url, array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->api_key,
                    'Content-Type'  => 'application/json'
                ),
                'timeout' => 5
            ));

            if (is_wp_error($response)) return null;

            $body = wp_remote_retrieve_body($response);
            $manifest = json_decode($body, true);

            if (isset($manifest['rules'])) {
                set_transient($this->manifest_cache_key, $manifest, 15 * MINUTE_IN_SECONDS);
            }
        }

        return $manifest;
    }

    public function handle_redirects() {
        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        if (isset($manifest['rules'][$current_path])) {
            $rule = $manifest['rules'][$current_path];
            if (isset($rule['redirectTo'])) {
                wp_redirect($rule['redirectTo'], 301);
                exit;
            }
        }
    }

    public function inject_seo_meta() {
        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        if (isset($manifest['rules'][$current_path])) {
            $rule = $manifest['rules'][$current_path];

            // Title Override
            if (isset($rule['title'])) {
                add_filter('pre_get_document_title', function() use ($rule) {
                    return $rule['title'];
                }, 100);
                echo '<!-- Mojo Injected Title -->' . "\n";
            }

            // Meta Description Override
            $desc = isset($rule['metaDescription']) ? $rule['metaDescription'] : (isset($rule['metaDesc']) ? $rule['metaDesc'] : '');
            if (!empty($desc)) {
                echo '<meta name="description" content="' . esc_attr($desc) . '" />' . "\n";
                echo '<!-- Mojo Injected Meta Description -->' . "\n";
            }

            // Schema Injection
            if (isset($rule['schema'])) {
                echo '<script type="application/ld+json">' . json_encode($rule['schema']) . '</script>' . "\n";
            }
        }
    }
}

new Mojo_Guardian();
