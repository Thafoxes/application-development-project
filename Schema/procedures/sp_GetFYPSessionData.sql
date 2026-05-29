CREATE DEFINER=`root`@`localhost` PROCEDURE `GetFYPSessionData`(IN p_session_id INT)
BEGIN
    -- Result Set 1: Verify the Session Exists
    SELECT fyp_session_id 
    FROM fyp_session 
    WHERE fyp_session_id = p_session_id;

    -- Result Set 2: Get all Timetables (Sections & Staff) for this session
    SELECT 
        time_table_id,
        is_class,
        owner_identifier,
        schedule_json
    FROM time_table 
    WHERE fyp_session_id = p_session_id;

    -- Result Set 3: Get all Projects linked to this session, 
    -- including the Student and Supervisor details via JOINs.
    SELECT 
        p.project_id, 
        p.title, 
        p.status, 
        p.project_type,
        s.student_id, 
        s.metric_number,
        stu_user.full_name AS student_name,
        sv.supervisor_id, 
        sv_user.full_name AS supervisor_name
    FROM projects p
    JOIN students s ON p.student_id = s.student_id
    JOIN users stu_user ON s.student_id = stu_user.user_id
    JOIN supervisor sv ON p.supervisor_id = sv.supervisor_id
    JOIN users sv_user ON sv.supervisor_id = sv_user.user_id
    WHERE p.fyp_session_id = p_session_id;

END