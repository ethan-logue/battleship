<?php
require '../../dbcon.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read JSON request payload
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'];
    $email = $data['email'];
    $password = $data['password'];

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Check if the email already exists
    $checkQuery = "SELECT * FROM Player WHERE email = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Email already exists
        http_response_code(400);
        echo json_encode(['error' => 'Email already exists']);
    } else {
        // Insert the new user
        $query = "INSERT INTO Player (username, email, password_hash) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sss", $username, $email, $hashedPassword);

        if ($stmt->execute()) {
            // Generate session token
            $player_ID = $conn->insert_id;
            $session_token = bin2hex(random_bytes(16)); // Example token

            // You can store session_token in the Player table if needed

            // Respond with user data and session token
            http_response_code(201);
            echo json_encode([
                'player_ID' => $player_ID,
                'username' => $username,
                'email' => $email,
                'session_token' => $session_token
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to register user']);
        }
    }
}