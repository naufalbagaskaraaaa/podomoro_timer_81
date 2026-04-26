<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode([
        'ok' => false,
        'error' => 'Method not allowed. Use POST.',
    ]);
    exit;
}

$remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
$isLocal = $remoteAddr === '127.0.0.1' || $remoteAddr === '::1';
if (!$isLocal) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'Forbidden. Localhost only.',
    ]);
    exit;
}

$expectedToken = 'domas123';
if ($expectedToken === false || $expectedToken === '') {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Server misconfigured. APP_ADMIN_TOKEN is missing.',
    ]);
    exit;
}

$providedToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
if (!is_string($providedToken) || !hash_equals($expectedToken, $providedToken)) {
    http_response_code(401);
    echo json_encode([
        'ok' => false,
        'error' => 'Unauthorized. Invalid admin token.',
    ]);
    exit;
}

// Ask browser to clear origin storage and cache for this app.
header('Clear-Site-Data: "cache", "storage"');

http_response_code(200);
echo json_encode([
    'ok' => true,
    'message' => 'DOM-related browser cache/storage reset requested.',
    'path' => '/admin-reset-dom-cache.php',
    'timestamp' => gmdate('c'),
]);
