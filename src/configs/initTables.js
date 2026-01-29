const pool = require("../services/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Hash the initial password for default users
bcrypt.hash('1234', saltRounds, (err, hash) => {
  if (err) {
    console.error("Error hashing initial password:", err);
    process.exit(1);
  }

  const SQLSTATEMENT = `
DROP TABLE IF EXISTS UserCompletion;
DROP TABLE IF EXISTS UserTools;
DROP TABLE IF EXISTS UserPlants;
DROP TABLE IF EXISTS GardenPlots;
DROP TABLE IF EXISTS WellnessChallenge;
DROP TABLE IF EXISTS Tools;
DROP TABLE IF EXISTS Plants;
DROP TABLE IF EXISTS User;


CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    points INT DEFAULT 0,
    net_worth INT DEFAULT 0
);

-- Insert initial users with hashed password
INSERT INTO User (user_id, username, email, password) VALUES
(1, 'happyPlant', 'happyplant@gmail.com', '${hash}'),
(2, 'the_sunflowerguy', 'sunny@gmail.com', '${hash}'),
(3, 'plantMakesMEEhappy', 'MEe@gmail.com', '${hash}');

CREATE TABLE Tools (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    multiplier FLOAT NOT NULL,
    cost INT NOT NULL,
    max_stock INT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE
);


INSERT INTO Tools (item_id,name, multiplier, cost, max_stock) VALUES
(1,'Basic Fertiliser', 1.5, 30, 10),
(2,'Silver Fertiliser ', 2.0, 60,8),
(3,'Golden Fertiliser ', 3.0, 120,5),
(4,'Diamond Fertiliser ', 4.0, 180,2),
(5,'Jade Fertiliser ', 5.0, 240,1);

CREATE TABLE UserTools (
    user_tool_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,          -- references Tools table (Fertiliser)
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (item_id) REFERENCES Tools(item_id)
);

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

CREATE TABLE GardenPlots (
    plot_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plot_number INT NOT NULL,
    plant_id INT DEFAULT NULL,
    planted_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, plot_number),
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES Plants(plant_id)
);



CREATE TABLE UserPlants (
    user_plant_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    acquired_on DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO UserPlants (user_id, plant_id) VALUES
(1, 1),
(2, 1);


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
    completed_on DATETIME DEFAULT CURRENT_TIMESTAMP,   -- ADD THIS
    FOREIGN KEY (challenge_id) REFERENCES WellnessChallenge(challenge_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

INSERT INTO UserCompletion (completion_id, challenge_id, user_id, details) VALUES
(1, 1, 1, 'completed sleep like a boss'),
(2, 1, 2, 'completed sleep like a boss');
`;



  pool.query(SQLSTATEMENT, (error, results) => {
    if (error) {
      console.error("Error creating tables:", error);
    } else {
      console.log("Tables and initial users created successfully!");
    }
    process.exit();
  });
});
