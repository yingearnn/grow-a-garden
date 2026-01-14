const pool = require("../services/db");

const SQLSTATEMENT = `
DROP TABLE IF EXISTS UserPlants;
DROP TABLE IF EXISTS UserCompletion;
DROP TABLE IF EXISTS WellnessChallenge;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Plants;


CREATE TABLE Plants (
    plant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rarity ENUM('common', 'rare', 'special', 'legendary') NOT NULL,
    points INT NOT NULL,
    value INT NOT NULL
);

INSERT INTO Plants (plant_id, name, rarity, points, value) VALUES
(1, 'Sunflower', 'common', 10, 100),
(2, 'Tulip', 'common', 15, 150),
(3, 'Rose', 'rare', 30, 400),
(4, 'Orchid', 'special', 50, 800),
(5, 'Bonsai', 'legendary', 100, 2000),
(6, 'Cactus', 'common', 12, 120),
(7, 'Lavender', 'rare', 35, 500),
(8, 'Venus Flytrap', 'special', 60, 1000),
(9, 'Cherry Blossom', 'legendary', 120, 3000);


CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    points INT DEFAULT 0 ,
    net_worth INT DEFAULT 0
);

INSERT INTO User (user_id, username) VALUES
(1, 'happyPlant'),
(2, 'the_sunflowerguy'),
(3, 'plantMakesMEEhappy');


CREATE TABLE UserPlants (
    user_plant_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    acquired_on DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO UserPlants (user_id, plant_id) VALUES
(1, 1),
(2, 1);

UPDATE User
SET net_worth = 100
WHERE user_id = 1;

UPDATE User
SET net_worth = 100
WHERE user_id = 2;

CREATE TABLE WellnessChallenge (
    challenge_id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    description TEXT NOT NULL,
    points INT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES User(user_id) ON DELETE CASCADE
);

INSERT INTO WellnessChallenge (challenge_id, creator_id, description, points) VALUES
(1, 1, 'Sleep like a boss - Get 7+ hours of sleep', 10),
(2, 1, 'Stairs over elevator? Respect. - Take the stairs today', 10),
(3, 2, 'Digital detox (mini edition) - No phone for 1 hour', 20),
(4, 2, 'Touch grass IRL - Take a 15-minute walk outside', 20),
(5, 2, 'IRL > DMs - Talk to a friend face-to-face', 20),
(6, 3, 'Declutter your chaos - Clean your desk or room', 20),
(7, 3, 'Help a homie - Assist someone without being asked', 20);


CREATE TABLE UserCompletion (
    completion_id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    details TEXT,
    FOREIGN KEY (challenge_id) REFERENCES WellnessChallenge(challenge_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

INSERT INTO UserCompletion (completion_id, challenge_id, user_id, details) VALUES
(1, 1, 1, 'completed sleep like a boss'),
(2, 1, 2, 'completed sleep like a boss');
`;

pool.query(SQLSTATEMENT, (error, results, fields) => {
  if (error) {
    console.error("Error creating tables:", error);
  } else {
    console.log("Tables created successfully");
  }
  process.exit();
});
