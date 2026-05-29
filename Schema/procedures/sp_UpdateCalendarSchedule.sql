CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_UpdateCalendarSchedule`(
    IN p_time_table_id INT,
    IN p_owner_identifier VARCHAR(255),
    IN p_schedule_json JSON
)
BEGIN
    -- Updates only the identifier and the JSON payload. 
    -- is_class is intentionally excluded to make it permanent.
    UPDATE time_table 
    SET 
        owner_identifier = p_owner_identifier,
        schedule_json = p_schedule_json
    WHERE 
        time_table_id = p_time_table_id;
        
    -- Return the number of affected rows to confirm success to the backend
    SELECT ROW_COUNT() AS affected_rows;
END