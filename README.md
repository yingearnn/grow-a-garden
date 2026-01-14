# Starter Repository for Assignment
You are required to build your folder structures for your project.
# Wellness Challenge API

This repository contains a RESTful API built with **Express.js** and **MySQL** for managing wellness challenges, users, and completions. Users can create challenges, complete them, and earn points. The API supports full CRUD operations for users and challenges, as well as tracking completions and points.

## Prerequisites

Before running the project, ensure that the following dependencies are installed: Node.js, npm, and a MySQL database.

## Clone the Repository

Open Visual Studio Code (VSCode) on your local machine. Click on the "Source Control" icon in the left sidebar, then click on the "Clone Repository" button. Enter the repository URL `https://github.com/ST0503-BED/bed-ca1-yingearnn.git` and choose a local directory to clone the repository.

## Setting Up Environment Variables

Create a file named `.env` in the root directory of your project and add the following lines, replacing the placeholders with your database credentials:

DB_HOST=<your_database_host>
DB_USER=<your_database_user>
DB_PASSWORD=<your_database_password>
DB_DATABASE=<your_database_name>

makefile
Copy code

Example:

DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=wellness

csharp
Copy code

Save the file. The `db.js` file in `src/services` uses the `dotenv` package to load these variables:

```javascript
require('dotenv').config();
const mysql = require('mysql2');
const setting = {
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    dateStrings: true
};
const pool = mysql.createPool(setting);
module.exports = pool;
Ensure .env is included in .gitignore to prevent exposing sensitive information.

Install Dependencies
Open the terminal in VSCode, navigate to the project root, and run:

nginx
Copy code
npm install
Database Initialization
Make sure your MySQL database is available and configured in the .env file. To create tables and populate sample data (if any), run:

arduino
Copy code
npm run init_tables
Start the Server
arduino
Copy code
npm run dev
The API will be available at http://localhost:3000.

API Endpoints
Users

POST /user: Create a new user. Request body: { "username": "socuser321" }. Response: { "user_id":1,"username":"socuser321","points":0 }.

GET /user: Retrieve all users. Response: [{"user_id":1,"username":"socuser321","points":0}].

GET /user/:id: Get a user by ID. Response: { "user_id":1,"username":"socuser321","points":0 }.

PUT /user/:id: Update user info. Request body: { "username": "superSOC", "points": 100 }. Response: { "user_id":1,"username":"superSOC","points":100 }.

Challenges

POST /challenges: Create a new challenge. Request body: { "user_id": 1, "description": "Run 5km", "points": 10 }. Response: { "challenge_id":1,"creator_id":1,"description":"Run 5km","points":10 }.

GET /challenges: Retrieve all challenges. Response: [{"challenge_id":1,"creator_id":1,"description":"Run 5km","points":10}].

GET /challenges/:id: Get challenge by ID. Response via middleware.

PUT /challenges/:id: Update challenge. Request body: { "user_id": 1, "description": "Run 10km", "points": 20 }. Response: { "challenge_id":1,"creator_id":1,"description":"Run 10km","points":20 }.

DELETE /challenges/:id: Delete challenge. Response: 204 No Content.

Completions

POST /challenges/:id: Complete a challenge. Request body: { "user_id": 1, "details": "Completed in 30 mins" }. Response: { "complete_id":1,"challenge_id":1,"user_id":1,"details":"Completed in 30 mins" }.

GET /challenges/:id: Get users who completed a challenge. Response: [{"user_id":1,"details":"Completed in 30 mins"}].

Example Requests & Responses

1. Get all plants

GET /plants


Response 200:

[
  {
    "plant_id": 1,
    "name": "Sunflower",
    "rarity": "common",
    "points_cost": 10,
    "description": "Bright and cheerful, easy to grow."
  },
  ...
]


2. Get plant by ID

GET /plants/:id


Response 200:

{
  "plant_id": 1,
  "name": "Sunflower",
  "rarity": "common",
  "points_cost": 10,
  "description": "Bright and cheerful, easy to grow."
}


Response 404 (not found):

{ "message": "Plant not found" }


3. Buy a plant

POST /plants/buy
Body: { "user_id": 1 }


Response 201:

{
  "message": "Plant acquired",
  "plant_id": 1,
  "user_id": 1
}


Response 400 (insufficient points):

{ "message": "Insufficient points" }


4. Get owned plants by user ID

GET /users/:id/plants


Response 200:

[
  { "user_plant_id": 1, "user_id": 1, "plant_id": 1, "acquired_on": "2025-12-24T05:00:00Z" }
]


Response 404 (no plants):

{ "message": "User does not own any plants" }

Testing
Use Postman or Insomnia to test endpoints. Expected status codes: 200 OK for GET, 201 Created for POST, 204 No Content for DELETE, 400 Bad Request for missing fields, 404 Not Found for missing resources, 409 Conflict for duplicates.

Error Handling
All controllers handle errors gracefully. Errors return JSON with a message field, e.g.:

json
Copy code
{
  "message": "Username is already taken"
}