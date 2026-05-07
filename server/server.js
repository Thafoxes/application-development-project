// server/server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
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
    if (err)
      return res.status(500).json({ error: "Database connection failed" });
    res.json({ message: "connected" });
  });
});

// Signup API Endpoint
app.post("/api/signup", async (req, res) => {
  const {
    email,
    password,
    fullName,
    phoneNumber,
    companyName,
    expertise,
    affiliation,
  } = req.body;

  try {
    //pepper added to password for security
    const pepper = process.env.SECRET_PEPPER;
    const hashedPassword = await bcrypt.hash(password + pepper, 10);

    const sql = "CALL sp_signup_normal_user(?, ?, ?, ?, ?, ?, ?)";
    const values = [
      email,
      hashedPassword,
      fullName,
      phoneNumber,
      companyName || null,
      expertise || null,
      affiliation || null,
    ];

    db.query(sql, values, (err, results) => {
      if (err) {
        console.error("Signup error:", err);
        return res
          .status(500)
          .json({ error: "Registration failed", details: err.message });
      }
      res.json({ message: "User registered successfully", results });
    });
  } catch (hashError) {
    console.error("Password hashing error:", hashError);
    return res.status(500).json({ error: "Server error during registration" });
  }
});

// Login API Endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM `ifamous_dbms`.`users` WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Database error during login" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];

    try {
      const pepper = process.env.SECRET_PEPPER;
      const match = await bcrypt.compare(password + pepper, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Successful login
      delete user.password_hash;
      
      // Call sp_lookup_user_role
      const roleSql = "CALL sp_lookup_user_role(?, ?)";
      db.query(roleSql, [user.email, user.user_id], (roleErr, roleResults) => {
        if (roleErr) {
          console.error("Role lookup error:", roleErr);
          // If the procedure fails, we still might want to let them login, or fail strictly
          return res.status(500).json({ error: "Database error during role lookup" });
        }
        
        // Attach the role information returned by the procedure
        if (roleResults && roleResults[0] && roleResults[0].length > 0) {
          user.role_info = roleResults[0][0]; 
        }

        res.json({ message: "Login successful", user });
      });
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(500).json({ error: "Server error during login" });
    }
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
