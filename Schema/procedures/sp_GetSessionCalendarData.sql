CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetFYPSessionCalendarData`(IN p_session_id INT)
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
   
END