<?php
require '../../utils/dbcon.php';
require '../../utils/headers.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read JSON request payload
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'];
    $password = $data['password'];

    // Find the user by email
    $query = "SELECT * FROM player WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Verify password
        if (password_verify($password, $user['password_hash'])) {
            // Generate a new session token
            $session_token = bin2hex(random_bytes(16));

            // Store the session token in the database
            $updateQuery = "UPDATE player SET session_token = ? WHERE player_ID = ?";
            $stmt = $conn->prepare($updateQuery);
            $stmt->bind_param("si", $session_token, $user['player_ID']);
            $stmt->execute();

            // Respond with session token and player ID
            http_response_code(200);
            echo json_encode([
                'player_ID' => $user['player_ID'],
                'session_token' => $session_token
            ]);
        } else {
            // Invalid password
            http_response_code(401);
            echo json_encode(['error' => 'Invalid password']);
        }
    } else {
        // User not found
        http_response_code(401);
        echo json_encode(['error' => 'User not found']);
    }
}