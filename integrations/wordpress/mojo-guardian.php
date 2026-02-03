<?php
/*
Plugin Name: Mojo Guardian SEO Agent
Plugin URI: https://agenttestx-production-19d6.up.railway.app
Description: The official autonomous SEO infrastructure bridge for WordPress. Handles AI-powered redirects and metadata injections in real-time.
Version: 1.1.1
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
            add_action('init', array($this, 'handle_redirects'), 1);
            add_action('wp_head', array($this, 'inject_seo_meta'), 1);
            add_action('init', array($this, 'handle_internal_scrape'), 10);
            add_action('wp', array($this, 'report_404_to_mojo'));
        }
    }

    private function is_system_path($path) {
        $excluded = array(
            '/wp-admin',
            '/wp-content',
            '/wp-includes',
            '/wp-json',
            '/wp-login.php',
            '/xmlrpc.php',
            '/feed'
        );
        foreach ($excluded as $prefix) {
            if (strpos(strtolower($path), $prefix) === 0) return true;
        }
        return false;
    }

    public function report_404_to_mojo() {
        if (is_404()) {
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            if ($this->is_system_path($path)) return;

            $event_url = str_replace('/agent/manifest', '/agent/report', $this->manifest_url);
            
            wp_remote_post($event_url, array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->api_key, 
                    'Content-Type'  => 'application/json'
                ),
                'body' => json_encode(array(
                    'type' => '404_DETECTED',
                    'path' => $path,
                    'details' => array('message' => 'Passive detection: User hit a 404 page.')
                )),
                'blocking' => false
            ));
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
                if ($path === '/' || $this->is_system_path($path)) continue;

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
        if (isset($_GET['mojo_sync'])) {
            delete_transient($this->manifest_cache_key);
            wp_redirect(admin_url('admin.php?page=mojo-guardian&synced=1'));
            exit;
        }

        $status_message = '<span style="color:red">Disconnected</span>';
        $rules_list = array();
        
        if (!empty($this->api_key)) {
            $manifest = $this->get_manifest();
            
            if ($manifest && isset($manifest['rules'])) {
                $status_message = '<span style="color:green">Active & Protecting</span>';
                $rules_list = $manifest['rules'];
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
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4; max-width: 800px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <p style="margin: 0;"><strong>Status:</strong> <?php echo $status_message; ?></p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Last Sync: <?php echo date('H:i:s'); ?></p>
                    </div>
                    <a href="<?php echo admin_url('admin.php?page=mojo-guardian&mojo_sync=1'); ?>" class="button button-secondary">Force Sync Now</a>
                </div>

                <h3>Active Protection Rules (<?php echo count($rules_list); ?>)</h3>
                <?php if (empty($rules_list)): ?>
                    <p style="font-style: italic; color: #999;">No active rules loaded from SaaS. Run a scan and fix issues in your dashboard.</p>
                <?php else: ?>
                    <table class="widefat striped">
                        <thead>
                            <tr>
                                <th>Path</th>
                                <th>Type</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($rules_list as $path => $rule): ?>
                                <tr>
                                    <td><code><?php echo esc_html($path); ?></code></td>
                                    <td><span class="badge" style="background: #e7f9ed; color: #22c55e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-bold;"><?php echo esc_html($rule['type']); ?></span></td>
                                    <td>
                                        <?php if (isset($rule['redirectTo'])): ?>
                                            Redirect to <code><?php echo esc_html($rule['redirectTo']); ?></code>
                                        <?php else: ?>
                                            Metadata Override Active
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
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
                set_transient($this->manifest_cache_key, $manifest, 60);
            }
        }

        return $manifest;
    }

    public function handle_redirects() {
        if (is_admin()) return;

        $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if ($this->is_system_path($current_path)) return;

        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $clean_path = '/' . trim($current_path, '/');
        if ($clean_path === '//') $clean_path = '/';
        
        if (isset($manifest['rules'][$clean_path])) {
            $rule = $manifest['rules'][$clean_path];
            if (isset($rule['redirectTo'])) {
                $target = $rule['redirectTo'];
                if (strpos($target, '/') === 0) {
                    $target = home_url($target);
                }
                
                header("X-Mojo-Guardian: Redirect-Active");
                wp_redirect($target, 301, 'Mojo Guardian');
                exit;
            }
        }
    }

    public function inject_seo_meta() {
        $current_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if ($this->is_system_path($current_path)) return;

        $manifest = $this->get_manifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $clean_path = '/' . trim($current_path, '/');
        if ($clean_path === '//') $clean_path = '/';

        if (isset($manifest['rules'][$clean_path])) {
            $rule = $manifest['rules'][$clean_path];

            echo "\n<!-- Mojo Guardian Active: Rule ID " . esc_html($rule['ruleId']) . " -->\n";

            if (isset($rule['title']) && !empty($rule['title'])) {
                add_filter('pre_get_document_title', function() use ($rule) {
                    return $rule['title'];
                }, 100);
                add_filter('wp_title', function() use ($rule) {
                    return $rule['title'];
                }, 100);
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
}

new Mojo_Guardian();
