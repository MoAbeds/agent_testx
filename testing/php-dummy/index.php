<?php
require_once 'mojo-agent.php';

// Initialize Mojo Guardian
$mojo = new MojoGuardian("mojo_0olio1pl57dg"); // Using Vibrant Presence API Key for testing
$mojo->init();

$path = $_SERVER['REQUEST_URI'];
$seo = $mojo->getMetadata($path);

$title = $seo['title'] ?? "Pharaoh Dummy PHP Site";
$description = $seo['metaDescription'] ?? "A test site for Mojo Guardian autonomous SEO.";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($description); ?>">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" href="https://agenttestx-production-19d6.up.railway.app/logo.svg">
</head>
<body class="bg-[#0a0a0a] text-white flex flex-col items-center justify-center min-h-screen p-6">
    <div class="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <img src="https://agenttestx-production-19d6.up.railway.app/logo.svg" alt="Mojo" class="w-16 h-16 mx-auto animate-pulse">
        <h1 class="text-3xl font-bold font-serif">Mojo PHP Agent</h1>
        <p class="text-gray-400 text-sm">This page is protected by the Mojo Guardian autonomous SEO infrastructure.</p>
        
        <div class="bg-black/50 rounded-xl p-4 border border-gray-800 text-left space-y-2">
            <p class="text-[10px] font-black uppercase text-gray-500 tracking-widest">Active Metadata</p>
            <p class="text-xs font-mono text-terminal"><span class="text-gray-600">Title:</span> <?php echo htmlspecialchars($title); ?></p>
            <p class="text-xs font-mono text-terminal"><span class="text-gray-600">Meta:</span> <?php echo htmlspecialchars($description); ?></p>
        </div>

        <div class="pt-4 border-t border-gray-800">
            <p class="text-[10px] text-gray-600 font-mono italic">Built for teams who ship fast. Made by Pharaoh_</p>
        </div>
    </div>
</body>
</html>
