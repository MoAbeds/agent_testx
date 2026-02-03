<?php
/*
Plugin Name: Mojo Guardian SEO Agent
Plugin URI: https://agenttestx-production-19d6.up.railway.app
Description: The official autonomous SEO infrastructure bridge for WordPress. Handles AI-powered redirects and metadata injections in real-time.
Version: 1.0.7
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

        // Core Logic
        if (!empty($this->api_key)) {
            add_action('template_redirect', array($this, 'handle_redirects'), 1);
            add_action('wp_head', array($this, 'inject_seo_meta'), 1);
            
            // Internal Scraper Bridge (Triggered by SaaS Server)
            add_action('init', array($this, 'handle_internal_scrape'));
        }
    }

    public function handle_internal_scrape() {
        if (isset($_GET['mojo_action']) && $_GET['mojo_action'] === 'scrape') {
            if (empty($this->api_key) || $_GET['key'] !== $this->api_key) {
                status_header(403);
                wp_send_json_error('Unauthorized or Missing Key');
            }

            $pages = get_posts(array(
                'post_type' => array('post', 'page'), 
                'posts_per_page' => 100, 
                'post_status' => 'publish'
            ));
            
            $results = array();
            $results[] = array(
                'path' => '/',
                'title' => get_bloginfo('name'),
                'metaDesc' => get_bloginfo('description'),
                'status' => 200
            );

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

            $base_url = preg_replace('/\/api\/agent\/.*$/', '', $this->manifest_url);
            $ingest_url = rtrim($base_url, '/') . '/api/sites/ingest';
            
            $response = wp_remote_post($ingest_url, array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->api_key, 
                    'Content-Type'  => 'application/json'
                ),
                'body' => json_encode(array(
                    'domain' => $_SERVER['HTTP_HOST'], 
                    'pages' => $results
                )),
                'timeout' => 30,
                'blocking' => true 
            ));

            if (is_wp_error($response)) {
                wp_send_json_error('Failed to push to Mojo SaaS: ' . $response->get_error_message());
            }

            wp_send_json_success(array(
                'message' => 'Scrape complete and pushed to Mojo.',
                'count' => count($results)
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
            'dashicons-shield-alt',
            80
        );
    }

    public function register_settings() {
        register_setting('mojo_guardian_settings', 'mojo_guardian_api_key');
        register_setting('mojo_guardian_settings', 'mojo_guardian_manifest_url');
    }

    public function render_settings_page() {
        $status_message = '<span style="color:red">Disconnected</span>';
        $active_rules = 0;
        
        if (!empty($this->api_key)) {
            // Force refresh if user is on settings page
            delete_transient($this->manifest_cache_key);
            $manifest = $this->get_manifest();
            
            if ($manifest && isset($manifest['rules'])) {
                $status_message = '<span style="color:green">Active & Protecting</span>';
                $active_rules = count($manifest['rules']);
            } else {
                $status_message = '<span style="color:orange">Invalid API Key or Connection Error</span>';
            }
        }
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
                        <td><input type="text" name="mojo_guardian_manifest_url" value="<?php echo esc_attr(get_option('mojo_guardian_manifest_url', 'https://agenttestx-production-19d6.up.railway.app/api/agent/manifest')); ?>" class="regular-text" /></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr>
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4;">
                <p><strong>Status:</strong> <?php echo $status_message; ?></p>
                <p><strong>Active Optimizations:</strong> <?php echo $active_rules; ?> rules loaded.</p>
                <p class="description">Updates sync every 60 seconds. View and edit your rules in the <a href="https://agenttestx-production-19d6.up.railway.app/dashboard/rules" target="_blank">Mojo Dashboard</a>.</p>
            </div>
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
                'timeout' => 10
            ));

            if (is_wp_error($response)) return null;

            $body = wp_remote_retrieve_body($response);
            $manifest = json_decode($body, true);

            if (isset($manifest['rules'])) {
                // Cache for 1 minute for faster testing/editing
                set_transient($this->manifest_cache_key, $manifest, 60);
            }
        }

        return $manifest;
    }

    public function handle_redirects() {
        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        // Normalize: ensure leading slash and no trailing slash for comparison
        $clean_path = '/' . trim($current_path, '/');
        if ($clean_path === '//') $clean_path = '/';
        
        if (isset($manifest['rules'][$clean_path])) {
            $rule = $manifest['rules'][$clean_path];
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
        $clean_path = '/' . trim($current_path, '/');
        if ($clean_path === '//') $clean_path = '/';

        if (isset($manifest['rules'][$clean_path])) {
            $rule = $manifest['rules'][$clean_path];

            echo "\n<!-- Mojo Guardian Active: Rule ID " . esc_html($rule['ruleId']) . " -->\n";

            // Title Override
            if (isset($rule['title']) && !empty($rule['title'])) {
                add_filter('pre_get_document_title', function() use ($rule) {
                    return $rule['title'];
                }, 100);
                // Also support older themes
                add_filter('wp_title', function() use ($rule) {
                    return $rule['title'];
                }, 100);
            }

            // Meta Description Override
            $desc = isset($rule['metaDesc']) ? $rule['metaDesc'] : (isset($rule['metaDescription']) ? $rule['metaDescription'] : '');
            if (!empty($desc)) {
                // Remove existing meta description if possible
                remove_action('wp_head', 'rel_canonical'); // handled separately if needed
                echo '<meta name="description" content="' . esc_attr($desc) . '" />' . "\n";
            }

            // Schema Injection
            if (isset($rule['schema'])) {
                echo '<script type="application/ld+json">' . json_encode($rule['schema']) . '</script>' . "\n";
            }
        }
    }
}

new Mojo_Guardian();
