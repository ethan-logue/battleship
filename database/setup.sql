CREATE DATABASE IF NOT EXISTS battleship;

USE battleship;

CREATE TABLE Player (
    player_ID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    session_token VARCHAR(255),
    current_lobby_id INT,
    current_game_id INT,
    num_wins INT DEFAULT 0
);

CREATE TABLE Lobby (
    lobby_ID INT AUTO_INCREMENT PRIMARY KEY,
    lobby_name VARCHAR(50) NOT NULL
);

CREATE TABLE Chat (
    chat_ID INT AUTO_INCREMENT PRIMARY KEY,
    sender_ID INT,
    game_ID INT,
    lobby_ID INT,
    message TEXT,
    FOREIGN KEY (sender_ID) REFERENCES Player(player_ID)
);

CREATE TABLE Game (
    game_ID INT AUTO_INCREMENT PRIMARY KEY,
    player1_ID INT,
    player2_ID INT,
    current_turn INT,
    winner_ID INT,
    game_status VARCHAR(50),
    FOREIGN KEY (player1_ID) REFERENCES Player(player_ID),
    FOREIGN KEY (player2_ID) REFERENCES Player(player_ID)
);

CREATE TABLE Move (
    move_ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID INT,
    target_position VARCHAR(5),
    is_hit BOOLEAN,
    FOREIGN KEY (game_ID) REFERENCES Game(game_ID)
);

CREATE TABLE GameBoard (
    board_ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID INT,
    player_ID INT,
    board_state TEXT,
    FOREIGN KEY (game_ID) REFERENCES Game(game_ID),
    FOREIGN KEY (player_ID) REFERENCES Player(player_ID)
);

CREATE TABLE Ship (
    ship_ID INT AUTO_INCREMENT PRIMARY KEY,
    board_ID INT,
    ship_type VARCHAR(50),
    position VARCHAR(5),
    orientation VARCHAR(10),
    is_sunk BOOLEAN,
    FOREIGN KEY (board_ID) REFERENCES GameBoard(board_ID)
);