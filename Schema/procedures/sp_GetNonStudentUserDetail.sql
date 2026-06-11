USE `ifamous_dbms`;
DROP PROCEDURE IF EXISTS `sp_GetNonStudentUserDetail`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_GetNonStudentUserDetail`(
    IN p_user_id INT
)
BEGIN
    SELECT 
        u.user_id,
        u.email,
        u.full_name,
        u.phone_number,
        u.date_created,
        u.last_date_login,
        u.is_utm_staff,
        u.affiliation,
        u.co_org_name,
        u.expertise,
        sv.research_expertise,
        sv.sv_capacity,
        sv.current_capacity,
        ex.industry_background,
        IF(c.user_id IS NOT NULL, 1, 0) AS is_coordinator,
        IF(sv.supervisor_id IS NOT NULL, 1, 0) AS is_supervisor,
        IF(ex.examiners_id IS NOT NULL, 1, 0) AS is_examiner
    FROM users u
    LEFT JOIN coordinator c ON u.user_id = c.user_id
    LEFT JOIN supervisor sv ON u.user_id = sv.supervisor_id
    LEFT JOIN examiners ex ON u.user_id = ex.examiners_id
    WHERE u.user_id = p_user_id;
END ;;
DELIMITER ;
