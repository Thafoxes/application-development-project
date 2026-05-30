CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SearchNonStudentUsers`(IN p_search_query VARCHAR(255))
BEGIN
    SELECT user_id, email, full_name, is_utm_staff 
    FROM users 
    WHERE (email LIKE p_search_query OR full_name LIKE p_search_query) 
      AND user_id NOT IN (SELECT student_id FROM students) 
    LIMIT 10;
END
