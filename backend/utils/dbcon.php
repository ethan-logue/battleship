<?php
header("Access-Control-Allow-Origin: *");
$host = $_ENV['DB_HOST'];
$user = $_ENV['DB_USER'];
$password = $_ENV['DB_PASSWORD'];
$db = $_ENV['DB_NAME'];

try {
    $conn = new mysqli($host, $user, $password, $db);

    if ($conn->connect_error) {
        die( "Connection failed: " . $conn->connect_error );
    }
} catch (Exception $e) {
    echo "Caught exception: ", $e->getMessage(), "\n";
}
