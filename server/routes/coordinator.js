const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "ifamous-super-secret-key-2026";

// Path definitions for file-based mock databases
const proposalsFilePath = path.join(__dirname, '..', '..', 'localData', 'fyp_proposals.json');
const userDataFilePath = path.join(__dirname, '..', '..', 'localData', 'user_data.json');
const tempFilePath = path.join(__dirname, '..', '..', 'localData', 'temp_meeting.json');

// Helper function to map projects to frontend structure
const mapProposalToFrontend = (p) => {
  return {
    project_id: p.project_id,
    fyp_session_id: p.fyp_session_id,
    studentName: p.student?.full_name || p.studentName || '',
    matricNo: p.student?.metric_number || p.matricNo || '',
    studentEmail: p.student?.email || p.studentEmail || '',
    cgpa: p.student?.cgpa || p.cgpa || null,
    projectTitle: p.title || p.projectTitle || '',
    projectType: p.projectType || 'System Development',
    status: p.status || 'submitted',
    aiStatus: p.aiStatus || 'Pending AI Matching',
    supervisorName: p.supervisor?.full_name || p.supervisorName || null,
    supervisorEmail: p.supervisor?.email || p.supervisorEmail || null,
    supervisorStatus: p.supervisor?.status || (p.supervisor ? 'pending' : null),
    supervisor: p.supervisor || null,
    use_case_diagrams: p.use_case_diagrams || [],
    matchScore: p.matchScore || null,
    github_link: p.github_link || null,
    drive_link: p.drive_link || null,
    abstract: p.abstract || '',
    keywords: p.keywords || '',
    fileName: p.fileName || 'Proposal document',
    coordinator_comments: p.coordinator_comments || null,
    examiners: p.examiners || (p.project_id === 5 ? [{ user_id: 4, full_name: "Prof. John Smith", role: "Examiner" }] : p.project_id === 6 ? [{ user_id: 10, full_name: "Robert Chen", role: "Examiner" }] : []),
    details: p.details || {}
  };
};

// --- SESSION MANAGEMENT ---

// GET all sessions
router.get("/sessions", (req, res) => {
  db.query("CALL sp_get_all_session()", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch sessions: " + err.message });
    res.json(results[0] || []);
  });
});

// GET active session
router.get("/sessions/active", (req, res) => {
  db.query("CALL sp_get_all_session()", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch active session: " + err.message });
    const sessions = results[0] || [];
    const activeSession = sessions.find(s => s.is_active === 1 || s.is_active === true || s.is_active === Buffer.from([1]));
    if (!activeSession) return res.status(404).json({ error: "No active session found" });
    res.json(activeSession);
  });
});

// PUT set session as active
router.put("/sessions/:id/active", (req, res) => {
  const sessionId = req.params.id;
  db.query("CALL sp_SetActiveFYPSession(?)", [sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to update active session: " + err.message });
    res.json({ message: "Session set as active successfully" });
  });
});

// GET single session
router.get("/sessions/:id", (req, res) => {
  const sessionId = req.params.id;
  db.query("CALL sp_select_session(?)", [sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch session: " + err.message });
    res.json(results[0]?.[0] || null);
  });
});

// POST create new session
router.post("/sessions", (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: "Session ID (number) is required" });
  db.query("CALL sp_insert_session(?)", [session_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to create session: " + err.message });
    res.json({ message: "Session created successfully" });
  });
});

// PUT update session
router.put("/sessions/:id", (req, res) => {
  const old_id = req.params.id;
  const { new_session_id } = req.body;
  if (!new_session_id) return res.status(400).json({ error: "New Session ID is required" });
  db.query("CALL sp_update_session(?, ?)", [old_id, new_session_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to update session: " + err.message });
    res.json({ message: "Session updated successfully" });
  });
});

// DELETE session
router.delete("/sessions/:id", (req, res) => {
  const session_id = req.params.id;
  db.query("CALL sp_delete_session(?)", [session_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to delete session: " + err.message });
    res.json({ message: "Session deleted successfully" });
  });
});

// GET full session data (timetables & projects)
router.get("/sessions/:id/data", (req, res) => {
  const sessionId = req.params.id;
  db.query("CALL sp_GetSessionCalendarData(?)", [sessionId], (err, results) => {
    if (err) {
      console.error("Database error in sp_GetSessionCalendarData:", err);
      return res.status(500).json({ error: "Failed to fetch session data: " + err.message });
    }
    const sessionRows = results[0] || [];
    if (sessionRows.length === 0) {
      return res.status(404).json({ error: `Session ${sessionId} not found.` });
    }
    const rawTimetables = results[1] || [];
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
        user_id: row.user_id,
        staff_name: row.staff_name,
        staff_email: row.staff_email,
        class_id: row.class_id,
        section_name: row.section_name,
        schedule
      };
    });
    res.json({
      fyp_session_id: parseInt(sessionId),
      timetables,
      projects: []
    });
  });
});

// --- TIMETABLE SCHEDULING ---

// POST create calendar schedule
router.post("/timetables", (req, res) => {
  const { fyp_session_id, user_id, class_id, schedule_json } = req.body;
  if (!fyp_session_id || !schedule_json) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const p_user_id = user_id ? parseInt(user_id) : null;
  const p_class_id = class_id ? parseInt(class_id) : null;
  db.query(
    "CALL sp_CreateCalendarSchedule(?, ?, ?, ?)",
    [fyp_session_id, p_user_id, p_class_id, JSON.stringify(schedule_json)],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to create schedule: " + err.message });
      const newIdRow = results[0] && results[0][0];
      const new_time_table_id = newIdRow ? newIdRow.new_time_table_id : null;
      res.json({ message: "Schedule created successfully", time_table_id: new_time_table_id });
    }
  );
});

// DELETE calendar schedule
router.delete("/timetables/:id", (req, res) => {
  const timeTableId = req.params.id;
  db.query("CALL sp_DeleteCalendarSchedule(?)", [timeTableId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to delete schedule: " + err.message });
    res.json({ message: "Schedule deleted successfully" });
  });
});

// PUT update calendar schedule
router.put("/timetables/:id", (req, res) => {
  const timeTableId = req.params.id;
  const { user_id, class_id, schedule_json } = req.body;
  if (!schedule_json) {
    return res.status(400).json({ error: "schedule_json is required" });
  }
  const p_user_id = user_id ? parseInt(user_id) : null;
  const p_class_id = class_id ? parseInt(class_id) : null;
  db.query("CALL sp_UpdateCalendarSchedule(?, ?, ?, ?)", [timeTableId, p_user_id, p_class_id, JSON.stringify(schedule_json)], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to update schedule: " + err.message });
    res.json({ message: "Schedule updated successfully" });
  });
});

// POST crosscheck timetable data
router.post("/timetable/crosscheck", (req, res) => {
  const { fyp_session_id, class_id, user_ids } = req.body;
  if (!fyp_session_id) return res.status(400).json({ error: "fyp_session_id is required" });

  const queries = [];
  const queryValues = [];

  if (class_id) {
    queries.push(`SELECT class_id, schedule_json FROM time_table WHERE class_id = ? AND fyp_session_id = ?`);
    queryValues.push([class_id, fyp_session_id]);
  }

  if (user_ids && user_ids.length > 0) {
    const placeholders = user_ids.map(() => '?').join(',');
    queries.push(`SELECT user_id, schedule_json FROM time_table WHERE user_id IN (${placeholders}) AND fyp_session_id = ?`);
    queryValues.push([...user_ids, fyp_session_id]);
  }

  if (queries.length === 0) {
    return res.json({ status: "success", data: { occupied_events: [] } });
  }

  const promises = queries.map((q, idx) => {
    return new Promise((resolve, reject) => {
      db.query(q, queryValues[idx], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  });

  const formatDate = (date) => {
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = date.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  Promise.all(promises)
    .then(resultsArray => {
      const aggregatedEvents = [];
      let idCounter = 1;

      resultsArray.forEach(results => {
        results.forEach(row => {
          let schedule = {};
          try {
            schedule = typeof row.schedule_json === 'string' ? JSON.parse(row.schedule_json) : row.schedule_json;
          } catch (e) {
            console.error("Failed to parse schedule_json", e);
            return;
          }

          const isClass = row.class_id != null;
          const ownerLabel = isClass ? `Class ID: ${row.class_id}` : `User ID: ${row.user_id}`;
          const color = isClass ? '#eab308' : '#5C001F';

          if (schedule.specific_events && Array.isArray(schedule.specific_events)) {
            schedule.specific_events.forEach(e => {
              aggregatedEvents.push({
                id: `crosscheck-sp-${idCounter++}`,
                title: e.label || e.title,
                date: e.date || e.target_date,
                start_time: e.start_time || '08:00',
                end_time: e.end_time || '09:00',
                owner: ownerLabel,
                is_class: isClass,
                color: color
              });
            });
          }

          if (schedule.weekly_recurring && Array.isArray(schedule.weekly_recurring)) {
            const startDate = new Date(2026, 0, 1);
            const endDate = new Date(2026, 11, 31);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const jsDay = d.getDay();
              const jsonDayOfWeek = jsDay === 0 ? 7 : jsDay;
              const dateStr = formatDate(d);
              const recurringDay = schedule.weekly_recurring.find(r => r.day_of_week === jsonDayOfWeek);
              if (recurringDay && recurringDay.slots) {
                recurringDay.slots.forEach(slot => {
                  aggregatedEvents.push({
                    id: `crosscheck-rc-${idCounter++}`,
                    title: slot.label,
                    date: dateStr,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    owner: ownerLabel,
                    is_class: isClass,
                    color: color
                  });
                });
              }
            }
          }
        });
      });
      res.json({ status: "success", data: { occupied_events: aggregatedEvents } });
    })
    .catch(err => {
      console.error("Crosscheck Query Error:", err);
      res.status(500).json({ error: "Failed to crosscheck timetables: " + err.message });
    });
});

// --- COORDINATOR / FYP QUEUE ---
router.get("/coordinator/fyp-queue", (req, res) => {
  try {
    if (fs.existsSync(proposalsFilePath)) {
      const raw = fs.readFileSync(proposalsFilePath, 'utf8');
      const proposals = JSON.parse(raw);
      res.json({ success: true, projects: proposals.map(mapProposalToFrontend) });
    } else {
      res.json({ success: true, projects: [] });
    }
  } catch (err) {
    console.error("Failed to load proposals queue:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/coordinator/fyp-proposal/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (fs.existsSync(proposalsFilePath)) {
      const raw = fs.readFileSync(proposalsFilePath, 'utf8');
      const proposals = JSON.parse(raw);
      const proposal = proposals.find(p => p.project_id === id);
      if (!proposal) return res.status(404).json({ success: false, error: "Proposal not found" });
      res.json({ success: true, proposal: mapProposalToFrontend(proposal) });
    } else {
      res.status(404).json({ success: false, error: "Proposal not found" });
    }
  } catch (err) {
    console.error("Failed to load proposal details:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/coordinator/fyp-status/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, matchScore, coordinator_comments, feedback } = req.body;
    if (fs.existsSync(proposalsFilePath)) {
      const raw = fs.readFileSync(proposalsFilePath, 'utf8');
      const proposals = JSON.parse(raw);
      const idx = proposals.findIndex(p => p.project_id === id);
      if (idx !== -1) {
        proposals[idx].status = status.toLowerCase();
        if (status.toLowerCase() === 'approved') {
          proposals[idx].status = 'approved';
          proposals[idx].coordinator_comments = null;
        } else if (status.toLowerCase() === 'rejected') {
          proposals[idx].status = 'rejected';
          const comments = coordinator_comments !== undefined ? coordinator_comments : feedback;
          if (comments !== undefined) proposals[idx].coordinator_comments = comments;
        }
        if (matchScore !== undefined) proposals[idx].matchScore = matchScore;
        fs.writeFileSync(proposalsFilePath, JSON.stringify(proposals, null, 4));
        return res.json({ success: true, project: mapProposalToFrontend(proposals[idx]) });
      }
    }
    res.status(404).json({ success: false, error: "Proposal not found" });
  } catch (err) {
    console.error("Failed to update status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- SUPERVISOR MATCHING ---
router.get("/coordinator/supervisor-candidates", (req, res) => {
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

router.get("/supervisor-matching/projects", (req, res) => {
  try {
    if (fs.existsSync(proposalsFilePath)) {
      const raw = fs.readFileSync(proposalsFilePath, 'utf8');
      const proposals = JSON.parse(raw);
      res.json({ success: true, projects: proposals.map(mapProposalToFrontend) });
    } else {
      res.json({ success: true, projects: [] });
    }
  } catch (err) {
    console.error("Failed to load projects:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/supervisor-matching/match", (req, res) => {
  const recommendations = [
    {
      supervisor_id: 4020,
      name: "Dr. Sarah",
      email: "dr.sarah@utm.my",
      score: 95,
      reason: "Lecturer matches keywords (Vue.js, Academic Advisor) and has capacity.",
      capacity: 5,
      current: 2,
      research_expertise: "Web Engineering, Agile Methodologies, Intelligent Advisor Systems"
    },
    {
      supervisor_id: 4021,
      name: "Prof. John Smith",
      email: "john.smith@utm.my",
      score: 82,
      reason: "Expert in software metrics and system analysis.",
      capacity: 4,
      current: 3,
      research_expertise: "Software Quality, Empirical Software Engineering"
    },
    {
      supervisor_id: 4022,
      name: "Dr. Neo",
      email: "dr.neo@utm.my",
      score: 75,
      reason: "Works in AI systems and intelligent databases.",
      capacity: 3,
      current: 1,
      research_expertise: "Artificial Intelligence, Database Tuning"
    }
  ];
  res.json({ success: true, recommendations, source: "Ollama Cloud" });
});

router.post("/supervisor-matching/assign", (req, res) => {
  try {
    const { projectId, supervisor } = req.body;
    const id = parseInt(projectId);
    if (fs.existsSync(proposalsFilePath)) {
      const raw = fs.readFileSync(proposalsFilePath, 'utf8');
      const proposals = JSON.parse(raw);
      const idx = proposals.findIndex(p => p.project_id === id);
      if (idx !== -1) {
        const oldSupervisorId = proposals[idx].supervisor ? proposals[idx].supervisor.supervisor_id : null;
        proposals[idx].supervisor = {
          supervisor_id: supervisor.supervisor_id || 4020,
          full_name: supervisor.name || supervisor.full_name,
          email: supervisor.email
        };
        fs.writeFileSync(proposalsFilePath, JSON.stringify(proposals, null, 4));

        const newSupervisorId = supervisor.supervisor_id;
        if (fs.existsSync(userDataFilePath)) {
          const usersRaw = fs.readFileSync(userDataFilePath, 'utf8');
          const users = JSON.parse(usersRaw);
          let updated = false;
          users.forEach(u => {
            if (oldSupervisorId && Number(u.user_id) === Number(oldSupervisorId) && Number(oldSupervisorId) !== Number(newSupervisorId)) {
              u.current_sv_capacity = Math.max(0, (u.current_sv_capacity || 0) - 1);
              updated = true;
            }
            if (newSupervisorId && Number(u.user_id) === Number(newSupervisorId) && Number(oldSupervisorId) !== Number(newSupervisorId)) {
              u.current_sv_capacity = (u.current_sv_capacity || 0) + 1;
              updated = true;
            }
          });
          if (updated) {
            fs.writeFileSync(userDataFilePath, JSON.stringify(users, null, 4));
            const mockUserPath = path.join(__dirname, '..', '..', 'src', 'mock', 'user_data.json');
            if (fs.existsSync(mockUserPath)) fs.writeFileSync(mockUserPath, JSON.stringify(users, null, 4));
          }
        }
        return res.json({ success: true, assignment: mapProposalToFrontend(proposals[idx]) });
      }
    }
    res.status(404).json({ success: false, error: "Project not found" });
  } catch (err) {
    console.error("Failed to assign supervisor:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- TEMP MEETINGS ---
router.post("/timetable/generate-temp", (req, res) => {
  const { project, date, start_time, end_time, duration } = req.body;
  if (!project || !date || !start_time || !end_time) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  const payload = {
    id: Date.now().toString(),
    project_id: project.project_id,
    project_title: project.fyp_title,
    student: project.student,
    supervisor: project.supervisor,
    examiners: project.examiners || [],
    date,
    start_time,
    end_time,
    duration,
    generated_at: new Date().toISOString()
  };
  try {
    let meetings = [];
    if (fs.existsSync(tempFilePath)) {
      const data = fs.readFileSync(tempFilePath, 'utf8');
      if (data) {
        meetings = JSON.parse(data);
        if (!Array.isArray(meetings)) meetings = [meetings];
      }
    }
    meetings.push(payload);
    fs.writeFileSync(tempFilePath, JSON.stringify(meetings, null, 4));
    res.json({ success: true, message: "Temporary schedule saved successfully", data: meetings });
  } catch (err) {
    console.error("Failed to write temporary schedule:", err);
    res.status(500).json({ success: false, error: "Server file write error" });
  }
});

router.get("/timetable/temp", (req, res) => {
  try {
    if (fs.existsSync(tempFilePath)) {
      const data = fs.readFileSync(tempFilePath, 'utf8');
      if (data) {
        let meetings = JSON.parse(data);
        if (!Array.isArray(meetings)) meetings = [meetings];
        return res.json({ success: true, data: meetings });
      }
    }
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to read temp meeting" });
  }
});

router.delete("/timetable/temp", (req, res) => {
  try {
    const id = req.query.id;
    if (fs.existsSync(tempFilePath)) {
      if (id) {
        let meetings = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
        if (!Array.isArray(meetings)) meetings = [meetings];
        meetings = meetings.filter(m => m.id !== id);
        fs.writeFileSync(tempFilePath, JSON.stringify(meetings, null, 4));
      } else {
        fs.writeFileSync(tempFilePath, JSON.stringify([], null, 4));
      }
    }
    res.json({ success: true, message: "Temp meeting(s) deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete temp meeting" });
  }
});

// --- AI AUTO SCHEDULING ---
router.post("/timetable/auto-assign", async (req, res) => {
  let {
    fyp_session_id,
    startDate,
    endDate,
    duration,
    allowedDays,
    avoidWeekend,
    avoidOffWorkingHour,
    workingHourStart,
    workingHourEnd,
    avoidLunchHour,
    lunchHourStart,
    lunchHourEnd
  } = req.body;

  if (!fyp_session_id) {
    try {
      const sessionResult = await new Promise((resolve, reject) => {
        db.query("CALL sp_get_all_session()", (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || []);
        });
      });
      const activeSession = sessionResult.find(s => s.is_active === 1 || s.is_active === true || s.is_active === Buffer.from([1]));
      if (activeSession) {
        fyp_session_id = activeSession.fyp_session_id;
      } else {
        return res.status(400).json({ success: false, error: "No active session found and fyp_session_id not specified." });
      }
    } catch (e) {
      console.error("Failed to fetch active session for auto-assign:", e);
      return res.status(500).json({ success: false, error: "Database error resolving active session" });
    }
  }

  if (!startDate || !endDate) return res.status(400).json({ success: false, error: "startDate and endDate are required" });

  const aiProjectsFilePath = path.join(__dirname, '..', '..', 'localData', 'fyp_mock_structure.json');
  let projects = [];
  try {
    if (fs.existsSync(aiProjectsFilePath)) projects = JSON.parse(fs.readFileSync(aiProjectsFilePath, 'utf8'));
  } catch (err) {
    console.error("Failed to read fyp_mock_structure.json:", err);
    return res.status(500).json({ success: false, error: "Server failed to load project mock structure" });
  }

  let timetables = [];
  try {
    timetables = await new Promise((resolve, reject) => {
      db.query("SELECT user_id, class_id, schedule_json FROM time_table WHERE fyp_session_id = ?", [fyp_session_id], (err, results) => {
        if (err) reject(err);
        else resolve(results || []);
      });
    });
  } catch (err) {
    console.error("Failed to query time tables for auto-assign:", err);
    return res.status(500).json({ success: false, error: "Database query failed for timetables" });
  }

  const userSchedules = {};
  const classSchedules = {};
  timetables.forEach(row => {
    let schedule = {};
    if (row.schedule_json) {
      try {
        schedule = typeof row.schedule_json === 'string' ? JSON.parse(row.schedule_json) : row.schedule_json;
      } catch (parseErr) {
        console.error(`Failed to parse schedule_json:`, parseErr);
      }
    }
    if (row.user_id != null) userSchedules[row.user_id] = schedule;
    if (row.class_id != null) classSchedules[row.class_id] = schedule;
  });

  const isOccupied = (schedule, dateStr, slotStart, slotEnd) => {
    if (!schedule) return false;
    if (schedule.specific_events && Array.isArray(schedule.specific_events)) {
      for (const e of schedule.specific_events) {
        if ((e.date || e.target_date) === dateStr) {
          if (slotStart < (e.end_time || '09:00') && slotEnd > (e.start_time || '08:00')) return true;
        }
      }
    }
    if (schedule.weekly_recurring && Array.isArray(schedule.weekly_recurring)) {
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const jsDay = new Date(Date.UTC(y, m - 1, dayNum)).getUTCDay();
      const jsonDayOfWeek = jsDay === 0 ? 7 : jsDay;
      const recurringDay = schedule.weekly_recurring.find(r => r.day_of_week === jsonDayOfWeek);
      if (recurringDay && recurringDay.slots) {
        for (const slot of recurringDay.slots) {
          if (slotStart < slot.end_time && slotEnd > slot.start_time) return true;
        }
      }
    }
    return false;
  };

  const getDatesInRange = (startStr, endStr) => {
    const dates = [];
    const [sYear, sMonth, sDay] = startStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endStr.split('-').map(Number);
    const start = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const end = new Date(Date.UTC(eYear, eMonth - 1, eDay));
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      let month = '' + (d.getUTCMonth() + 1);
      let day = '' + d.getUTCDate();
      const year = d.getUTCFullYear();
      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;
      dates.push([year, month, day].join('-'));
    }
    return dates;
  };

  const dates = getDatesInRange(startDate, endDate);
  const dur = parseInt(duration) || 10;
  const meetings = [];
  const unscheduledProjects = [];

  const addMinutes = (timeStr, mins) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMins = h * 60 + m + mins;
    const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const newM = (totalMins % 60).toString().padStart(2, '0');
    return `${newH}:${newM}`;
  };

  const localAssignedSlots = [];
  const isScheduledInRun = (userId, classId, dateStr, slotStart, slotEnd) => {
    for (const mt of localAssignedSlots) {
      if (mt.date === dateStr) {
        const isStudentMatch = classId && mt.student?.class_id === classId;
        const isUserMatch = (userId === mt.student?.user_id || userId === mt.supervisor?.user_id || mt.examiners?.some(ex => ex.user_id === userId));
        if (isStudentMatch || isUserMatch) {
          if (slotStart < mt.end_time && slotEnd > mt.start_time) return true;
        }
      }
    }
    return false;
  };

  for (const project of projects) {
    let scheduled = false;
    const studentUserId = project.student?.user_id;
    const studentClassId = project.student?.class_id;
    const supervisorUserId = project.supervisor?.user_id;
    const examinerUserIds = (project.examiners || []).map(ex => ex.user_id);

    for (const dateStr of dates) {
      if (scheduled) break;
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const dayOfWeek = new Date(Date.UTC(y, m - 1, dayNum)).getUTCDay();
      const jsDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (allowedDays && Array.isArray(allowedDays) && allowedDays.length > 0 && !allowedDays.includes(jsDayOfWeek)) continue;
      if (avoidWeekend && (dayOfWeek === 0 || dayOfWeek === 6)) continue;

      let dayStart = '08:00', dayEnd = '17:00';
      if (avoidOffWorkingHour) {
        dayStart = workingHourStart || '08:00';
        dayEnd = workingHourEnd || '17:00';
      }

      let currentSlotStart = dayStart;
      while (currentSlotStart < dayEnd) {
        const currentSlotEnd = addMinutes(currentSlotStart, dur);
        if (currentSlotEnd > dayEnd) break;
        if (avoidLunchHour && lunchHourStart && lunchHourEnd && currentSlotStart < lunchHourEnd && currentSlotEnd > lunchHourStart) {
          currentSlotStart = addMinutes(currentSlotStart, 5);
          continue;
        }

        let hasConflict = false;
        if (studentClassId && isOccupied(classSchedules[studentClassId], dateStr, currentSlotStart, currentSlotEnd)) hasConflict = true;
        if (!hasConflict && studentUserId && isOccupied(userSchedules[studentUserId], dateStr, currentSlotStart, currentSlotEnd)) hasConflict = true;
        if (!hasConflict && supervisorUserId && isOccupied(userSchedules[supervisorUserId], dateStr, currentSlotStart, currentSlotEnd)) hasConflict = true;
        if (!hasConflict) {
          for (const exId of examinerUserIds) {
            if (isOccupied(userSchedules[exId], dateStr, currentSlotStart, currentSlotEnd)) { hasConflict = true; break; }
          }
        }

        if (!hasConflict) {
          if (isScheduledInRun(studentUserId, studentClassId, dateStr, currentSlotStart, currentSlotEnd)) hasConflict = true;
          if (!hasConflict && isScheduledInRun(supervisorUserId, null, dateStr, currentSlotStart, currentSlotEnd)) hasConflict = true;
          if (!hasConflict) {
            for (const exId of examinerUserIds) {
              if (isScheduledInRun(exId, null, dateStr, currentSlotStart, currentSlotEnd)) { hasConflict = true; break; }
            }
          }
        }

        if (!hasConflict) {
          const payload = {
            id: (Date.now() + Math.floor(Math.random() * 100000)).toString(),
            project_id: project.project_id,
            project_title: project.fyp_title,
            student: project.student,
            supervisor: project.supervisor,
            examiners: project.examiners || [],
            date: dateStr,
            start_time: currentSlotStart,
            end_time: currentSlotEnd,
            duration: dur,
            generated_at: new Date().toISOString()
          };
          meetings.push(payload);
          localAssignedSlots.push(payload);
          scheduled = true;
          break;
        }
        currentSlotStart = currentSlotEnd;
      }
    }
    if (!scheduled) unscheduledProjects.push(project);
  }

  try {
    fs.writeFileSync(tempFilePath, JSON.stringify(meetings, null, 4));
    res.json({ success: true, message: "AI scheduling complete", data: meetings, totalProjects: projects.length, unscheduledProjects });
  } catch (err) {
    console.error("Failed to save auto-assigned meetings:", err);
    res.status(500).json({ success: false, error: "Failed to write temp meeting file" });
  }
});

// --- USER DIRECTORY & MANAGEMENT ---
router.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

router.get("/users/recent", (req, res) => {
  db.query("CALL sp_GetRecentUsersByCategory()", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      students: results[0] || [],
      lecturers: results[1] || [],
      outsiders: results[2] || []
    });
  });
});

router.get("/users/paginated", (req, res) => {
  const category = req.query.category;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  let countQuery = "", dataQuery = "";

  if (category === 'students') {
    countQuery = `SELECT COUNT(*) as total FROM users u JOIN students s ON u.user_id = s.student_id`;
    dataQuery = `SELECT u.*, s.metric_number FROM users u JOIN students s ON u.user_id = s.student_id ORDER BY u.date_created DESC LIMIT ? OFFSET ?`;
  } else if (category === 'lecturers') {
    countQuery = `SELECT COUNT(*) as total FROM users u WHERE u.is_utm_staff = 1 AND u.user_id NOT IN (SELECT student_id FROM students)`;
    dataQuery = `SELECT u.* FROM users u WHERE u.is_utm_staff = 1 AND u.user_id NOT IN (SELECT student_id FROM students) ORDER BY u.date_created DESC LIMIT ? OFFSET ?`;
  } else if (category === 'outsiders') {
    countQuery = `SELECT COUNT(*) as total FROM users u WHERE (u.is_utm_staff = 0 OR u.is_utm_staff IS NULL) AND u.user_id NOT IN (SELECT student_id FROM students)`;
    dataQuery = `SELECT u.* FROM users u WHERE (u.is_utm_staff = 0 OR u.is_utm_staff IS NULL) AND u.user_id NOT IN (SELECT student_id FROM students) ORDER BY u.date_created DESC LIMIT ? OFFSET ?`;
  } else {
    return res.status(400).json({ error: "Invalid category" });
  }

  db.query(countQuery, (err, countResults) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countResults[0].total;
    db.query(dataQuery, [limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: results, total, page, totalPages: Math.ceil(total / limit) });
    });
  });
});

router.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  const checkStudentSql = "SELECT EXISTS(SELECT 1 FROM students WHERE student_id = ?) AS is_student";
  db.query(checkStudentSql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to retrieve user details" });
    const isStudent = results && results[0] && Number(results[0].is_student) === 1;
    if (isStudent) {
      db.query("CALL sp_GetStudentFYPDetail(?)", [userId], (spErr, spResults) => {
        if (spErr) return res.status(500).json({ error: "Failed to retrieve student details" });
        const studentData = spResults && spResults[0] && spResults[0][0];
        if (!studentData) return res.status(404).json({ error: "User not found" });
        res.json({ role: "student", data: studentData });
      });
    } else {
      db.query("CALL sp_GetNonStudentUserDetail(?)", [userId], (spErr, spResults) => {
        if (spErr) return res.status(500).json({ error: "Failed to retrieve user details" });
        const userData = spResults && spResults[0] && spResults[0][0];
        if (!userData) return res.status(404).json({ error: "User not found" });
        res.json({ role: userData.is_utm_staff === 1 ? "lecturer" : "outsider", data: userData });
      });
    }
  });
});

router.delete("/users/:id", (req, res) => {
  db.query("DELETE FROM users WHERE user_id = ?", [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User deleted successfully" });
  });
});

router.post("/users", (req, res) => {
  const { email, password, full_name, phone_number, co_org_name, expertise, affiliation } = req.body;
  if (!email || !password || !full_name) return res.status(400).json({ error: "Missing required fields" });
  db.query("CALL sp_signup_normal_user(?, ?, ?, ?, ?, ?, ?)",
    [email, password, full_name, phone_number || null, co_org_name || null, expertise || null, affiliation || null],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User created successfully" });
    });
});

router.post("/users/update-password", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user_id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing password fields" });

    db.query("SELECT password_hash FROM users WHERE user_id = ?", [userId], async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(404).json({ error: "User not found" });
      const user = results[0];
      const pepper = process.env.SECRET_PEPPER || '';
      const match = await bcrypt.compare(currentPassword + pepper, user.password_hash);
      if (!match) return res.status(401).json({ error: "Incorrect current password" });

      const newHash = await bcrypt.hash(newPassword + pepper, 10);
      db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [newHash, userId], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: "Failed to update password" });
        res.json({ success: true, message: "Password updated successfully" });
      });
    });
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
});

router.put("/users/:id", (req, res) => {
  const { full_name, email, phone_number, expertise, affiliation, salutation_id } = req.body;
  const userId = req.params.id;
  if (!full_name || !email) return res.status(400).json({ error: "Missing required fields" });
  const target_salutation_id = salutation_id || 1;

  db.query("SELECT 1 FROM salutations WHERE salutation_id = ?", [target_salutation_id], (salCheckErr, salCheckResults) => {
    if (salCheckErr || salCheckResults.length === 0) return res.status(400).json({ error: "Invalid salutation selection." });
    db.query("CALL sp_UpdateUserProfile(?,?,?,?,?,?);", [userId, full_name, email, phone_number || null, expertise || null, affiliation || null], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query("UPDATE users SET salutation_id = ? WHERE user_id = ?", [target_salutation_id, userId], (updateErr) => {
        if (updateErr) console.error("Failed to update salutation_id:", updateErr);
        res.json({ message: "User updated successfully" });
      });
    });
  });
});

router.put("/user/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user_id;
    const { salutation_id, full_name, phone_number } = req.body;
    if (!salutation_id || !full_name) return res.status(400).json({ error: "Missing required fields." });

    db.query("SELECT 1 FROM salutations WHERE salutation_id = ?", [salutation_id], (salCheckErr, salCheckResults) => {
      if (salCheckErr || salCheckResults.length === 0) return res.status(400).json({ error: "Invalid salutation selection." });
      db.query("UPDATE users SET salutation_id = ?, full_name = ?, phone_number = ? WHERE user_id = ?", [salutation_id, full_name, phone_number || null, userId], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: "Failed to update profile: " + updateErr.message });

        const refetchSql = "SELECT u.user_id, u.email, u.full_name, u.phone_number, u.is_student, u.is_coordinator, u.is_superadmin, u.is_utm_staff, s.title_name FROM users u LEFT JOIN salutations s ON u.salutation_id = s.salutation_id WHERE u.user_id = ?";
        db.query(refetchSql, [userId], (fetchErr, fetchResults) => {
          if (fetchErr || fetchResults.length === 0) return res.status(200).json({ message: "Profile updated, but failed to re-generate session token." });
          const updatedUser = fetchResults[0];
          const system_roles = [];
          if (Number(updatedUser.is_student) === 1) system_roles.push("student");
          if (Number(updatedUser.is_coordinator) === 1) system_roles.push("coordinator");
          if (Number(updatedUser.is_superadmin) === 1) system_roles.push("superadmin");
          if (Number(updatedUser.is_utm_staff) === 1) system_roles.push("staff");

          const tokenPayload = {
            user_id: updatedUser.user_id,
            email: updatedUser.email,
            salutations: updatedUser.title_name || "",
            title: updatedUser.title_name || "",
            full_name: updatedUser.full_name,
            is_utm_staff: Number(updatedUser.is_utm_staff) === 1 ? 1 : 0,
            system_roles
          };
          const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });
          const roleSql = "CALL sp_lookup_user_role(?)";
          db.query(roleSql, [updatedUser.user_id], (roleErr, roleResults) => {
            if (!roleErr && roleResults && roleResults[0] && roleResults[0].length > 0) {
              const roles = roleResults[0][0];
              updatedUser.is_student = Number(roles.is_student) === 1 ? 1 : updatedUser.is_student;
              updatedUser.is_supervisor = Number(roles.is_supervisor) === 1 ? 1 : updatedUser.is_supervisor;
              updatedUser.is_examiner = Number(roles.is_examiner) === 1 ? 1 : updatedUser.is_examiner;
              updatedUser.is_coordinator = Number(roles.is_coordinator) === 1 ? 1 : updatedUser.is_coordinator;
            }
            res.json({ message: "Profile updated successfully", user: updatedUser, token: newToken });
          });
        });
      });
    });
  } catch (jwtErr) {
    return res.status(403).json({ error: "Invalid token" });
  }
});

// --- AUTOCOMPLETE SEARCH ---
router.get("/users/search", (req, res) => {
  const query = req.query.q;
  const sessionId = req.query.session_id;
  if (!query || !sessionId) return res.json([]);
  db.query("CALL sp_SearchNonStudentUsers(?, ?)", [`%${query}%`, sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0] || []);
  });
});

router.get("/classes/search", (req, res) => {
  const query = req.query.q;
  const sessionId = req.query.session_id;
  if (!query || !sessionId) return res.json([]);
  const sql = "SELECT class_id, section_name FROM fyp_classes WHERE fyp_session_id = ? AND section_name LIKE ? AND class_id NOT IN (SELECT class_id FROM time_table WHERE fyp_session_id = ? AND class_id IS NOT NULL) LIMIT 10";
  db.query(sql, [sessionId, `%${query}%`, sessionId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
