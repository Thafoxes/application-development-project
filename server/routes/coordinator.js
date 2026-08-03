/**
 * coordinator management routes
 * handles fetching coordinator FYP proposal queue and updating project status in SQL database
 */

const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireAnyRole } = require("../middleware/auth");
const { workflowStateForStatus } = require("../utils/workflowState");

const router = express.Router();

router.use("/coordinator", authenticateToken, requireAnyRole("coordinator"));

// GET /api/coordinator/fyp-queue - get all FYP proposals submitted to coordinator queue from SQL database
router.get("/coordinator/fyp-queue", (req, res) => {
  const sql = `
    SELECT
      fp.project_id,
      fp.student_user_id,
      fp.student_name,
      fp.matric_no,
      fp.project_title,
      fp.project_type,
      fp.abstract,
      fp.keywords,
      fp.supervisor_user_id,
      fp.supervisor_name,
      fp.supervisor_email,
      fp.match_score,
      fp.status,
      fp.created_at,
      fp.updated_at,
      ps.submission_id,
      ps.original_file_name,
      ps.file_path,
      ps.mime_type,
      ps.submission_type,
      ps.status AS submission_status,
      ps.submitted_at
    FROM fyp_projects fp
    LEFT JOIN projects_submissions ps 
      ON ps.project_id = fp.project_id
      AND ps.submission_type = 'proposal'
    WHERE
      fp.student_user_id IS NOT NULL
      OR fp.status IN (
        'Pending Coordinator Review',
        'Pending Review',
        'Pending AI Matching',
        'Pending Supervisor Assignment',
        'Pending Supervisor Approval'
      )
    ORDER BY fp.created_at DESC, fp.project_id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const projects = (rows || []).map((row) => {
      const hasSupervisor = Boolean(row.supervisor_user_id || (row.supervisor_name && row.supervisor_name !== "Not Assigned"));
      let aiStatus = "Pending";
      if (hasSupervisor) {
        aiStatus = "Supervisor Assigned";
      } else if (row.match_score) {
        aiStatus = "AI Completed";
      } else {
        aiStatus = "Pending";
      }

      return {
        project_id: row.project_id,
        student_user_id: row.student_user_id,
        studentName: row.student_name || "Student",
        matricNo: row.matric_no || "-",
        projectTitle: row.project_title || "Untitled FYP",
        projectType: row.project_type || "Development",
        abstract: row.abstract || "",
        keywords: row.keywords || "",
        supervisor_user_id: row.supervisor_user_id,
        supervisorName: row.supervisor_name || "Not Assigned",
        supervisorEmail: row.supervisor_email || "",
        matchScore: row.match_score || null,
        status: row.status || "Pending Coordinator Review",
        proposalStatus: row.submission_status || "pending",
        aiStatus: aiStatus,
        submissionId: row.submission_id || null,
        fileName: row.original_file_name || row.file_path || "No proposal document",
        mimeType: row.mime_type || "application/octet-stream",
        submittedAt: row.submitted_at || row.created_at,
        updatedAt: row.updated_at,
      };
    });

    res.json({
      success: true,
      projects,
    });
  });
});

// PATCH /api/coordinator/fyp-status/:projectId - update FYP project status and match score in SQL database
router.patch("/coordinator/fyp-status/:projectId", (req, res) => {
  const projectId = req.params.projectId;
  let { status, matchScore, feedback } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ success: false, error: "Project ID is required" });
  }

  if (!status) {
    return res.status(400).json({ success: false, error: "Status is required" });
  }

  const allowedStatuses = [
    "Pending Coordinator Review",
    "Pending AI Matching",
    "Pending Supervisor Assignment",
    "Pending Supervisor Approval",
    "Active",
    "FYP Approved",
    "Revision Required",
    "Rejected"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid project status" });
  }

  // Check if project has an assigned supervisor to set correct approved status
  db.query("SELECT supervisor_user_id FROM fyp_projects WHERE project_id = ? LIMIT 1", [projectId], (checkErr, projRows) => {
    if (checkErr) {
      return res.status(500).json({ success: false, error: checkErr.message });
    }

    const currentProject = projRows?.[0];
    const hasSupervisor = Boolean(currentProject?.supervisor_user_id);

    let targetStatus = status;
    if (status === "Pending AI Matching" || status === "FYP Approved" || status === "Active") {
      targetStatus = hasSupervisor ? "Active" : "Pending AI Matching";
    }

    const workflow = workflowStateForStatus(targetStatus, 0);
    const isApproved = targetStatus === "Pending AI Matching" || targetStatus === "Pending Supervisor Assignment" || targetStatus === "Active" || targetStatus === "FYP Approved";
    const approvedClause = isApproved ? ", proposal_approved_at = COALESCE(proposal_approved_at, NOW())" : "";

    const sql = `
      UPDATE fyp_projects
      SET status = ?,
          match_score = COALESCE(?, match_score),
          current_phase = ?,
          progress_percent = GREATEST(COALESCE(progress_percent, 0), ?),
          risk_status = ?
          ${approvedClause},
          updated_at = NOW()
      WHERE project_id = ?
    `;

    db.query(sql, [targetStatus, matchScore || null, workflow.phase, workflow.progress, workflow.risk, projectId], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      if (feedback && feedback.trim()) {
        const authorId = req.user?.user_id || null;
        const feedbackSql = `
          INSERT INTO fyp_feedback (project_id, author_user_id, feedback_text, category, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `;
        db.query(feedbackSql, [projectId, authorId, feedback.trim(), status === "Revision Required" ? "Proposal Revision Request" : "Coordinator Review"], (fbErr) => {
          if (fbErr) console.warn("Could not record feedback:", fbErr.message);
        });
      }

      res.json({
        success: true,
        projectId,
        status: targetStatus,
        affectedRows: result.affectedRows,
      });
    });
  });
});

// DELETE /api/coordinator/fyp-projects/:projectId - delete an FYP project and associated records
router.delete("/coordinator/fyp-projects/:projectId", (req, res) => {
  const projectId = req.params.projectId;

  if (!projectId) {
    return res.status(400).json({ success: false, error: "Project ID is required" });
  }

  const childTables = [
    "projects_submissions",
    "fyp_supervisor_nominations",
    "fyp_examiner_assignments",
    "fyp_milestones",
    "fyp_progress_updates",
    "fyp_logbooks",
    "fyp_feedback",
    "fyp_action_items",
    "fyp_evaluations",
    "fyp_supervisor_assessments"
  ];

  // Helper to delete from child tables sequentially, then delete main project
  const deleteChildTable = (index) => {
    if (index < childTables.length) {
      const table = childTables[index];
      db.query(`DELETE FROM ${table} WHERE project_id = ?`, [projectId], (err) => {
        if (err) {
          console.warn(`Non-fatal warning deleting from ${table}:`, err.message);
        }
        deleteChildTable(index + 1);
      });
    } else {
      db.query("DELETE FROM fyp_projects WHERE project_id = ?", [projectId], (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, error: "Project not found or already deleted." });
        }

        res.json({
          success: true,
          message: "FYP project deleted successfully.",
          projectId,
        });
      });
    }
  };

  deleteChildTable(0);
});

module.exports = router;

