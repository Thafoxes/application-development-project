const express = require("express");
const router = express.Router();
const db = require("../db");

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

module.exports = router;
