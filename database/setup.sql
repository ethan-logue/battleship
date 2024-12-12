DROP DATABASE battleship;
CREATE DATABASE IF NOT EXISTS battleship;

USE battleship;

CREATE TABLE Player (
    player_ID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    session_token VARCHAR(255),
    current_lobby_id INT,
    current_game_id VARCHAR(100),
    num_wins INT DEFAULT 0
);

CREATE TABLE Lobby (
    lobby_ID INT AUTO_INCREMENT PRIMARY KEY,
    lobby_name VARCHAR(50) NOT NULL
);

CREATE TABLE Chat (
    chat_ID INT AUTO_INCREMENT PRIMARY KEY,
    sender_ID INT,
    game_ID VARCHAR(100),
    lobby_ID INT,
    message TEXT,
    FOREIGN KEY (sender_ID) REFERENCES Player(player_ID)
);

CREATE TABLE Game (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID VARCHAR(100) UNIQUE,
    player1_ID INT,
    player2_ID INT,
    current_turn INT,
    winner_ID INT,
    game_status VARCHAR(50),
    players_ready BOOLEAN DEFAULT FALSE,
    player1_ships JSON,
    player2_ships JSON,
    player1_guesses JSON,
    player2_guesses JSON,
    FOREIGN KEY (player1_ID) REFERENCES Player(player_ID),
    FOREIGN KEY (player2_ID) REFERENCES Player(player_ID)
);

CREATE TABLE Move (
    move_ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID VARCHAR(100),
    player_ID INT,
    target_position VARCHAR(5),
    is_hit BOOLEAN,
    FOREIGN KEY (game_ID) REFERENCES Game(game_ID),
    FOREIGN KEY (player_ID) REFERENCES Player(player_ID)
);

CREATE TABLE GameBoard (
    board_ID INT AUTO_INCREMENT PRIMARY KEY,
    game_ID VARCHAR(100),
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

INSERT INTO Player (username, password_hash, email, session_token, current_lobby_id, current_game_id, num_wins) VALUES 
('eml8469', '$2b$10$rbh7uIo40DLLLqmQ7FNMl.IadRR6Ozx0/xNlEeVfk6zdRdYdTUyLm', 'eml8469@rit.edu', NULL, NULL, NULL, 0),
('admin', '$2b$10$0SLA472NbpnNUAJDPuUlbeo.sfi3/ID5aQ885GHEnMgZasYy7fpIy', 'admin@gmail.com', NULL, NULL, NULL, 0),
('tester', '$2b$10$sPcaJhdJzZKX/OUvewCnz.atUnjA6NLVz2BcenqaSDNsxTdaDgSgW', 'test@test.com', NULL, NULL, NULL, 0);