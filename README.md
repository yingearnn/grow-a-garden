# 🌱 Garden Wellness Challenge Web Application

A gamified wellness challenge platform where users earn points by completing wellness challenges and use those points to build and manage their virtual garden. This project combines backend API development with an interactive frontend, featuring JWT authentication, bcrypt password hashing, and a complete garden management system.

---


## 🎯 Project Overview

This application is a **Wellness Challenge Web Application** built for ST0503 Backend Web Development CA2. Users can:

1. **Register and Login** securely with JWT authentication and bcrypt password hashing
2. **Complete Wellness Challenges** to earn points
3. **Purchase Plants and Tools** from the shop using earned points
4. **Build a Virtual Garden** by planting purchased plants in garden plots
5. **Harvest Plants** to earn net worth after a cooldown period
6. **Compete on Leaderboards** based on net worth and points

The project demonstrates full-stack development skills including RESTful API design, secure authentication, database management, and interactive frontend development.

---

## ✨ Features

### Core Features

#### 🔐 Authentication System
- User registration with email, username, and password
- Secure login with JWT token-based session management
- Password hashing using bcrypt with 10 salt rounds
- Token verification middleware for protected routes
- Automatic session expiry handling

#### 🎯 Wellness Challenges
- View available wellness challenges
- Complete challenges to earn points
- Track challenge completion history
- Points accumulation system

#### 🛒 Shop System
- Browse plants categorized by rarity (common, rare, special, legendary)
- Browse tools with different multiplier effects
- Purchase items using earned points
- Dynamic stock management
- Featured items showcase

#### 🌳 Garden Management
- 20 garden plots per user
- Plant management: plant seeds from inventory
- Harvest system with 30-minute cooldown
- Individual plant harvesting
- Batch "Harvest All" for ready plants (respects cooldown)
- Real-time garden value calculation

#### 📊 Inventory System
- View owned plants
- View owned tools
- Track acquisition dates
- Planting status indicators

#### 🏆 Leaderboard
- Top 10 users by net worth
- Ranking display with user statistics

---

## 🛠 Technology Stack

### Backend
- **Node.js** (v14+)
- **Express.js** (v5.2.1) - Web framework
- **MySQL2** (v3.16.0) - Database driver
- **JWT (jsonwebtoken)** (v9.0.3) - Authentication tokens
- **Bcrypt** (v6.0.0) - Password hashing
- **dotenv** (v17.2.3) - Environment variables
- **Nodemon** (v3.1.11) - Development server

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Interactivity
- **Fetch API** - HTTP requests
- **ES6 Modules** - Code organization

### Database
- **MySQL** (v8.0+)

---

## 📁 Project Structure

```
project/
├── frontend/                    # Frontend application
│   ├── css/                     # Stylesheets
│   │   ├── auth.css            # Login/Register styles
│   │   ├── challenges.css      # Challenges page styles
│   │   ├── homepage.css        # Homepage/Garden styles
│   │   ├── inventory.css       # Inventory page styles
│   │   ├── leaderboard.css     # Leaderboard styles
│   │   ├── notification.css    # Notification system styles
│   │   └── shop.css            # Shop page styles
│   ├── js/                      # JavaScript modules
│   │   ├── auth.js             # Authentication utilities
│   │   ├── challenges.js       # Challenges functionality
│   │   ├── getCurrentURL.js    # API URL configuration
│   │   ├── homepage.js         # Garden management
│   │   ├── inventory.js        # Inventory management
│   │   ├── leaderboard.js      # Leaderboard display
│   │   ├── login.js            # Login logic
│   │   ├── notifications.js    # Notification system
│   │   ├── queryCmds.js        # Query utilities
│   │   ├── register.js         # Registration logic
│   │   └── shop.js             # Shop functionality
│   ├── pixel_plants/            # Plant images
│   ├── challenges.html          # Challenges page
│   ├── homepage.html            # Main garden page
│   ├── inventory.html           # User inventory page
│   ├── leaderboard.html         # Leaderboard page
│   ├── login.html               # Login page
│   ├── register.html            # Registration page
│   └── shop.html                # Shop page
│
├── src/                         # Backend application
│   ├── configs/                 # Configuration files
│   │   ├── createSchema.js     # Database creation
│   │   └── initTables.js       # Table initialization & seed data
│   ├── controllers/             # Business logic
│   │   ├── challengesController.js
│   │   ├── completionController.js
│   │   ├── gardenController.js
│   │   ├── plantsController.js
│   │   ├── toolsController.js
│   │   └── userController.js
│   ├── middlewares/             # Middleware functions
│   │   ├── bcryptMiddleware.js # Password hashing & comparison
│   │   └── jwtMiddleware.js    # Token generation & verification
│   ├── models/                  # Database queries
│   │   ├── challengesModel.js
│   │   ├── completionModel.js
│   │   ├── gardenModel.js
│   │   ├── plantsModel.js
│   │   ├── toolsModel.js
│   │   └── userModel.js
│   ├── routes/                  # API routes
│   │   ├── challengesRoutes.js
│   │   ├── gardenRoutes.js
│   │   ├── mainRoutes.js       # Main router
│   │   ├── plantsRoutes.js
│   │   ├── toolsRoutes.js
│   │   └── userRoutes.js
│   ├── services/                # External services
│   │   └── db.js               # Database connection pool
│   └── app.js                   # Express app configuration
│
├── .env                         # Environment variables (not in repo)
├── .gitignore                   # Git ignore file
├── index.js                     # Application entry point
├── package.json                 # Dependencies & scripts
└── README.md                    # This file
```

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ST0503-BED/bed-ca2-yingearnn.git
cd bed-ca2-yingearnn
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- express
- mysql2
- bcrypt
- jsonwebtoken
- dotenv
- nodemon (dev dependency)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_DATABASE=wellness_garden

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=3600
JWT_ALGORITHM=HS256

# Server Configuration
PORT=3000
```

**Important Security Notes:**
- Replace `your_password_here` with your MySQL root password
- Replace `your_super_secret_key_here` with a strong, random secret key
- Never commit the `.env` file to version control
- The `.env` file is already in `.gitignore`

### 4. Set Up MySQL Database

Ensure MySQL server is running on your machine. You can verify by running:

```bash
mysql -u root -p
```

Enter your MySQL password when prompted. If successful, you're ready to proceed.

---

## 🗄️ Database Initialization

The project includes automated scripts to create the database and initialize tables with seed data.

### Create Database & Tables

Run the initialization script:

```bash
npm run init_tables
```

This command will:
1. Create the `wellness_garden` database (if it doesn't exist)
2. Drop existing tables (if any) - **Warning: This deletes all data!**
3. Create all required tables:
   - `User` - User accounts with hashed passwords
   - `Plants` - Available plant types
   - `Tools` - Available tool types
   - `UserPlants` - User's plant inventory
   - `UserTools` - User's tool inventory
   - `GardenPlots` - User's garden plots (20 per user)
   - `WellnessChallenge` - Available challenges
   - `UserCompletion` - Challenge completion records
   - `ShopRefresh` - Shop refresh timestamps
4. Populate tables with initial seed data including 3 test users

### Test User Accounts

Three test accounts are created with default password `1234`:

| Username | Email | Password |
|----------|-------|----------|
| happyPlant | happyplant@gmail.com | 1234 |
| the_sunflowerguy | sunny@gmail.com | 1234 |
| plantMakesMEEhappy | MEe@gmail.com | 1234 |

---

## ▶️ Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes to files.

### Production Mode

```bash
npm start
```

### Access the Application

Once the server is running, you'll see:

```
Server is running on http://localhost:3000
```

**Frontend Pages:**
- Login: `http://localhost:3000/frontend/login.html`
- Register: `http://localhost:3000/frontend/register.html`
- Homepage/Garden: `http://localhost:3000/frontend/homepage.html` (requires login)
- Shop: `http://localhost:3000/frontend/shop.html` (requires login)
- Challenges: `http://localhost:3000/frontend/challenges.html` (requires login)
- Inventory: `http://localhost:3000/frontend/inventory.html` (requires login)
- Leaderboard: `http://localhost:3000/frontend/leaderboard.html` (requires login)

**API Base URL:** `http://localhost:3000`

---

## 📡 API Documentation

### Authentication Endpoints

#### Register New User
```http
POST /register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}

Response 200 OK:
{
  "message": "User created",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 4
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "username": "happyPlant",
  "password": "1234"
}

Response 200 OK:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}

Response 401 Unauthorized:
{
  "message": "Wrong password"
}
```

### User Endpoints

#### Get User by ID
```http
GET /user/:id
Authorization: Bearer <token>

Response 200 OK:
{
  "user_id": 1,
  "username": "happyPlant",
  "email": "happyplant@gmail.com",
  "points": 150,
  "net_worth": 500
}
```

#### Get Top 10 Users (Leaderboard)
```http
GET /user/top10
Authorization: Bearer <token>

Response 200 OK:
[
  {
    "user_id": 1,
    "username": "happyPlant",
    "net_worth": 5000
  },
  ...
]
```

### Challenges Endpoints

#### Get All Challenges
```http
GET /challenges
Authorization: Bearer <token>

Response 200 OK:
[
  {
    "challenge_id": 1,
    "creator_id": 1,
    "description": "Sleep like a boss - Get 7+ hours of sleep",
    "points": 10,
    "created_on": "2025-01-15T10:30:00"
  },
  ...
]
```

#### Complete a Challenge
```http
POST /challenges/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "details": "Completed the challenge!"
}

Response 201 Created:
{
  "completion_id": 1,
  "challenge_id": 1,
  "user_id": 1,
  "details": "Completed the challenge!",
  "completed_on": "2025-02-04T08:00:00"
}
```

### Plants Endpoints

#### Get All Plants (Shop)
```http
GET /plants
Authorization: Bearer <token>

Response 200 OK:
[
  {
    "plant_id": 1,
    "name": "Sunflower",
    "rarity": "common",
    "points": 10,
    "value": 100,
    "stock": 10,
    "plantImage": "frontendpixel_plantssunflower.png"
  },
  ...
]
```

#### Buy a Plant
```http
POST /plants/buy
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "plant_id": 3
}

Response 201 Created:
{
  "message": "Plant purchased successfully",
  "user_plant_id": 15
}

Response 400 Bad Request:
{
  "message": "Insufficient points"
}
```

#### Get User's Plants (Inventory)
```http
GET /plants/user/:userId
Authorization: Bearer <token>

Response 200 OK:
[
  {
    "user_plant_id": 1,
    "plant_id": 1,
    "name": "Sunflower",
    "rarity": "common",
    "is_planted": false,
    "acquired_on": "2025-02-01T10:00:00"
  },
  ...
]
```

### Garden Endpoints

#### Get User's Garden Plots
```http
GET /garden/:userId
Authorization: Bearer <token>

Response 200 OK:
[
  {
    "plot_id": 1,
    "plot_number": 1,
    "plant_id": 5,
    "planted_on": "2025-02-04T07:30:00",
    "value": 400,
    "name": "Rose",
    "rarity": "rare",
    "plantImage": "frontendpixel_plantsrose.png"
  },
  {
    "plot_id": 2,
    "plot_number": 2,
    "plant_id": null,
    "planted_on": null,
    "value": 0,
    "name": null,
    "rarity": null,
    "plantImage": null
  },
  ...
]
```

#### Plant a Seed
```http
POST /garden/plant
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_plant_id": 5,
  "plot_number": 3
}

Response 200 OK:
{
  "message": "Plant planted successfully 🌱",
  "plot_number": 3
}

Response 400 Bad Request:
{
  "message": "Plot already occupied"
}
```

#### Harvest a Plant
```http
POST /garden/sell
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "plot_number": 3
}

Response 200 OK:
{
  "message": "Plant sold successfully",
  "plant_id": 5,
  "plot_number": 3
}

Response 400 Bad Request:
{
  "message": "Plants can only be sold after 30 minutes"
}
```

### Tools Endpoints

Similar structure to Plants endpoints for browsing and purchasing tools.

---

## 🖥️ Frontend Pages

### 1. Login Page (`login.html`)
- User authentication form
- Username and password fields
- Link to registration page
- JWT token storage on successful login
- Error notification for invalid credentials

### 2. Register Page (`register.html`)
- New user registration form
- Email, username, and password fields
- Password confirmation
- Automatic login after registration
- Input validation

### 3. Homepage / Garden (`homepage.html`)
- Main dashboard showing user stats (points, net worth)
- 20 garden plots display (4x5 grid)
- Individual harvest buttons for each planted plot
- "Harvest All" button (only harvests plants past 30-min cooldown)
- Real-time garden value calculation
- Navigation to other pages

### 4. Shop Page (`shop.html`)
- Browse available plants by rarity
- Browse available tools with multipliers
- Purchase items using points
- Stock availability display
- Featured items section
- Real-time points balance

### 5. Challenges Page (`challenges.html`)
- View all available wellness challenges
- Complete challenges to earn points
- Track completion status
- Challenge history display

### 6. Inventory Page (`inventory.html`)
- View owned plants
- View owned tools
- Plant from inventory to garden
- Acquisition date tracking
- Planting status indicators

### 7. Leaderboard Page (`leaderboard.html`)
- Top 10 users by net worth
- User rankings
- Username and net worth display

---

## 🔒 Security Features

### JWT (JSON Web Token) Authentication

#### Token Generation
- Tokens generated on login and registration
- Payload includes: `userId` and `timestamp`
- Signed with `HS256` algorithm
- Configurable expiry time (default: 3600 seconds / 1 hour)
- Secret key stored in environment variables

#### Token Verification
- All protected routes require valid JWT token
- Token sent via `Authorization: Bearer <token>` header
- Middleware verifies token signature and expiry
- Invalid/expired tokens return 401 Unauthorized
- Decoded userId attached to `res.locals.userId` for use in controllers

#### Frontend Token Management
- Token stored in `localStorage` on login
- Token included in all API requests to protected endpoints
- Automatic logout on token expiry (401 responses)
- Token cleared on logout

### Bcrypt Password Hashing

#### Registration Flow
1. User submits password in plain text (HTTPS recommended in production)
2. `bcryptMiddleware.hashPassword` hashes password with 10 salt rounds
3. Only the hash is stored in the database (never plain text)
4. Hash attached to `res.locals.hash` for storage

#### Login Flow
1. User submits username and password
2. Database retrieves stored password hash for the username
3. `bcryptMiddleware.comparePassword` compares submitted password with stored hash
4. Access granted only if passwords match
5. Never reveals whether username or password was incorrect (security best practice)

#### Security Benefits
- **Rainbow Table Protection**: Salting prevents rainbow table attacks
- **Brute Force Resistance**: Slow hashing function (10 rounds) makes brute force attacks impractical
- **One-Way Function**: Hashes cannot be reversed to reveal original password
- **Unique Salts**: Each password has a unique salt, even if users choose same password

### Additional Security Measures

1. **Environment Variables**: Sensitive data (DB credentials, JWT secret) stored in `.env` file
2. **Input Validation**: Frontend and backend validate user inputs
3. **SQL Injection Prevention**: Parameterized queries using mysql2 prepared statements
4. **Password Strength**: Frontend enforces minimum password length
5. **Session Management**: JWT expiry forces periodic re-authentication
6. **CORS Consideration**: Configure CORS for production deployment

---

## 🧪 Testing

### Manual Testing with Test Accounts

Use the pre-created test accounts to test all features:

**Test Account 1:**
- Username: `happyPlant`
- Password: `1234`

**Test Account 2:**
- Username: `the_sunflowerguy`
- Password: `1234`

### Testing Checklist

#### Authentication
- [ ] Register a new user with valid credentials
- [ ] Register with duplicate username (should fail)
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should fail)
- [ ] Access protected page without token (should redirect to login)
- [ ] Logout and verify token is cleared

#### Wellness Challenges
- [ ] View all available challenges
- [ ] Complete a challenge
- [ ] Verify points are added to user account
- [ ] View completion history

#### Shop System
- [ ] Browse plants by rarity
- [ ] Purchase a plant with sufficient points
- [ ] Attempt purchase with insufficient points (should fail)
- [ ] Verify points deduction after purchase
- [ ] Check plant appears in inventory

#### Garden Management
- [ ] View garden with 20 plots
- [ ] Plant a seed from inventory to empty plot
- [ ] Attempt to plant in occupied plot (should fail)
- [ ] Wait 30 minutes and harvest a plant
- [ ] Attempt to harvest before 30 minutes (should fail)
- [ ] Use "Harvest All" to harvest multiple ready plants
- [ ] Verify "Harvest All" skips plants on cooldown
- [ ] Check net worth increases after harvest

#### Inventory
- [ ] View owned plants
- [ ] View owned tools
- [ ] Verify planting status updates

#### Leaderboard
- [ ] View top 10 users
- [ ] Verify rankings by net worth

### API Testing with Postman/Insomnia

Import these example requests:

1. **Register**
   - Method: POST
   - URL: `http://localhost:3000/register`
   - Body: `{"username": "testuser", "email": "test@test.com", "password": "testpass"}`

2. **Login**
   - Method: POST
   - URL: `http://localhost:3000/login`
   - Body: `{"username": "happyPlant", "password": "1234"}`
   - Save token from response

3. **Get User**
   - Method: GET
   - URL: `http://localhost:3000/user/1`
   - Headers: `Authorization: Bearer <your_token>`

4. **Get Garden**
   - Method: GET
   - URL: `http://localhost:3000/garden/1`
   - Headers: `Authorization: Bearer <your_token>`

---


1. **Pre-Login Features**
   - Landing page
   - Registration process
   - Login functionality

2. **Post-Login Features**
   - Homepage/Garden view
   - Challenge completion
   - Shop browsing and purchasing
   - Garden planting and harvesting
   - Inventory management
   - Leaderboard

3. **Best Feature Showcase**
   - Garden management system with cooldown mechanics
   - Smart "Harvest All" functionality



---

## 👨‍💻 Contributors

- **Student Name**: Ying Earn
- **Student ID**: PYYYYYY
- **Class**: CLASS
- **GitHub**: [yingearnn](https://github.com/yingearnn)
- **Repository**: [bed-ca2-yingearnn](https://github.com/ST0503-BED/bed-ca2-yingearnn)

---


## 📄 License

This project is created for educational purposes as part of ST0503 Backend Web Development coursework at Singapore Polytechnic.

---

## 🙏 Acknowledgments

- ST0503 Backend Web Development course materials
- Express.js documentation
- MySQL2 documentation
- JWT.io for token debugging
- MDN Web Docs for JavaScript references
- Pixel art plant images (source to be credited)

---

## 📞 Support

For questions or issues:
1. Check this README thoroughly
2. Review the code comments
3. Test with provided test accounts
4. Contact via GitHub Issues: [Create Issue](https://github.com/ST0503-BED/bed-ca2-yingearnn/issues)

---

**Last Updated**: February 4, 2025

**Version**: 1.0.0 (CA2 Submission)