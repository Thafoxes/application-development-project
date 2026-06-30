const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "ifamous-super-secret-key-2026";

// Signup API Endpoint
router.post("/signup", async (req, res) => {
  const {
    email,
    password,
    fullName,
    phoneNumber,
    companyName,
    expertise,
    affiliation,
    salutation_id,
  } = req.body;

  if (!salutation_id) {
    return res.status(400).json({ error: "Salutation is required." });
  }

  try {
    // Validate salutation referential integrity (SRS-VAL-07)
    db.query("SELECT 1 FROM salutations WHERE salutation_id = ?", [salutation_id], async (salCheckErr, salCheckResults) => {
      if (salCheckErr) {
        console.error("Salutation verification failed:", salCheckErr);
        return res.status(500).json({ error: "Registration verification failed" });
      }
      if (salCheckResults.length === 0) {
        return res.status(400).json({ error: "Invalid salutation selection." });
      }

      try {
        // pepper added to password for security
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

          // Stored procedure returns results as array of arrays. The SELECT statement is in results[0]
          const newUserIdRow = results && results[0] && results[0][0];
          const new_user_id = newUserIdRow ? newUserIdRow.new_user_id : null;

          if (new_user_id) {
            const lowerEmail = email.toLowerCase();
            const isStudent = lowerEmail.endsWith('@graduate.utm.my') ? 1 : 0;
            const isStaff = lowerEmail.endsWith('@utm.my') ? 1 : 0;

            // Update the user's salutation_id and role flags
            db.query("UPDATE users SET salutation_id = ?, is_student = ?, is_utm_staff = ? WHERE user_id = ?", [salutation_id, isStudent, isStaff, new_user_id], (updateErr) => {
              if (updateErr) {
                console.error("Error setting salutation_id after signup:", updateErr);
              }

              // Also add the student record into students table if they are a student
              if (isStudent) {
                const metricNumber = affiliation;
                db.query("INSERT IGNORE INTO students (student_id, metric_number) VALUES (?, ?)", [new_user_id, metricNumber.toUpperCase()], (studErr) => {
                  if (studErr) console.error("Error setting up student record:", studErr);
                  res.json({ message: "User registered successfully", results });
                });
              } else {
                res.json({ message: "User registered successfully", results });
              }
            });
          } else {
            res.json({ message: "User registered successfully", results });
          }
        });
      } catch (hashError) {
        console.error("Password hashing error:", hashError);
        return res.status(500).json({ error: "Server error during registration" });
      }
    });
  } catch (err) {
    console.error("Signup validation error:", err);
    return res.status(500).json({ error: "Server error during signup validation" });
  }
});

// Login API Endpoint
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT u.*, s.title_name FROM `ifamous_dbms`.`users` u LEFT JOIN `ifamous_dbms`.`salutations` s ON u.salutation_id = s.salutation_id WHERE u.email = ?";
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

      const isStudent = user.email.toLowerCase().endsWith('@graduate.utm.my') || Number(user.is_student) === 1;

      const proceedLogin = () => {
        // Call sp_lookup_user_role
        const roleSql = "CALL sp_lookup_user_role(?)";
        db.query(roleSql, [user.user_id], (roleErr, roleResults) => {
          if (roleErr) {
            console.error("Role lookup error:", roleErr);
            return res.status(500).json({ error: "Database error during role lookup" });
          }
          // Debug: Log what the database actually returned
          console.log("Procedure Results:", JSON.stringify(roleResults));

          // Attach the role information directly to the user object
          if (roleResults && roleResults[0] && roleResults[0].length > 0) {
            const roles = roleResults[0][0];
            user.is_student = Number(roles.is_student) === 1 ? 1 : user.is_student;
            user.is_supervisor = Number(roles.is_supervisor) === 1 ? 1 : user.is_supervisor;
            user.is_examiner = Number(roles.is_examiner) === 1 ? 1 : user.is_examiner;
            user.is_coordinator = Number(roles.is_coordinator) === 1 ? 1 : user.is_coordinator;
            user.role_info = roles; // Keep this just in case
          } else {
            console.warn("WARNING: sp_lookup_user_role returned 0 rows for email:", user.email);
          }

          // Aggregate system-wide roles for token payload (FR-AUTH-04 & FR-auth-01)
          const system_roles = [];
          if (Number(user.is_student) === 1) system_roles.push("student");
          if (Number(user.is_coordinator) === 1) system_roles.push("coordinator");
          if (Number(user.is_superadmin) === 1) system_roles.push("superadmin");
          if (Number(user.is_utm_staff) === 1) system_roles.push("staff");

          const tokenPayload = {
            user_id: user.user_id,
            email: user.email,
            salutations: user.title_name || "",
            title: user.title_name || "",
            full_name: user.full_name,
            is_utm_staff: Number(user.is_utm_staff) === 1 ? 1 : 0,
            system_roles: system_roles
          };

          const token = jwt.sign(
            tokenPayload,
            JWT_SECRET || "ifamous-super-secret-key-2026",
            { expiresIn: "24h" }
          );

          res.json({ message: "Login successful", user, token });
        });
      };

      if (isStudent) {
        db.query("SELECT * FROM students WHERE student_id = ?", [user.user_id], (studErr, studRows) => {
          if (!studErr && studRows.length > 0) {
            const studentInfo = studRows[0];
            // Merge student metrics into the user object
            user.metric_number = studentInfo.metric_number ? studentInfo.metric_number.toUpperCase() : '';
            user.class_id = studentInfo.class_id;
            user.CGPA = studentInfo.CGPA;
            user.GPA = studentInfo.GPA;
            user.proof_of_credit_hours = studentInfo.proof_of_credit_hours;
            user.credit_hours_completed = studentInfo.credit_hours_completed;
            proceedLogin();
          } else {
            // Student record is missing! Seed it dynamically to fix older accounts
            const metricNo = user.affiliation || ('STU_' + user.user_id);
            db.query("INSERT IGNORE INTO students (student_id, metric_number) VALUES (?, ?)", [user.user_id, metricNo], (insErr) => {
              if (insErr) console.error("Dynamic student seed failed:", insErr);

              user.metric_number = metricNo.toUpperCase();
              user.class_id = null;
              user.CGPA = 0.0;
              user.GPA = null;
              user.proof_of_credit_hours = null;
              user.credit_hours_completed = 0;
              proceedLogin();
            });
          }
        });
      } else {
        proceedLogin();
      }
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(500).json({ error: "Server error during login" });
    }
  });
});

module.exports = router;
