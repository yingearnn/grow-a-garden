const express = require('express');
const mainRoutes = require('./routes/mainRoutes');

const app = express();

// Parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static frontend files from 'frontend' folder
app.use(express.static("frontend"));

// Use your API/routes
app.use("/", mainRoutes);

// Default route: serve register.html when visiting localhost:3000
app.get("/", (req, res) => {
  res.sendFile("register.html", { root: "frontend" }); 
  // relative path resolved from 'frontend' folder
});

module.exports = app;
