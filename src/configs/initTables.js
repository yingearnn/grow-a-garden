// inittables.js
const pool = require("../services/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;

bcrypt.hash("1234", saltRounds, (err, hash) => {
  if (err) {
    console.error("Error hashing initial password:", err);
    process.exit(1);
  }

  const SQLSTATEMENT = `
-- DROP tables in correct order to avoid FK issues
DROP TABLE IF EXISTS UserCompletion;
DROP TABLE IF EXISTS UserTools;
DROP TABLE IF EXISTS GardenPlots;
DROP TABLE IF EXISTS UserPlants;
DROP TABLE IF EXISTS WellnessChallenge;
DROP TABLE IF EXISTS ShopRefresh;
DROP TABLE IF EXISTS Tools;
DROP TABLE IF EXISTS Plants;
DROP TABLE IF EXISTS User;

-- USERS
CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    points INT DEFAULT 100000,
    net_worth INT DEFAULT 0
);

INSERT INTO User (user_id, username, email, password) VALUES
(1, 'happyPlant', 'happyplant@gmail.com', '${hash}'),
(2, 'the_sunflowerguy', 'sunny@gmail.com', '${hash}'),
(3, 'plantMakesMEEhappy', 'MEe@gmail.com', '${hash}');

-- TOOLS
CREATE TABLE Tools (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    multiplier FLOAT NOT NULL,
    cost INT NOT NULL,
    max_stock INT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE
);

INSERT INTO Tools (item_id, name, multiplier, cost, max_stock, stock) VALUES
(1,'Basic Fertiliser', 1.5, 30, 10, 10),
(2,'Silver Fertiliser', 2.0, 60, 8, 8),
(3,'Golden Fertiliser', 3.0, 120, 5, 5),
(4,'Diamond Fertiliser', 4.0, 180, 2, 2),
(5,'Jade Fertiliser', 5.0, 240, 1, 1);

-- USER TOOLS
CREATE TABLE UserTools (
    user_tool_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (item_id) REFERENCES Tools(item_id)
);

-- PLANTS
CREATE TABLE Plants (
    plant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rarity ENUM('common', 'rare', 'special', 'legendary') NOT NULL,
    points INT NOT NULL,
    value INT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    plantImage VARCHAR(255),
    max_stock INT NOT NULL DEFAULT 5,
    is_featured BOOLEAN DEFAULT FALSE
);

INSERT INTO Plants (plant_id, name, rarity, points, value, max_stock,plantImage) VALUES
(1, 'Sunflower', 'common', 10, 100, 10,'frontendpixel_plantssunflower.png'),
(2, 'Tulip', 'common', 15, 150, 10,'frontendpixel_plantstulip.png'),
(3, 'Rose', 'rare', 30, 400,  5,'frontendpixel_plantsrose.png'),
(4, 'Orchid', 'special', 50, 800,  3,'frontendpixel_plantsorchid.png'),
(5, 'Bonsai', 'legendary', 100, 2000,  1,'frontendpixel_plantsbonsai.png'),
(6, 'Cactus', 'common', 12, 120,  10,'frontendpixel_plantscactus.png'),
(7, 'Lavender', 'rare', 35, 500,  5,'frontendpixel_plantslavender.png'),
(8, 'Venus Flytrap', 'special', 60, 1000, 3,'frontendpixel_plantsvenus_flytrap.png'),
(9, 'Cherry Blossom', 'legendary', 120, 3000,  1,'frontendpixel_plantscherry_blossom.png'),
(10, 'Daisy', 'common', 8, 80,  10,'frontendpixel_plantsdaisy.png'),
(11, 'Mint', 'common', 11, 110,  10,'frontendpixel_plantsmint.png'),
(12, 'Aloe Vera', 'rare', 28, 380,  5,'frontendpixel_plantsaloe_vera.png'),
(13, 'Peony', 'rare', 40, 550,  5,'frontendpixel_plantspeony.png'),
(14, 'Pitcher Plant', 'special', 55, 900,  3,'frontendpixel_plantspitcher_plant.png'),
(15, 'Blue Rose', 'special', 70, 1200, 3,'frontendpixel_plantsblue_rose.png'),
(16, 'Golden Bamboo', 'legendary', 150, 4000, 1,'frontendpixel_plantsgolden_bamboo.png'),
(17, 'Moon Orchid', 'legendary', 180, 5000,  1,'frontendpixel_plantsmoon_orchid.png'),
(18, 'Fern', 'common', 9, 90,  10,'frontendpixel_plantsfern.png'),
(19, 'Jade Plant', 'rare', 32, 450,  5,'frontendpixel_plantsjade_plant.png'),
(20, 'Lotus', 'special', 65, 1100,  3,'frontendpixel_plantslotus.png');


-- USER PLANTS
CREATE TABLE UserPlants (
    user_plant_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plant_id INT NOT NULL,
    is_planted BOOLEAN DEFAULT FALSE,
    acquired_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES Plants(plant_id) ON DELETE CASCADE
);

INSERT INTO UserPlants (user_id, plant_id) VALUES
(1, 1),
(2, 1),
(3, 1);

-- GARDEN PLOTS
CREATE TABLE GardenPlots (
    plot_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plot_number INT NOT NULL,
    plant_id INT DEFAULT NULL,
    value INT DEFAULT 0,
    planted_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, plot_number),
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES UserPlants(user_plant_id) ON DELETE SET NULL
);

INSERT INTO GardenPlots (user_id, plot_number, plant_id)
VALUES
-- User 1
(1,1,NULL),(1,2,NULL),(1,3,NULL),(1,4,NULL),(1,5,NULL),
(1,6,NULL),(1,7,NULL),(1,8,NULL),(1,9,NULL),(1,10,NULL),
(1,11,NULL),(1,12,NULL),(1,13,NULL),(1,14,NULL),(1,15,NULL),
(1,16,NULL),(1,17,NULL),(1,18,NULL),(1,19,NULL),(1,20,NULL),
-- User 2
(2,1,NULL),(2,2,NULL),(2,3,NULL),(2,4,NULL),(2,5,NULL),
(2,6,NULL),(2,7,NULL),(2,8,NULL),(2,9,NULL),(2,10,NULL),
(2,11,NULL),(2,12,NULL),(2,13,NULL),(2,14,NULL),(2,15,NULL),
(2,16,NULL),(2,17,NULL),(2,18,NULL),(2,19,NULL),(2,20,NULL),
-- User 3
(3,1,NULL),(3,2,NULL),(3,3,NULL),(3,4,NULL),(3,5,NULL),
(3,6,NULL),(3,7,NULL),(3,8,NULL),(3,9,NULL),(3,10,NULL),
(3,11,NULL),(3,12,NULL),(3,13,NULL),(3,14,NULL),(3,15,NULL),
(3,16,NULL),(3,17,NULL),(3,18,NULL),(3,19,NULL),(3,20,NULL);

-- WELLNESS CHALLENGES
CREATE TABLE WellnessChallenge (
    challenge_id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    description TEXT NOT NULL,
    points INT NOT NULL,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES User(user_id) ON DELETE CASCADE
);

INSERT INTO WellnessChallenge (creator_id, description, points) VALUES
(1, 'Sleep like a boss - Get 7+ hours of sleep', 10),
(1, 'Stairs over elevator? Respect. - Take the stairs today', 10),
(2, 'Digital detox (mini edition) - No phone for 1 hour', 20),
(2, 'Touch grass IRL - Take a 15-minute walk outside', 20),
(2, 'IRL > DMs - Talk to a friend face-to-face', 20),
(3, 'Declutter your chaos - Clean your desk or room', 20),
(3, 'Help a homie - Assist someone without being asked', 20);

-- USER COMPLETION
CREATE TABLE UserCompletion (
    completion_id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    details TEXT,
    completed_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES WellnessChallenge(challenge_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

INSERT INTO UserCompletion (challenge_id, user_id, details) VALUES
(1, 1, 'completed sleep like a boss'),
(1, 2, 'completed sleep like a boss');

-- SHOP REFRESH
CREATE TABLE ShopRefresh (
    shop_type ENUM('plants', 'tools') PRIMARY KEY,
    last_refresh DATETIME NOT NULL
);

INSERT INTO ShopRefresh (shop_type, last_refresh) VALUES
('plants', NOW()),
('tools', NOW());
`;

  pool.query(SQLSTATEMENT, (error) => {
    if (error) {
      console.error("Error creating tables:", error);
    } else {
      console.log("All tables created successfully!");
    }
    process.exit();
  });
});
