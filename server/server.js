// server/server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to database.");
});

// Status API Endpoint
app.get("/api/status", (req, res) => {
  db.ping((err) => {
    if (err) return res.status(500).json({ error: "Database connection failed" });
    res.json({ message: "connected" });
  });
});

// Simple API Endpoint
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.listen(3000, () => console.log("Backend running on port 3000"));
