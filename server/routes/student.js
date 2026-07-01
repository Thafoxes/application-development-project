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
  db.query("SELECT * FROM projects WHERE student_id = ? ORDER BY project_id ASC", [studentId], (err, projects) => {
    if (err) return res.status(500).json({ error: err.message });

    const currentProject = projects.length > 0 ? projects[projects.length - 1] : null;

    db.query("SELECT * FROM milestone_settings ORDER BY step_sequence ASC", [], (err, milestones) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ project: currentProject, proposals: projects, milestones: milestones });
    });
  });
});

// POST /api/projects
router.post("/", verifyToken, (req, res) => {
  const studentId = req.user.user_id;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Project title is required." });
  }

  // Enforce max limit of 2 proposals per student
  db.query("SELECT COUNT(*) as count FROM projects WHERE student_id = ?", [studentId], (countErr, countRows) => {
    if (countErr) return res.status(500).json({ error: countErr.message });
    if (countRows[0].count >= 2) {
      return res.status(400).json({ error: "Maximum capacity threshold hit. You cannot submit more than 2 proposals for this session." });
    }

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

            // 3. Insert project with title only, leaving description and proposal null
            db.query(
              "INSERT INTO projects (title, description, status, student_id, supervisor_id, fyp_session_id, current_step) VALUES (?, NULL, 'Draft', ?, NULL, ?, 1)",
              [title, studentId, sessionId],
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
  }); // Closes db.query fyp_session
  }); // Closes db.query COUNT(*)
}); // Closes router.post

// PUT /api/projects/:id/proposal
router.put("/:id/proposal", verifyToken, (req, res) => {
  const projectId = req.params.id;
  const studentId = req.user.user_id;
  const { initial_proposal_json, status } = req.body;

  if (!initial_proposal_json) {
    return res.status(400).json({ error: "Missing initial_proposal_json payload." });
  }

  const { student_meta, project_meta } = initial_proposal_json;
  if (!student_meta || !project_meta) {
    return res.status(400).json({ error: "Missing required meta blocks." });
  }

  const cgpa = parseFloat(student_meta.cgpa);
  const projectType = project_meta.project_type;

  // Enforce CGPA validation for Research projects (FR-1.3 & SDD 2.5)
  if (projectType === 'Research' && cgpa < 3.3) {
    return res.status(403).json({
      error: "Research track requires a minimum CGPA of 3.3."
    });
  }

  // Verify ownership
  db.query("SELECT 1 FROM projects WHERE project_id = ? AND student_id = ?", [projectId, studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized or project not found." });
    }

    db.query(
      "UPDATE projects SET initial_proposal_json = ?, title = ?, description = ?, status = ? WHERE project_id = ? AND student_id = ?",
      [
        JSON.stringify(initial_proposal_json), 
        initial_proposal_json.proposal_content?.title || initial_proposal_json.title || 'Untitled Project', 
        initial_proposal_json.text_content?.problem_background || '', 
        status || 'Draft',
        projectId, 
        studentId
      ],
      (updErr) => {
        if (updErr) return res.status(500).json({ error: updErr.message });
        res.json({ message: "Initial proposal updated successfully." });
      }
    );
  });
});

// PUT /api/projects/:id/nabc
router.put("/:id/nabc", verifyToken, upload.single('use_case_image'), (req, res) => {
  const projectId = req.params.id;
  const { need, approach, benefits, competition, matrix_rows, stakeholders, data_respondents, references, table_data } = req.body;
  const use_case_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.query("SELECT nabc_canvas_json FROM projects WHERE project_id = ?", [projectId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let existingNabc = {};
    if (rows.length > 0 && rows[0].nabc_canvas_json) {
      try {
        existingNabc = typeof rows[0].nabc_canvas_json === 'string'
          ? JSON.parse(rows[0].nabc_canvas_json)
          : rows[0].nabc_canvas_json;
      } catch (e) {
        console.error("NABC parse error:", e);
      }
    }

    const merged = {
      need: need !== undefined ? need : existingNabc.need,
      approach: approach !== undefined ? approach : existingNabc.approach,
      benefits: benefits !== undefined ? benefits : existingNabc.benefits,
      competition: competition !== undefined ? competition : existingNabc.competition,
      stakeholders: stakeholders !== undefined ? stakeholders : existingNabc.stakeholders,
      data_respondents: data_respondents !== undefined ? data_respondents : existingNabc.data_respondents,
      references: references !== undefined ? references : existingNabc.references,
      use_case_diagram_url: use_case_url || existingNabc.use_case_diagram_url,
      matrix_rows: matrix_rows ? JSON.parse(matrix_rows) : existingNabc.matrix_rows,
      table_data: table_data ? JSON.parse(table_data) : existingNabc.table_data
    };

    db.query("UPDATE projects SET nabc_canvas_json = ?, current_step = current_step + 1 WHERE project_id = ?", [JSON.stringify(merged), projectId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "NABC Canvas updated" });
    });
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

// PUT /api/projects/:id/credits
router.put("/:id/credits", verifyToken, (req, res) => {
  const projectId = req.params.id;
  const studentId = req.user.user_id;
  const { credits } = req.body;

  db.query("SELECT initial_proposal_json FROM projects WHERE project_id = ? AND student_id = ?", [projectId, studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Project not found." });

    let parsed = {};
    if (rows[0].initial_proposal_json) {
      try {
        parsed = typeof rows[0].initial_proposal_json === 'string'
          ? JSON.parse(rows[0].initial_proposal_json)
          : rows[0].initial_proposal_json;
      } catch (e) {
        console.error("Credits JSON parse error:", e);
      }
    }

    if (!parsed.student_meta) {
      parsed.student_meta = {};
    }
    parsed.student_meta.credits_obtained = parseInt(credits) || 0;

    db.query("UPDATE projects SET initial_proposal_json = ? WHERE project_id = ? AND student_id = ?",
      [JSON.stringify(parsed), projectId, studentId],
      (updErr) => {
        if (updErr) return res.status(500).json({ error: updErr.message });
        res.json({ success: true, message: "Credits updated successfully." });
      }
    );
  });
});

// PUT /api/projects/:id/nominate-supervisor
router.put("/:id/nominate-supervisor", verifyToken, (req, res) => {
  const projectId = req.params.id;
  const studentId = req.user.user_id;
  const { supervisor_id } = req.body;

  db.query("UPDATE projects SET supervisor_id = ? WHERE project_id = ? AND student_id = ?",
    [supervisor_id || null, projectId, studentId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Supervisor nominated successfully." });
    }
  );
});

module.exports = router;
