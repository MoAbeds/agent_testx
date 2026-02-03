<?php
/**
 * Mojo Guardian PHP SDK v1.0
 * For standalone PHP websites. 
 * Include this at the very top of your index.php
 */

class MojoGuardian {
    private $apiKey;
    private $manifestUrl;
    private $cacheFile;
    private $cacheTTL = 60; // 1 minute

    public function __construct($apiKey, $manifestUrl) {
        $this->apiKey = $apiKey;
        $this->manifestUrl = $manifestUrl;
        $this->cacheFile = sys_get_temp_dir() . '/mojo_manifest_' . md5($apiKey) . '.json';
        
        $this->init();
    }

    private function init() {
        $manifest = $this->getManifest();
        if (!$manifest || !isset($manifest['rules'])) return;

        $currentPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $cleanPath = '/' . trim($currentPath, '/');
        if ($cleanPath === '//') $cleanPath = '/';

        if (isset($manifest['rules'][$cleanPath])) {
            $rule = $manifest['rules'][$cleanPath];

            // 1. Handle Redirects
            if (isset($rule['redirectTo'])) {
                header("X-Mojo-Guardian: PHP-Redirect-Active");
                header("Location: " . $rule['redirectTo'], true, 301);
                exit;
            }

            // 2. Buffer Output for Metadata Injection
            ob_start(function($buffer) use ($rule) {
                return $this->injectMetadata($buffer, $rule);
            });
        }
    }

    private function getManifest() {
        if (file_exists($this->cacheFile) && (time() - filemtime($this->cacheFile) < $this->cacheTTL)) {
            return json_decode(file_get_contents($this->cacheFile), true);
        }

        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "Authorization: Bearer " . $this->apiKey . "\r\n" .
                            "Content-Type: application/json\r\n",
                "timeout" => 5
            ]
        ];

        $context = stream_context_create($opts);
        $result = @file_get_contents($this->manifestUrl, false, $context);

        if ($result) {
            file_put_contents($this->cacheFile, $result);
            return json_decode($result, true);
        }

        return file_exists($this->cacheFile) ? json_decode(file_get_contents($this->cacheFile), true) : null;
    }

    private function injectMetadata($html, $rule) {
        if (stripos($html, '<html') === false) return $html;

        // Inject Title
        if (isset($rule['title'])) {
            $html = preg_replace('/<title>(.*?)<\/title>/is', '<title>' . htmlspecialchars($rule['title']) . '</title>', $html);
        }

        // Inject Meta Description
        $desc = isset($rule['metaDesc']) ? $rule['metaDesc'] : (isset($rule['metaDescription']) ? $rule['metaDescription'] : '');
        if (!empty($desc)) {
            $metaTag = '<meta name="description" content="' . htmlspecialchars($desc) . '">';
            if (stripos($html, 'name="description"') !== false) {
                $html = preg_replace('/<meta[^>]+name=["\']description["\'][^>]*>/is', $metaTag, $html);
            } else {
                $html = str_ireplace('</head>', $metaTag . "\n</head>", $html);
            }
        }

        return $html . "\n<!-- Mojo Guardian PHP Active -->";
    }
}
