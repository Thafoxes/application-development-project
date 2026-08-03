/**
 * timetable and schedule management routes
 * handles timetable CRUD operations, schedule crosschecking, temporary meeting generation, and AI auto-scheduling in SQL database
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const tempFilePath = path.join(__dirname, "..", "..", "localData", "temp_meeting.json");

// GET /api/timetables/my-schedule - get personal schedule & available section templates
router.get("/timetables/my-schedule", authenticateToken, (req, res) => {
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ error: "User ID missing from authentication token." });
  }

  // 1. Query active or any valid session
  db.query("SELECT fyp_session_id, session_name FROM fyp_session ORDER BY fyp_session_id DESC LIMIT 1", (sessErr, sessRows) => {
    const activeSession = (sessRows && sessRows[0]) || { fyp_session_id: 1, session_name: 'Default Session' };

    // 2. Query user's personal timetable
    const userSql = `
      SELECT time_table_id, fyp_session_id, user_id, schedule_json
      FROM time_table
      WHERE user_id = ?
      ORDER BY time_table_id DESC LIMIT 1
    `;

    db.query(userSql, [userId], (userErr, userRows) => {
      if (userErr) {
        return res.status(500).json({ error: userErr.message });
      }

      let userSchedule = null;
      if (userRows && userRows.length > 0) {
        const row = userRows[0];
        let parsed = [];
        try {
          parsed = typeof row.schedule_json === 'string' ? JSON.parse(row.schedule_json) : (row.schedule_json || []);
        } catch (e) {
          parsed = [];
        }
        userSchedule = {
          time_table_id: row.time_table_id,
          fyp_session_id: row.fyp_session_id,
          user_id: row.user_id,
          schedule: parsed,
        };
      }

      // 3. Query Master Section Timetables (created by Coordinator)
      const templatesSql = `
        SELECT 
          fc.class_id,
          fc.section_name,
          fc.fyp_session_id,
          tt.time_table_id,
          tt.schedule_json
        FROM fyp_classes fc
        LEFT JOIN time_table tt ON tt.class_id = fc.class_id
        ORDER BY fc.section_name ASC, tt.time_table_id DESC
      `;

      db.query(templatesSql, (tmplErr, tmplRows) => {
        if (tmplErr) {
          console.error("Fetch section templates error:", tmplErr);
        }

        const seenClassIds = new Set();
        const templates = [];
        (tmplRows || []).forEach((row) => {
          if (!seenClassIds.has(row.class_id)) {
            seenClassIds.add(row.class_id);
            let parsed = [];
            if (row.schedule_json) {
              try {
                parsed = typeof row.schedule_json === 'string' ? JSON.parse(row.schedule_json) : (row.schedule_json || []);
              } catch (e) {
                parsed = [];
              }
            }
            templates.push({
              time_table_id: row.time_table_id || row.class_id,
              class_id: row.class_id,
              section_name: row.section_name || `Section ${row.class_id}`,
              course_code: "Official Section",
              schedule: parsed,
            });
          }
        });

        res.json({
          success: true,
          activeSession,
          userSchedule,
          sectionTemplates: templates,
        });
      });
    });
  });
});

// POST /api/timetables/my-schedule - save/upsert user's personal customized schedule
router.post("/timetables/my-schedule", authenticateToken, (req, res) => {
  const userId = req.user?.user_id;
  const { schedule_json, fyp_session_id } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: "User ID missing from authentication token." });
  }

  if (!schedule_json) {
    return res.status(400).json({ error: "schedule_json is required." });
  }

  const jsonStr = typeof schedule_json === 'string' ? schedule_json : JSON.stringify(schedule_json);

  // 1. Resolve existing valid fyp_session_id from database to avoid foreign key constraint failure
  db.query("SELECT fyp_session_id FROM fyp_session ORDER BY fyp_session_id DESC LIMIT 1", (sessErr, sessRows) => {
    let resolvedSessionId = (sessRows && sessRows.length > 0) ? sessRows[0].fyp_session_id : (fyp_session_id ? parseInt(fyp_session_id) : null);

    const savePersonalSchedule = (validSessionId) => {
      const checkSql = "SELECT time_table_id FROM time_table WHERE user_id = ? LIMIT 1";
      db.query(checkSql, [userId], (checkErr, rows) => {
        if (checkErr) return res.status(500).json({ error: checkErr.message });

        if (rows && rows.length > 0) {
          const timeTableId = rows[0].time_table_id;
          const updateSql = "UPDATE time_table SET schedule_json = ?, fyp_session_id = ? WHERE time_table_id = ?";
          db.query(updateSql, [jsonStr, validSessionId, timeTableId], (upErr) => {
            if (upErr) return res.status(500).json({ error: upErr.message });
            res.json({ success: true, message: "Personal schedule updated successfully.", time_table_id: timeTableId });
          });
        } else {
          const insertSql = "INSERT INTO time_table (fyp_session_id, user_id, class_id, schedule_json) VALUES (?, ?, NULL, ?)";
          db.query(insertSql, [validSessionId, userId, jsonStr], (inErr, result) => {
            if (inErr) return res.status(500).json({ error: inErr.message });
            res.json({ success: true, message: "Personal schedule saved successfully.", time_table_id: result.insertId });
          });
        }
      });
    };

    if (!resolvedSessionId) {
      // If fyp_session table is completely empty, insert an initial session record
      const createSessSql = "INSERT INTO fyp_session (session_name, status) VALUES ('2025/2026-1', 'Active')";
      db.query(createSessSql, (createErr, createRes) => {
        const fallbackId = (createRes && createRes.insertId) ? createRes.insertId : 1;
        savePersonalSchedule(fallbackId);
      });
    } else {
      savePersonalSchedule(resolvedSessionId);
    }
  });
});

// DELETE /api/timetables/my-schedule - delete user's personal timetable schedule
router.delete("/timetables/my-schedule", authenticateToken, (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) {
    return res.status(401).json({ error: "User ID missing from authentication token." });
  }

  const deleteSql = "DELETE FROM time_table WHERE user_id = ?";
  db.query(deleteSql, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "Personal schedule deleted successfully." });
  });
});

// POST /api/timetables - create new timetable schedule in SQL database
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

// DELETE /api/timetables/:id - delete timetable schedule from SQL database
router.delete("/timetables/:id", (req, res) => {
  const timeTableId = req.params.id;
  db.query("CALL sp_DeleteCalendarSchedule(?)", [timeTableId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to delete schedule: " + err.message });
    res.json({ message: "Schedule deleted successfully" });
  });
});

// PUT /api/timetables/:id - update timetable schedule in SQL database
router.put("/timetables/:id", (req, res) => {
  const timeTableId = req.params.id;
  const { user_id, class_id, schedule_json } = req.body;

  if (!schedule_json) {
    return res.status(400).json({ error: "schedule_json is required" });
  }

  const p_user_id = user_id ? parseInt(user_id) : null;
  const p_class_id = class_id ? parseInt(class_id) : null;

  db.query(
    "CALL sp_UpdateCalendarSchedule(?, ?, ?, ?)",
    [timeTableId, p_user_id, p_class_id, JSON.stringify(schedule_json)],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to update schedule: " + err.message });
      res.json({ message: "Schedule updated successfully" });
    }
  );
});

// POST /api/timetable/crosscheck - crosscheck class and user timetable schedules to detect slot conflicts
router.post("/timetable/crosscheck", (req, res) => {
  const { fyp_session_id, class_id, user_ids, user_roles } = req.body;

  if (!fyp_session_id) {
    return res.status(400).json({ error: "fyp_session_id is required" });
  }

  const userRolesMap = user_roles || {};
  const queries = [];
  const queryValues = [];

  if (class_id) {
    queries.push(`SELECT class_id, NULL AS user_id, schedule_json, NULL AS full_name, NULL AS email FROM time_table WHERE class_id = ? AND fyp_session_id = ?`);
    queryValues.push([class_id, fyp_session_id]);
  }

  if (user_ids && user_ids.length > 0) {
    const placeholders = user_ids.map(() => '?').join(',');
    queries.push(`
      SELECT tt.user_id, tt.class_id, tt.schedule_json, u.full_name, u.email
      FROM time_table tt
      LEFT JOIN users u ON u.user_id = tt.user_id
      WHERE tt.user_id IN (${placeholders})
    `);
    queryValues.push([...user_ids]);
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

  Promise.all(promises)
    .then(resultsArray => {
      const aggregatedEvents = [];
      let idCounter = 1;

      const formatDate = (date) => {
        let month = '' + (date.getMonth() + 1);
        let day = '' + date.getDate();
        const year = date.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
      };

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
          const meta = userRolesMap[row.user_id] || userRolesMap[String(row.user_id)] || {};
          const roleName = meta.role || (isClass ? 'Class' : 'User');
          const emailOrName = meta.email || row.email || row.full_name || `User ${row.user_id}`;
          const ownerLabel = isClass ? `Class ${row.class_id}` : `${roleName}: ${emailOrName}`;
          const color = isClass ? '#eab308' : (meta.color || '#5C001F');

          // Universal extractor for all schedule formats
          let weeklySlots = [];
          let specificList = [];

          if (Array.isArray(schedule)) {
            schedule.forEach(item => {
              if (item.date || item.target_date) {
                specificList.push(item);
              } else if (item.day_of_week || item.dayOfWeek || item.day_name) {
                weeklySlots.push(item);
              }
            });
          } else if (schedule && typeof schedule === 'object') {
            const specArr = schedule.specific_events || schedule.events || schedule.specificEvents || [];
            if (Array.isArray(specArr)) {
              specArr.forEach(item => specificList.push(item));
            }

            const recArr = schedule.weekly_recurring || schedule.weekly_schedule || schedule.slots || [];
            if (Array.isArray(recArr)) {
              recArr.forEach(item => {
                if (item.slots && Array.isArray(item.slots)) {
                  const dayNum = item.day_of_week || item.dayOfWeek || 1;
                  item.slots.forEach(s => {
                    weeklySlots.push({ ...s, day_of_week: dayNum });
                  });
                } else if (item.day_of_week || item.dayOfWeek || item.day_name) {
                  weeklySlots.push(item);
                }
              });
            }
          }

          // 1. Process specific date events
          specificList.forEach(e => {
            aggregatedEvents.push({
              id: `crosscheck-sp-${idCounter++}`,
              title: e.label || e.title || e.subject || 'Event',
              date: e.date || e.target_date,
              start_time: e.start_time || e.time || '08:00',
              end_time: e.end_time || '09:00',
              owner: ownerLabel,
              is_class: isClass,
              color: color
            });
          });

          // 2. Process weekly recurring slots (expanded across 2026)
          const dayMapNames = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
          const startDate = new Date(2026, 0, 1);
          const endDate = new Date(2026, 11, 31);

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const jsDay = d.getDay();
            const jsonDayOfWeek = jsDay === 0 ? 7 : jsDay;
            const dateStr = formatDate(d);

            weeklySlots.forEach(slot => {
              const slotDay = slot.day_of_week || slot.dayOfWeek || (slot.day_name ? dayMapNames[slot.day_name] : null);
              if (slotDay === jsonDayOfWeek) {
                aggregatedEvents.push({
                  id: `crosscheck-rc-${idCounter++}`,
                  title: slot.label || slot.title || slot.subject || 'Weekly Slot',
                  date: dateStr,
                  start_time: slot.start_time || slot.time || '08:00',
                  end_time: slot.end_time || slot.time ? `${parseInt((slot.start_time||slot.time).split(':')[0]) + 1}:00` : '09:00',
                  owner: ownerLabel,
                  is_class: isClass,
                  color: color
                });
              }
            });
          }
        });
      });

      const foundUserIds = new Set();
      resultsArray.forEach(results => {
        results.forEach(row => {
          if (row.user_id != null) {
            foundUserIds.add(Number(row.user_id));
          }
        });
      });

      const missingActors = [];
      if (user_ids && Array.isArray(user_ids)) {
        user_ids.forEach(uid => {
          const numId = Number(uid);
          if (numId > 0 && !foundUserIds.has(numId)) {
            const meta = userRolesMap[uid] || userRolesMap[String(uid)] || {};
            missingActors.push({
              user_id: numId,
              role: meta.role || 'User',
              email: meta.email || `User ID ${numId}`,
            });
          }
        });
      }

      console.log("\n📋 ================= FYP ACTORS TIMETABLE BREAKDOWN =================");
      if (user_ids && Array.isArray(user_ids)) {
        user_ids.forEach(uid => {
          const numId = Number(uid);
          const meta = userRolesMap[uid] || userRolesMap[String(uid)] || {};
          const role = meta.role || 'Party Member';
          const email = meta.email || `ID ${numId}`;
          const isFound = foundUserIds.has(numId);

          if (isFound) {
            const userRows = [];
            resultsArray.forEach(arr => {
              arr.forEach(r => {
                if (Number(r.user_id) === numId) userRows.push(r);
              });
            });
            console.log(`✅ [${role.toUpperCase()}] ${email} (User ID: ${numId}) -> TIMETABLE FOUND (${userRows.length} record(s))`);
            userRows.forEach((r, idx) => {
              try {
                const sched = typeof r.schedule_json === 'string' ? JSON.parse(r.schedule_json) : r.schedule_json;
                console.log(`   -> Record #${idx + 1} Schedule JSON:`, JSON.stringify(sched, null, 2));
              } catch(e) {
                console.log(`   -> Record #${idx + 1} Raw:`, r.schedule_json);
              }
            });
          } else {
            console.log(`❌ [${role.toUpperCase()}] ${email} (User ID: ${numId}) -> NO TIMETABLE FOUND IN DATABASE`);
          }
        });
      }
      console.log("======================================================================\n");

      res.json({
        status: "success",
        data: {
          occupied_events: aggregatedEvents,
          missing_actors: missingActors
        }
      });
    })
    .catch(err => {
      console.error("Crosscheck Query Error:", err);
      res.status(500).json({ error: "Failed to crosscheck timetables: " + err.message });
    });
});

// POST /api/timetable/generate-temp - save temporary generated meeting schedule to JSON file storage
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

// GET /api/timetable/temp - get saved temporary meeting schedules from JSON file storage
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

// DELETE /api/timetable/temp - delete temporary meeting schedules from JSON file storage
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

// Helper to fetch real FYP projects from MySQL database
async function fetchRealProjectsFromDb() {
  // 1. Query current active session from SQL database
  const activeSessionRows = await new Promise((resolve) => {
    db.query(
      `SELECT fyp_session_id FROM fyp_session WHERE is_active = 1 OR is_active = TRUE ORDER BY fyp_session_id DESC LIMIT 1`,
      (err, results) => {
        if (err || !results || !results.length) {
          db.query(`SELECT fyp_session_id FROM fyp_session ORDER BY fyp_session_id DESC LIMIT 1`, (err2, res2) => {
            resolve(res2 || []);
          });
        } else {
          resolve(results);
        }
      }
    );
  });

  const activeSessionId = activeSessionRows?.[0]?.fyp_session_id || 1;

  // 2. Query real FYP projects from database
  const sql = `
    SELECT
      fp.project_id,
      fp.project_title,
      fp.status,
      fp.student_user_id,
      su.user_id AS resolved_student_user_id,
      fp.student_name,
      fp.matric_no,
      fp.created_at,
      fp.updated_at,
      su.full_name AS student_full_name,
      su.email AS student_email,
      fp.supervisor_user_id,
      sv_u.user_id AS resolved_supervisor_user_id,
      COALESCE(sv_u.full_name, fp.supervisor_name, 'Not Assigned') AS supervisor_full_name,
      COALESCE(sv_u.email, fp.supervisor_email, '') AS supervisor_email,
      ea.examiner_user_id AS assigned_examiner_user_id,
      ex_u.user_id AS resolved_examiner_user_id,
      COALESCE(ex_u.full_name, fp.examiner_name) AS examiner_full_name,
      COALESCE(ex_u.email, fp.examiner_email) AS examiner_email
    FROM fyp_projects fp
    LEFT JOIN users su ON (su.user_id = fp.student_user_id OR (fp.student_name IS NOT NULL AND su.full_name = fp.student_name))
    LEFT JOIN users sv_u ON (sv_u.user_id = fp.supervisor_user_id OR (fp.supervisor_email IS NOT NULL AND fp.supervisor_email != '' AND sv_u.email = fp.supervisor_email))
    LEFT JOIN fyp_examiner_assignments ea ON ea.project_id = fp.project_id AND ea.status = 'Assigned'
    LEFT JOIN users ex_u ON (ex_u.user_id = COALESCE(ea.examiner_user_id, fp.examiner_user_id) OR (fp.examiner_email IS NOT NULL AND fp.examiner_email != '' AND ex_u.email = fp.examiner_email))
    ORDER BY fp.project_id ASC
  `;

  const rows = await new Promise((resolve) => {
    db.query(sql, (err, results) => {
      if (err) {
        console.error("fetchRealProjectsFromDb query error:", err);
        resolve([]);
      } else {
        resolve(results || []);
      }
    });
  });

  if (!rows || rows.length === 0) {
    return null;
  }

  const projectMap = new Map();
  for (const r of rows) {
    if (!projectMap.has(r.project_id)) {
      projectMap.set(r.project_id, {
        project_id: r.project_id,
        fyp_title: r.project_title || 'FYP Project',
        fyp_session_id: activeSessionId,
        created_at: r.created_at || null,
        updated_at: r.updated_at || r.created_at || null,
        student: {
          user_id: r.resolved_student_user_id || r.student_user_id || 0,
          full_name: r.student_full_name || r.student_name || 'Student',
          email: r.student_email || '',
          matric_no: r.matric_no || '',
          class_id: null,
        },
        supervisor: {
          user_id: r.resolved_supervisor_user_id || r.supervisor_user_id || 0,
          full_name: r.supervisor_full_name,
          email: r.supervisor_email,
        },
        examiners: [],
      });
    }

    const proj = projectMap.get(r.project_id);
    const exUserId = r.resolved_examiner_user_id || r.assigned_examiner_user_id || 0;
    if (exUserId > 0 || r.examiner_full_name) {
      if (!proj.examiners.some((e) => e.user_id === exUserId && exUserId > 0)) {
        proj.examiners.push({
          user_id: exUserId,
          full_name: r.examiner_full_name || 'Examiner',
          email: r.examiner_email || '',
        });
      }
    }
  }

  return Array.from(projectMap.values());
}

// GET /api/timetable/projects - get all FYP projects from database for scheduling
router.get("/timetable/projects", async (req, res) => {
  try {
    const realProjects = await fetchRealProjectsFromDb();
    if (realProjects && realProjects.length > 0) {
      return res.json({ success: true, data: realProjects });
    }
    const projectsFilePath = path.join(__dirname, "..", "..", "localData", "fyp_mock_structure.json");
    if (fs.existsSync(projectsFilePath)) {
      const mockProjects = JSON.parse(fs.readFileSync(projectsFilePath, 'utf8'));
      return res.json({ success: true, data: mockProjects });
    }
    return res.json({ success: true, data: [] });
  } catch (err) {
    console.error("Error fetching timetable projects:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/timetable/auto-assign - run AI auto-scheduling algorithm for FYP project presentations
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
        fyp_session_id = activeSession.session_id;
      } else {
        return res.status(400).json({ success: false, error: "No active session found and fyp_session_id not specified." });
      }
    } catch (e) {
      console.error("Failed to fetch active session for auto-assign:", e);
      return res.status(500).json({ success: false, error: "Database error resolving active session" });
    }
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: "startDate and endDate are required" });
  }

  let projects = await fetchRealProjectsFromDb();
  if (!projects || projects.length === 0) {
    const projectsFilePath = path.join(__dirname, "..", "..", "localData", "fyp_mock_structure.json");
    try {
      if (fs.existsSync(projectsFilePath)) {
        projects = JSON.parse(fs.readFileSync(projectsFilePath, 'utf8'));
      }
    } catch (err) {
      console.error("Failed to read fyp_mock_structure.json:", err);
      return res.status(500).json({ success: false, error: "Server failed to load project mock structure" });
    }
  }

  let timetables = [];
  try {
    timetables = await new Promise((resolve, reject) => {
      db.query(
        "SELECT user_id, class_id, schedule_json FROM time_table WHERE fyp_session_id = ?",
        [fyp_session_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        }
      );
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
        schedule = typeof row.schedule_json === 'string'
          ? JSON.parse(row.schedule_json)
          : row.schedule_json;
      } catch (parseErr) {
        console.error(`Failed to parse schedule_json for timetable row:`, parseErr);
      }
    }
    if (row.user_id != null) {
      userSchedules[row.user_id] = schedule;
    }
    if (row.class_id != null) {
      classSchedules[row.class_id] = schedule;
    }
  });

  const isOccupied = (schedule, dateStr, slotStart, slotEnd) => {
    if (!schedule) return false;

    if (schedule.specific_events && Array.isArray(schedule.specific_events)) {
      for (const e of schedule.specific_events) {
        const eDate = e.date || e.target_date;
        if (eDate === dateStr) {
          const eStart = e.start_time || '08:00';
          const eEnd = e.end_time || '09:00';
          if (slotStart < eEnd && slotEnd > eStart) {
            return true;
          }
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
          if (slotStart < slot.end_time && slotEnd > slot.start_time) {
            return true;
          }
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
        const isUserMatch = (userId === mt.student?.user_id || 
                             userId === mt.supervisor?.user_id || 
                             mt.examiners?.some(ex => ex.user_id === userId));
        
        if (isStudentMatch || isUserMatch) {
          if (slotStart < mt.end_time && slotEnd > mt.start_time) {
            return true;
          }
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

      if (allowedDays && Array.isArray(allowedDays) && allowedDays.length > 0) {
        if (!allowedDays.includes(jsDayOfWeek)) {
          continue;
        }
      }

      if (avoidWeekend) {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }
      }

      let dayStart = '08:00';
      let dayEnd = '17:00';
      if (avoidOffWorkingHour) {
        dayStart = workingHourStart || '08:00';
        dayEnd = workingHourEnd || '17:00';
      }

      let currentSlotStart = dayStart;
      while (currentSlotStart < dayEnd) {
        const currentSlotEnd = addMinutes(currentSlotStart, dur);
        if (currentSlotEnd > dayEnd) break;

        if (avoidLunchHour && lunchHourStart && lunchHourEnd) {
          if (currentSlotStart < lunchHourEnd && currentSlotEnd > lunchHourStart) {
            currentSlotStart = addMinutes(currentSlotStart, 5);
            continue;
          }
        }

        let hasConflict = false;

        if (studentClassId && isOccupied(classSchedules[studentClassId], dateStr, currentSlotStart, currentSlotEnd)) {
          hasConflict = true;
        }
        if (!hasConflict && studentUserId && isOccupied(userSchedules[studentUserId], dateStr, currentSlotStart, currentSlotEnd)) {
          hasConflict = true;
        }

        if (!hasConflict && supervisorUserId && isOccupied(userSchedules[supervisorUserId], dateStr, currentSlotStart, currentSlotEnd)) {
          hasConflict = true;
        }

        if (!hasConflict) {
          for (const exId of examinerUserIds) {
            if (isOccupied(userSchedules[exId], dateStr, currentSlotStart, currentSlotEnd)) {
              hasConflict = true;
              break;
            }
          }
        }

        if (!hasConflict) {
          if (isScheduledInRun(studentUserId, studentClassId, dateStr, currentSlotStart, currentSlotEnd)) {
            hasConflict = true;
          }
          if (!hasConflict && isScheduledInRun(supervisorUserId, null, dateStr, currentSlotStart, currentSlotEnd)) {
            hasConflict = true;
          }
          if (!hasConflict) {
            for (const exId of examinerUserIds) {
              if (isScheduledInRun(exId, null, dateStr, currentSlotStart, currentSlotEnd)) {
                hasConflict = true;
                break;
              }
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

    if (!scheduled) {
      unscheduledProjects.push(project);
    }
  }

  try {
    fs.writeFileSync(tempFilePath, JSON.stringify(meetings, null, 4));
    res.json({
      success: true,
      message: "AI scheduling complete",
      data: meetings,
      totalProjects: projects.length,
      unscheduledProjects
    });
  } catch (err) {
    console.error("Failed to save auto-assigned meetings:", err);
    res.status(500).json({ success: false, error: "Failed to write temp meeting file" });
  }
});

module.exports = router;
