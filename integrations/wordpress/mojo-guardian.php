<?php
/*
Plugin Name: Mojo Guardian SEO Agent
Plugin URI: https://agenttestx-production-19d6.up.railway.app
Description: The official autonomous SEO infrastructure bridge for WordPress. Handles AI-powered redirects and metadata injections in real-time.
Version: 1.1.2
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
        $this->manifest_url = get_option('mojo_guardian_manifest_url', 'https://agenttestx-production-19d6.up.railway.app/api/agent/manifest');

        // Admin Settings
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));

        // Core logic only runs if API key is present
        if (!empty($this->api_key)) {
            // REDIRECTS: Run as early as possible to catch 404s before WP renders them
            add_action('plugins_loaded', array($this, 'handle_redirects'), 1);
            
            // METADATA: Standard injection
            add_action('wp_head', array($this, 'inject_seo_meta'), 1);
            
            // INTERNAL BRIDGE
            add_action('init', array($this, 'handle_internal_scrape'), 10);
            
            // PASSIVE DETECTION
            add_action('wp', array($this, 'report_404_to_mojo'));
        }
    }

    private function is_system_path($path) {
        $excluded = array('/wp-admin', '/wp-content', '/wp-includes', '/wp-json', '/wp-login.php', '/xmlrpc.php');
        foreach ($excluded as $prefix) {
            if (strpos(strtolower($path), $prefix) === 0) return true;
        }
        return false;
    }

    public function handle_redirects() {
        if (is_admin()) return;

        $current_uri = $_SERVER['REQUEST_URI'];
        $current_path = parse_url($current_uri, PHP_URL_PATH);
        if ($this->is_system_path($current_path)) return;

        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        // Try exact match, then normalized match
        $rules = $manifest['rules'];
        $clean_path = '/' . trim($current_path, '/');
        if ($clean_path === '//') $clean_path = '/';

        $target_rule = null;
        if (isset($rules[$current_path])) {
            $target_rule = $rules[$current_path];
        } elseif (isset($rules[$clean_path])) {
            $target_rule = $rules[$clean_path];
        }

        if ($target_rule && isset($target_rule['redirectTo'])) {
            $target_url = $target_rule['redirectTo'];
            
            // Ensure absolute URL
            if (strpos($target_url, 'http') !== 0) {
                $target_url = home_url($target_url);
            }

            // Perform Redirect
            header("X-Mojo-Guardian: Redirect-Active");
            header("X-Mojo-Rule: " . $target_rule['ruleId']);
            wp_redirect($target_url, 301, 'Mojo');
            exit;
        }
    }

    public function inject_seo_meta() {
        if (is_admin()) return;
        
        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $clean_path = '/' . trim($current_path, '/');
        if ($clean_path === '//') $clean_path = '/';

        $rules = $manifest['rules'];
        $rule = isset($rules[$current_path]) ? $rules[$current_path] : (isset($rules[$clean_path]) ? $rules[$clean_path] : null);

        if ($rule) {
            echo "\n<!-- Mojo Guardian Active: Rule " . esc_html($rule['ruleId']) . " -->\n";

            if (isset($rule['title']) && !empty($rule['title'])) {
                add_filter('pre_get_document_title', function() use ($rule) { return $rule['title']; }, 100);
                add_filter('wp_title', function() use ($rule) { return $rule['title']; }, 100);
            }

            $desc = isset($rule['metaDesc']) ? $rule['metaDesc'] : (isset($rule['metaDescription']) ? $rule['metaDescription'] : '');
            if (!empty($desc)) {
                echo '<meta name="description" content="' . esc_attr($desc) . '" />' . "\n";
            }

            if (isset($rule['schema'])) {
                echo '<script type="application/ld+json">' . json_encode($rule['schema']) . '</script>' . "\n";
            }
        }
    }

    public function handle_internal_scrape() {
        if (isset($_GET['mojo_action']) && $_GET['mojo_action'] === 'scrape') {
            if (empty($this->api_key) || $_GET['key'] !== $this->api_key) {
                wp_send_json_error('Unauthorized');
            }

            $pages = get_posts(array('post_type' => array('post', 'page'), 'posts_per_page' => 100, 'post_status' => 'publish'));
            $results = array();
            $results[] = array('path' => '/', 'title' => get_bloginfo('name'), 'metaDesc' => get_bloginfo('description'), 'status' => 200);

            foreach ($pages as $post) {
                $url = get_permalink($post->ID);
                $path = parse_url($url, PHP_URL_PATH) ?: '/';
                if ($path === '/') continue;
                $results[] = array(
                    'path' => $path,
                    'title' => get_the_title($post->ID),
                    'metaDesc' => get_post_meta($post->ID, '_aioseo_description', true) ?: get_post_meta($post->ID, '_yoast_wpseo_metadesc', true) ?: '',
                    'status' => 200
                );
            }

            $ingest_url = str_replace('/agent/manifest', '/sites/ingest', $this->manifest_url);
            wp_remote_post($ingest_url, array(
                'headers' => array('Authorization' => 'Bearer ' . $this->api_key, 'Content-Type' => 'application/json'),
                'body' => json_encode(array('domain' => $_SERVER['HTTP_HOST'], 'pages' => $results)),
                'timeout' => 30
            ));

            wp_send_json_success('Scrape complete.');
        }
    }

    public function report_404_to_mojo() {
        if (is_404()) {
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            if ($this->is_system_path($path)) return;
            $event_url = str_replace('/agent/manifest', '/agent/report', $this->manifest_url);
            wp_remote_post($event_url, array(
                'headers' => array('Authorization' => 'Bearer ' . $this->api_key, 'Content-Type' => 'application/json'),
                'body' => json_encode(array('type' => '404_DETECTED', 'path' => $path, 'details' => array('message' => 'User hit 404'))),
                'blocking' => false
            ));
        }
    }

    public function add_settings_page() {
        add_menu_page(
            'Mojo Guardian',
            'Mojo Guardian',
            'manage_options',
            'mojo-guardian',
            array($this, 'render_settings_page'),
            'https://agenttestx-production-19d6.up.railway.app/wp-icon.svg',
            80
        );
    }

    public function register_settings() {
        register_setting('mojo_guardian_settings', 'mojo_guardian_api_key');
        register_setting('mojo_guardian_settings', 'mojo_guardian_manifest_url');
    }

    public function render_settings_page() {
        if (isset($_GET['mojo_sync'])) {
            delete_transient($this->manifest_cache_key);
            wp_redirect(admin_url('admin.php?page=mojo-guardian&synced=1'));
            exit;
        }
        $manifest = $this->get_manifest();
        $rules = ($manifest && isset($manifest['rules'])) ? $manifest['rules'] : array();
        ?>
        <div class="wrap">
            <h1>Mojo Guardian Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('mojo_guardian_settings'); ?>
                <table class="form-table">
                    <tr valign="top"><th scope="row">API Key</th><td><input type="text" name="mojo_guardian_api_key" value="<?php echo esc_attr($this->api_key); ?>" class="regular-text" /></td></tr>
                    <tr valign="top"><th scope="row">Manifest URL</th><td><input type="text" name="mojo_guardian_manifest_url" value="<?php echo esc_attr($this->manifest_url); ?>" class="regular-text" /></td></tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <div style="background:#fff; padding:20px; border:1px solid #ccd0d4; border-radius:8px;">
                <div style="display:flex; justify-content:space-between;">
                    <p><strong>Status:</strong> <?php echo empty($rules) ? '<span style="color:orange">Syncing...</span>' : '<span style="color:green">Active & Protecting</span>'; ?></p>
                    <a href="<?php echo admin_url('admin.php?page=mojo-guardian&mojo_sync=1'); ?>" class="button">Force Sync</a>
                </div>
                <h3>Active Rules (<?php echo count($rules); ?>)</h3>
                <table class="widefat striped">
                    <thead><tr><th>Path</th><th>Type</th><th>Redirect To</th></tr></thead>
                    <tbody>
                        <?php foreach($rules as $path => $r): ?>
                            <tr><td><code><?php echo esc_html($path); ?></code></td><td><?php echo esc_html($r['type']); ?></td><td><?php echo esc_html($r['redirectTo'] ?? 'N/A'); ?></td></tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    private function get_manifest() {
        $manifest = get_transient($this->manifest_cache_key);
        if (false === $manifest) {
            $response = wp_remote_get($this->manifest_url, array(
                'headers' => array('Authorization' => 'Bearer ' . $this->api_key, 'Content-Type' => 'application/json'),
                'timeout' => 10
            ));
            if (is_wp_error($response)) return null;
            $manifest = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($manifest['rules'])) set_transient($this->manifest_cache_key, $manifest, 60);
        }
        return $manifest;
    }
}
new Mojo_Guardian();
