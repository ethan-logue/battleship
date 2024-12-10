# Turn-Based Game: Battleship
In the game of Battleship, two players face off in a strategic guessing game. Each player has a grid where they can place a variety of battleships anywhere. The ships come in sizes of 1x2 to 1x6 and the locations of the opposing ships are hidden. Each player takes turns guessing the location of a ship by listing grid coordinates i.e. A6. The other player will then respond with if it was a hit or not and the player will mark their guess accordingly. Once all of someone's boats have been sunk, the game is over and the remaining player wins. 

**Tech Stack**
- Frontend: React & TypeScript
- Backend: Javascript & MySQL

## Setup
*Prerequisites*
- [XAMPP](https://www.apachefriends.org/download.html) (Only Apache & MySQL modules needed)

*How to Run*
- Install node modules: `npm i`
- Start Apache & SQL using XAMPP:
  - Open the XAMPP Control Panel
  - Press start on Apache
  - Press start on MySQL
- Populate Database:
  - Go to [phpmyadmin](http://localhost/phpmyadmin/)
  - Click on the 'SQL' tab
  - Copy and paste the contents from `./database/setup.sql` into the textbox
  - Press 'Go'
- Run npm script: `npm run full-dev`
- Navigate to the [homepage](http://localhost:5173/)!

