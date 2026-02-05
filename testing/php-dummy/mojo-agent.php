<?php
/**
 * Mojo Guardian PHP Agent
 */
class MojoGuardian {
    private $apiKey;
    private $endpoint = "https://agenttestx-production-19d6.up.railway.app/api/agent/manifest";
    private $rules = [];

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    public function init() {
        if (!$this->apiKey) return false;

        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "Authorization: Bearer " . $this->apiKey . "\r\n" .
                            "User-Agent: MojoAgent-PHP/1.0\r\n"
            ]
        ];
        
        $context = stream_context_create($opts);
        $result = @file_get_contents($this->endpoint, false, $context);
        
        if ($result) {
            $data = json_decode($result, true);
            $this->rules = $data['rules'] ?? [];
            return true;
        }
        return false;
    }

    public function getMetadata($path) {
        $cleanPath = ($path === '/' || $path === '') ? '/' : rtrim($path, '/');
        $rule = $this->rules[$cleanPath] ?? null;
        if ($rule) {
            return [
                "title" => $rule['title'] ?? $rule['titleTag'],
                "description" => $rule['metaDescription'] ?? $rule['metaDesc']
            ];
        }
        return null;
    }

    public function getPageContent($path) {
        $rule = $this->rules[$path] ?? null;
        if ($rule && $rule['type'] === 'INJECT_HTML') {
            return [
                "html" => $rule['html'],
                "title" => $rule['title'],
                "description" => $rule['metaDesc'] ?? $rule['metaDescription']
            ];
        }
        return null;
    }
}
?>
