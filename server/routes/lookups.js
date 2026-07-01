const express = require("express");
const router = express.Router();
const db = require("../db");
const fs = require("fs");
const path = require("path");

const userDataFilePath = path.join(__dirname, '..', '..', 'localData', 'user_data.json');

// GET lookups for salutations (academic and professional titles)
router.get("/salutations", (req, res) => {
  db.query("SELECT salutation_id, title_name FROM salutations ORDER BY salutation_id ASC", (err, results) => {
    if (err) {
      console.error("Error fetching salutations:", err);
      return res.status(500).json({ error: "Failed to fetch salutations: " + err.message });
    }
    res.json(results);
  });
});

// Shared lookup for supervisor candidates (utm staff & industry affiliates)
router.get("/supervisor-candidates", (req, res) => {
  try {
    if (fs.existsSync(userDataFilePath)) {
      const raw = fs.readFileSync(userDataFilePath, 'utf8');
      const users = JSON.parse(raw);
      const candidates = users.filter(u => u.is_utm_staff || u.affiliation === 'Industry');
      const enriched = candidates.map((u) => {
        let max_capacity = u.sv_capacity !== undefined ? u.sv_capacity : (u.sv_vapacity !== undefined ? u.sv_vapacity : 5);
        let current_capacity = u.current_sv_capacity !== undefined ? u.current_sv_capacity : 0;
        return {
          user_id: u.user_id,
          email: u.email,
          full_name: u.full_name,
          phone_number: u.phone_number || u["Phone number"] || "",
          is_utm_staff: u.is_utm_staff,
          affiliation: u.affiliation || (u.is_utm_staff ? "UTM" : "External"),
          co_org_name: u.co_org_name || null,
          expertise: u.expertise || [],
          max_capacity,
          current_capacity,
          sv_capacity: u.sv_capacity !== undefined ? u.sv_capacity : u.sv_vapacity,
          sv_vapacity: u.sv_vapacity !== undefined ? u.sv_vapacity : u.sv_capacity
        };
      });
      res.json({ success: true, candidates: enriched });
    } else {
      res.json({ success: true, candidates: [] });
    }
  } catch (err) {
    console.error("Failed to load candidates:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
