const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const db = require("../db");

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || "ifamous-super-secret-key-2026";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

//verify the token before proceeding the backend search
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// GET /api/projects/my-workflow
router.get("/my-workflow", verifyToken, (req, res) => {
  const studentId = req.user.user_id;
  db.query("SELECT * FROM projects WHERE student_id = ? ORDER BY project_id DESC LIMIT 1", [studentId], (err, projects) => {
    if (err) return res.status(500).json({ error: err.message });

    const currentProject = projects.length > 0 ? projects[0] : null;

    db.query("SELECT * FROM milestone_settings ORDER BY step_sequence ASC", [], (err, milestones) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ project: currentProject, milestones: milestones });
    });
  });
});

// POST /api/projects
router.post("/", verifyToken, (req, res) => {
  const studentId = req.user.user_id;
  const { title, description } = req.body;

  // 1. Dynamically retrieve an active session to satisfy fyp_session FK constraint (projects_ibfk_4)
  db.query("SELECT fyp_session_id FROM fyp_session WHERE is_active = 1 LIMIT 1", (sessErr, sessRows) => {
    if (sessErr) return res.status(500).json({ error: sessErr.message });

    const proceedWithSession = (sessionId) => {
      // 2. Fetch the real metric number from users table (stored in affiliation column during signup)
      db.query("SELECT affiliation FROM users WHERE user_id = ?", [studentId], (userErr, userRows) => {
        if (userErr) return res.status(500).json({ error: userErr.message });
        
        const metricNumber = (userRows.length > 0 && userRows[0].affiliation) ? userRows[0].affiliation : ('STU_' + studentId);

        db.query(
          "INSERT IGNORE INTO students (student_id, metric_number) VALUES (?, ?)",
          [studentId, metricNumber],
          (checkErr) => {
            if (checkErr) return res.status(500).json({ error: "Failed to ensure student profile exists: " + checkErr.message });

            // 3. Insert project
            db.query(
              "INSERT INTO projects (title, description, status, student_id, supervisor_id, fyp_session_id, current_step) VALUES (?, ?, 'Draft', ?, NULL, ?, 1)",
              [title, description, studentId, sessionId],
              (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Project created", project_id: result.insertId });
              }
            );
          }
        );
      });
    };

    if (sessRows.length > 0) {
      proceedWithSession(sessRows[0].fyp_session_id);
    } else {
      // Try to find any session if no active one is set
      db.query("SELECT fyp_session_id FROM fyp_session LIMIT 1", (anySessErr, anySessRows) => {
        if (anySessErr) return res.status(500).json({ error: anySessErr.message });

        if (anySessRows.length > 0) {
          proceedWithSession(anySessRows[0].fyp_session_id);
        } else {
          // If the table is completely empty, seed a default active session (1)
          db.query("INSERT INTO fyp_session (fyp_session_id, is_active) VALUES (1, 1)", (insSessErr) => {
            if (insSessErr) return res.status(500).json({ error: "Failed to create default session: " + insSessErr.message });
            proceedWithSession(1);
          });
        }
      });
    }
  });
});

// PUT /api/projects/:id/nabc
router.put("/:id/nabc", verifyToken, upload.single('use_case_image'), (req, res) => {
  const projectId = req.params.id;
  const { need, approach, benefits, competition } = req.body;

  const use_case_url = req.file ? `/uploads/${req.file.filename}` : null;

  const nabcJson = JSON.stringify({ need, approach, benefits, competition, use_case_diagram_url: use_case_url });

  db.query("UPDATE projects SET nabc_canvas_json = ?, current_step = current_step + 1 WHERE project_id = ?", [nabcJson, projectId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "NABC Canvas updated" });
  });
});

// POST /api/projects/:id/submissions
router.post("/:id/submissions", verifyToken, upload.single('file'), (req, res) => {
  const projectId = req.params.id;
  const { step_setting_id, artifact_key } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.query("INSERT INTO projects_submissions (submission_title, file_path, submitted_at, submission_type, status, project_id, step_setting_id, artifact_key) VALUES (?, ?, NOW(), 'progress_report', 'pending', ?, ?, ?)",
    [`Submission for ${artifact_key}`, fileUrl, projectId, step_setting_id, artifact_key], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Submission successful" });
    });
});

// POST /api/projects/:id/final-deliverables
router.post("/:id/final-deliverables", verifyToken, upload.array('files'), (req, res) => {
  const projectId = req.params.id;
  const { github_url, cloud_url } = req.body;

  db.query("UPDATE projects SET github_link = ?, drive_link = ?, status = 'Reviewing', current_step = 3 WHERE project_id = ?", [github_url, cloud_url, projectId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Final deliverables submitted" });
  });
});

// POST /api/projects/:id/advance-step
router.post("/:id/advance-step", verifyToken, (req, res) => {
  const projectId = req.params.id;
  db.query("UPDATE projects SET current_step = current_step + 1 WHERE project_id = ?", [projectId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Step advanced" });
  });
});

module.exports = router;
