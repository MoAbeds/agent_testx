<?php
/**
 * DUMMY PHP WEBSITE
 * Protected by Mojo Guardian
 */

require_once 'mojo-agent.php';

// Configuration (Normally from env or config file)
$apiKey = 'mojo-local-secret-123';
$manifestUrl = 'http://localhost:3000/api/agent/manifest';

// INITIALIZE THE GUARDIAN
new MojoGuardian($apiKey, $manifestUrl);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Raw PHP Site Title</title>
    <meta name="description" content="This is an unoptimized PHP page.">
    <style>
        body { font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 100px; text-align: center; }
        .code { background: #111; padding: 20px; border-radius: 10px; border: 1px solid #222; font-family: monospace; color: #22c55e; }
    </style>
</head>
<body>
    <h1>Standalone PHP Test</h1>
    <div class="code">
        &lt;?php require_once 'mojo-agent.php'; ?&gt;
    </div>
    <p>If the Mojo Rule is active, the title above will be overridden.</p>
    <a href="/broken-php-link" style="color: #3b82f6;">Test Redirect Link</a>
</body>
</html>
