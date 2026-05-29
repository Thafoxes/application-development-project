// server/server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Import and use the assistant router
const assistantRouter = require("./routes/assistant");
app.use(assistantRouter);

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
        // Debug: Log what the database actually returned
        console.log("Procedure Results:", JSON.stringify(roleResults));

        // Attach the role information directly to the user object
        if (roleResults && roleResults[0] && roleResults[0].length > 0) {
          const roles = roleResults[0][0];
          user.is_student = roles.is_student;
          user.is_supervisor = roles.is_supervisor;
          user.is_examiner = roles.is_examiner;
          user.is_coordinator = roles.is_coordinator;
          user.role_info = roles; // Keep this just in case
        } else {
          console.warn("WARNING: sp_lookup_user_role returned 0 rows for email:", user.email);
        }

        res.json({ message: "Login successful", user });
      });
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(500).json({ error: "Server error during login" });
    }
  });
});

// --- SESSION MANAGEMENT APIs ---

// GET all sessions
app.get("/api/sessions", (req, res) => {
  db.query("CALL sp_get_all_session()", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch sessions: " + err.message });
    // results[0] contains the select query results
    res.json(results[0] || []);
  });
});

// GET active session
app.get("/api/sessions/active", (req, res) => {
  db.query("CALL sp_get_all_session()", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch active session: " + err.message });
    const sessions = results[0] || [];
    const activeSession = sessions.find(s => s.is_active === 1 || s.is_active === true || s.is_active === Buffer.from([1]));
    if (!activeSession) return res.status(404).json({ error: "No active session found" });
    res.json(activeSession);
  });
});

// PUT set session as active
app.put("/api/sessions/:id/active", (req, res) => {
  const sessionId = req.params.id;
  // Update all to inactive, then set the specific one to active
  db.query("sp_SetActiveFYPSession(?)", [sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to update active session: " + err.message });
    res.json({ message: "Session set as active successfully" });
  });
});

// GET single session
app.get("/api/sessions/:id", (req, res) => {
  const sessionId = req.params.id;
  db.query("CALL sp_select_session(?)", [sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch session: " + err.message });
    res.json(results[0]?.[0] || null);
  });
});

// POST create new session
app.post("/api/sessions", (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: "Session ID (number) is required" });

  db.query("CALL sp_insert_session(?)", [session_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to create session: " + err.message });
    res.json({ message: "Session created successfully" });
  });
});

// PUT update session
app.put("/api/sessions/:id", (req, res) => {
  const old_id = req.params.id;
  const { new_session_id } = req.body;
  if (!new_session_id) return res.status(400).json({ error: "New Session ID is required" });

  db.query("CALL sp_update_session(?, ?)", [old_id, new_session_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to update session: " + err.message });
    res.json({ message: "Session updated successfully" });
  });
});

// DELETE session
app.delete("/api/sessions/:id", (req, res) => {
  const session_id = req.params.id;
  db.query("CALL sp_delete_session(?)", [session_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to delete session: " + err.message });
    res.json({ message: "Session deleted successfully" });
  });
});

// GET full session data (timetables & projects)
app.get("/api/sessions/:id/data", (req, res) => {
  const sessionId = req.params.id;
  db.query("CALL sp_GetSessionCalendarData(?)", [sessionId], (err, results) => {
    if (err) {
      console.error("Database error in sp_GetSessionCalendarData:", err);
      return res.status(500).json({ error: "Failed to fetch session data: " + err.message });
    }

    // With mysql2 stored procedures returning multiple result sets:
    // results[0] -> first SELECT (session verification)
    // results[1] -> second SELECT (timetables)
    const sessionRows = results[0] || [];
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: `Session ${sessionId} not found.` });
    }

    const rawTimetables = results[1] || [];

    // Parse the schedule_json for each timetable
    const timetables = rawTimetables.map(row => {
      let schedule = {};
      if (row.schedule_json) {
        try {
          schedule = typeof row.schedule_json === 'string'
            ? JSON.parse(row.schedule_json)
            : row.schedule_json;
        } catch (parseErr) {
          console.error(`Failed to parse schedule_json for timetable ${row.time_table_id}:`, parseErr);
        }
      }
      return {
        time_table_id: row.time_table_id,
        is_class: row.is_class,
        owner_identifier: row.owner_identifier,
        schedule
      };
    });

    res.json({
      fyp_session_id: parseInt(sessionId),
      timetables,
      projects: [] // Return an empty array for backward compatibility
    });
  });
});

// POST create calendar schedule
app.post("/api/timetables", (req, res) => {
  const { fyp_session_id, is_class, owner_identifier, schedule_json } = req.body;
  
  if (!fyp_session_id || is_class === undefined || !owner_identifier || !schedule_json) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query(
    "CALL sp_CreateCalendarSchedule(?, ?, ?, ?)",
    [fyp_session_id, is_class, owner_identifier, JSON.stringify(schedule_json)],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to create schedule: " + err.message });
      
      // The procedure returns the new ID in the first result set
      const newIdRow = results[0] && results[0][0];
      const new_time_table_id = newIdRow ? newIdRow.new_time_table_id : null;
      
      res.json({ message: "Schedule created successfully", time_table_id: new_time_table_id });
    }
  );
});

// DELETE calendar schedule
app.delete("/api/timetables/:id", (req, res) => {
  const timeTableId = req.params.id;
  db.query("CALL sp_DeleteCalendarSchedule(?)", [timeTableId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to delete schedule: " + err.message });
    res.json({ message: "Schedule deleted successfully" });
  });
});

// PUT update calendar schedule
app.put("/api/timetables/:id", (req, res) => {
  const timeTableId = req.params.id;
  const { owner_identifier, schedule_json } = req.body;
  if (!owner_identifier || !schedule_json) {
    return res.status(400).json({ error: "owner_identifier and schedule_json are required" });
  }

  db.query("CALL sp_UpdateCalendarSchedule(?, ?, ?)", [timeTableId, owner_identifier, JSON.stringify(schedule_json)], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to update schedule: " + err.message });
    res.json({ message: "Schedule updated successfully" });
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
