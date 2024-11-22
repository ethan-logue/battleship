<?php
require '../../dbcon.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Normally, you would authenticate the user with a session token.
    // For now, we will assume the user is logged in.

    // Fetch lobby data (mock data for now)
    $lobby_ID = 1;
    $players = [
        ['player_ID' => 1, 'username' => 'player123', 'is_online' => true],
        ['player_ID' => 2, 'username' => 'player456', 'is_online' => true]
    ];

    // Respond with lobby information
    http_response_code(200);
    echo json_encode([
        'lobby_ID' => $lobby_ID,
        'players' => $players
    ]);
}