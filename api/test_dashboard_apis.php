<?php

// Test script for API endpoints, designed for CLI execution.

// --- Helper Functions ---
function print_status($message, $is_success)
{
    $color = $is_success ? "\033[32m" : "\033[31m"; // Green or Red
    $symbol = $is_success ? '✅' : '❌';
    echo $color . $symbol . " " . $message . "\033[0m" . PHP_EOL;
}

// --- Test Runner ---
define('API_TESTING_MODE', true);
$basePath = __DIR__;
$has_errors = false;

echo "========================================\n";
echo "🔍 Running API Endpoint Tests...\n";
echo "========================================\n\n";

// Load database configuration once
require_once $basePath . '/../config/database.php';

// API endpoints to test
$api_tests = [
    'Settings'     => ['file' => 'settings.php', 'get' => []],
    'Categories'   => ['file' => 'categories.php', 'get' => []],
    'Comptes'      => ['file' => 'comptes.php', 'get' => []],
    'Clients'      => ['file' => 'tiers.php', 'get' => ['type' => 'client']],
    'Fournisseurs' => ['file' => 'tiers.php', 'get' => ['type' => 'fournisseur']],
    'Transactions' => ['file' => 'transactions.php', 'get' => ['limit' => '10']],
];

foreach ($api_tests as $name => $test) {
    echo "--- Testing: $name ---\n";
    $file_path = $basePath . '/' . $test['file'];

    if (!file_exists($file_path)) {
        print_status("API file not found: " . $file_path, false);
        $has_errors = true;
        continue;
    }

    // Simulate a web server environment
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/' . $test['file'];
    $_SERVER['SCRIPT_NAME'] = '/api/' . $test['file'];
    $_GET = $test['get'];

    ob_start();
    try {
        // The API scripts use exit(), so we can't catch exceptions from them directly.
        // We can only check the output.
        include $file_path;
    } catch (Exception $e) {
        // This will catch exceptions from the test script itself, not the included file if it exits.
    }
    $output = ob_get_clean();

    $data = json_decode($output, true);

    if (json_last_error() === JSON_ERROR_NONE) {
        if (isset($data['error']) && $data['error']) {
            print_status("API returned an error: " . ($data['message'] ?? 'Unknown error'), false);
            $has_errors = true;
        } else {
            print_status("API call successful.", true);
            if (isset($data['data']) && is_array($data['data'])) {
                echo "    -> Found " . count($data['data']) . " items." . PHP_EOL;
            }
        }
    } else {
        print_status("API did not return valid JSON.", false);
        if (trim($output) !== '') {
            echo "    -> Raw output: " . substr(trim($output), 0, 200) . "..." . PHP_EOL;
        } else {
            echo "    -> No output was produced." . PHP_EOL;
        }
        $has_errors = true;
    }
    // Reset GET for next test
    $_GET = [];
    echo "\n";
}

// Special test for stats endpoint which uses PATH_INFO
echo "--- Testing: Stats ---\n";
$_SERVER['PATH_INFO'] = '/stats';
ob_start();
include $basePath . '/transactions.php';
$output = ob_get_clean();
$data = json_decode($output, true);

if (json_last_error() === JSON_ERROR_NONE && empty($data['error'])) {
    print_status("Stats API call successful.", true);
} else {
    print_status("Stats API call failed.", false);
    $has_errors = true;
}
echo "\n";


// --- Final Summary ---
echo "========================================\n";
if ($has_errors) {
    print_status("Testing complete. Some tests failed.", false);
    exit(1); // Exit with error code
} else {
    print_status("All API tests passed successfully!", true);
    exit(0); // Exit with success code
}
