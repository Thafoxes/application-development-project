USE `ifamous_dbms`;
DROP PROCEDURE IF EXISTS `sp_GetStudentFYPDetail`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetStudentFYPDetail`(
    IN p_student_id INT
)
BEGIN
    SELECT 
        u.user_id,
        u.email,
        u.full_name,
        u.phone_number,
        u.date_created,
        u.last_date_login,
        s.metric_number,
        s.class_id,
        c.section_name,
        s.CGPA,
        s.GPA,
        s.credit_hours_completed,
        s.proof_of_credit_hours,
        p.project_id,
        p.title AS project_title,
        p.description AS project_description,
        p.status AS project_status,
        p.github_link AS project_github,
        p.drive_link AS project_drive,
        p.fyp_session_id AS project_fyp_session_id,
        p.supervisor_id AS project_supervisor_id,
        su.full_name AS supervisor_name
    FROM users u
    JOIN students s ON u.user_id = s.student_id
    LEFT JOIN fyp_classes c ON s.class_id = c.class_id
    LEFT JOIN projects p ON s.student_id = p.student_id
    LEFT JOIN users su ON p.supervisor_id = su.user_id
    WHERE u.user_id = p_student_id;
END ;;
DELIMITER ;
