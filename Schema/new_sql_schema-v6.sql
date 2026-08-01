-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: ifamous-mysql-ifamous-systems.d.aivencloud.com    Database: ifamous_dbms
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3953f5c9-66ef-11f1-a70a-7e6fb57feb56:1-53,
67ec1c37-7070-11f1-84e7-f6115bdb35bc:1-22,
a71b3070-6549-11f1-a2d9-e2517cafa8d8:1-245,
cea11850-661c-11f1-a867-766935ee8c90:1-150,
d0b2d541-8a8b-11f1-97a3-86ba95f98055:1-269';

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (4024,'2026-06-12 17:59:43');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coordinator`
--

DROP TABLE IF EXISTS `coordinator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coordinator` (
  `user_id` int NOT NULL,
  KEY `user_id` (`user_id`),
  CONSTRAINT `coordinator_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coordinator`
--

LOCK TABLES `coordinator` WRITE;
/*!40000 ALTER TABLE `coordinator` DISABLE KEYS */;
INSERT INTO `coordinator` VALUES (2);
/*!40000 ALTER TABLE `coordinator` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examine`
--

DROP TABLE IF EXISTS `examine`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examine` (
  `examiners_id` int NOT NULL,
  `project_id` int NOT NULL,
  KEY `examiners_id` (`examiners_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `examine_ibfk_1` FOREIGN KEY (`examiners_id`) REFERENCES `examiners` (`examiners_id`),
  CONSTRAINT `examine_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examine`
--

LOCK TABLES `examine` WRITE;
/*!40000 ALTER TABLE `examine` DISABLE KEYS */;
/*!40000 ALTER TABLE `examine` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examiners`
--

DROP TABLE IF EXISTS `examiners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examiners` (
  `industry_background` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `examiners_id` int NOT NULL,
  PRIMARY KEY (`examiners_id`),
  CONSTRAINT `examiners_ibfk_1` FOREIGN KEY (`examiners_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examiners`
--

LOCK TABLES `examiners` WRITE;
/*!40000 ALTER TABLE `examiners` DISABLE KEYS */;
INSERT INTO `examiners` VALUES ('coordinator',2),('Academic examiner',4017),('software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',4022),('Administrator',4024),('FC',4027),('mjiit',4029);
/*!40000 ALTER TABLE `examiners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_action_items`
--

DROP TABLE IF EXISTS `fyp_action_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_action_items` (
  `action_item_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `logbook_id` int DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `assigned_to_user_id` int NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('Pending','In Progress','Completed','Overdue','Cancelled') NOT NULL DEFAULT 'Pending',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`action_item_id`),
  KEY `idx_action_project` (`project_id`,`due_date`),
  KEY `fk_action_logbook` (`logbook_id`),
  KEY `fk_action_assignee` (`assigned_to_user_id`),
  KEY `fk_action_creator` (`created_by`),
  CONSTRAINT `fk_action_assignee` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_action_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_action_logbook` FOREIGN KEY (`logbook_id`) REFERENCES `fyp_logbooks` (`logbook_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_action_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_action_items`
--

LOCK TABLES `fyp_action_items` WRITE;
/*!40000 ALTER TABLE `fyp_action_items` DISABLE KEYS */;
INSERT INTO `fyp_action_items` VALUES (1,15,1,'Submit final examination package',4025,'2026-07-30','Completed',4025,'2026-07-30 17:44:51','2026-07-30 17:44:51'),(2,17,2,'Submit final examination package',4028,'2026-07-31','Completed',4028,'2026-07-31 07:00:22','2026-07-31 07:00:22');
/*!40000 ALTER TABLE `fyp_action_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_assessment_settings`
--

DROP TABLE IF EXISTS `fyp_assessment_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_assessment_settings` (
  `setting_id` int NOT NULL DEFAULT '1',
  `supervisor_weight` decimal(5,2) DEFAULT NULL,
  `examiner_weight` decimal(5,2) DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  KEY `fk_assessment_setting_user` (`updated_by`),
  CONSTRAINT `fk_assessment_setting_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_assessment_settings`
--

LOCK TABLES `fyp_assessment_settings` WRITE;
/*!40000 ALTER TABLE `fyp_assessment_settings` DISABLE KEYS */;
INSERT INTO `fyp_assessment_settings` VALUES (1,50.00,50.00,2,'2026-07-30 17:53:26');
/*!40000 ALTER TABLE `fyp_assessment_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_classes`
--

DROP TABLE IF EXISTS `fyp_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_classes` (
  `class_id` int NOT NULL AUTO_INCREMENT,
  `fyp_session_id` int NOT NULL,
  `section_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`class_id`),
  UNIQUE KEY `unique_session_class` (`fyp_session_id`,`section_name`),
  CONSTRAINT `fk_class_session` FOREIGN KEY (`fyp_session_id`) REFERENCES `fyp_session` (`fyp_session_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_classes`
--

LOCK TABLES `fyp_classes` WRITE;
/*!40000 ALTER TABLE `fyp_classes` DISABLE KEYS */;
INSERT INTO `fyp_classes` VALUES (5,25261,'10 (Year 3)'),(4,25261,'10 (Year 4)'),(6,25261,'11 (Year 2)'),(1,25262,'15 (Year 2)'),(2,25262,'15 (Year 3)'),(3,25262,'15 (Year 4)'),(7,25262,'2 SCSEH SEC 15 (MARCH 2025 INTAKE)');
/*!40000 ALTER TABLE `fyp_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_evaluation_scores`
--

DROP TABLE IF EXISTS `fyp_evaluation_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_evaluation_scores` (
  `score_id` int NOT NULL AUTO_INCREMENT,
  `evaluation_id` int NOT NULL,
  `rubric_item_id` int NOT NULL,
  `score` decimal(6,2) NOT NULL,
  `comment` text,
  PRIMARY KEY (`score_id`),
  UNIQUE KEY `uq_evaluation_rubric` (`evaluation_id`,`rubric_item_id`),
  KEY `fk_score_rubric` (`rubric_item_id`),
  CONSTRAINT `fk_score_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `fyp_evaluations` (`evaluation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_score_rubric` FOREIGN KEY (`rubric_item_id`) REFERENCES `fyp_rubric_items` (`rubric_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_evaluation_scores`
--

LOCK TABLES `fyp_evaluation_scores` WRITE;
/*!40000 ALTER TABLE `fyp_evaluation_scores` DISABLE KEYS */;
INSERT INTO `fyp_evaluation_scores` VALUES (1,1,1,29.00,NULL),(2,1,2,19.00,NULL),(3,1,3,19.00,NULL),(4,1,4,19.00,NULL),(5,1,5,9.00,NULL);
/*!40000 ALTER TABLE `fyp_evaluation_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_evaluations`
--

DROP TABLE IF EXISTS `fyp_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_evaluations` (
  `evaluation_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `examiner_user_id` int NOT NULL,
  `strengths` text,
  `improvements` text,
  `recommendations` text,
  `overall_comments` text,
  `total_score` decimal(8,2) NOT NULL DEFAULT '0.00',
  `percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('Draft','Submitted') NOT NULL DEFAULT 'Draft',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`evaluation_id`),
  UNIQUE KEY `uq_evaluation_project_examiner` (`project_id`,`examiner_user_id`),
  KEY `fk_evaluation_examiner` (`examiner_user_id`),
  CONSTRAINT `fk_evaluation_examiner` FOREIGN KEY (`examiner_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_evaluation_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_evaluations`
--

LOCK TABLES `fyp_evaluations` WRITE;
/*!40000 ALTER TABLE `fyp_evaluations` DISABLE KEYS */;
INSERT INTO `fyp_evaluations` VALUES (1,15,4022,'gsgs','sgdgds','gdgsd','gsgds',95.00,95.00,'Submitted','2026-07-31 01:47:35','2026-07-30 17:47:34','2026-07-30 17:47:34');
/*!40000 ALTER TABLE `fyp_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_examiner_assignments`
--

DROP TABLE IF EXISTS `fyp_examiner_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_examiner_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `examiner_user_id` int NOT NULL,
  `assigned_by` int NOT NULL,
  `status` enum('Assigned','Reassigned','Removed') NOT NULL DEFAULT 'Assigned',
  `match_score` decimal(5,2) DEFAULT NULL,
  `assignment_reason` varchar(500) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unassigned_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_examiner_assignment_project` (`project_id`,`status`),
  KEY `idx_examiner_assignment_examiner` (`examiner_user_id`,`status`),
  KEY `fk_examiner_assignment_assigner` (`assigned_by`),
  CONSTRAINT `fk_examiner_assignment_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_examiner_assignment_examiner` FOREIGN KEY (`examiner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_examiner_assignment_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_examiner_assignments`
--

LOCK TABLES `fyp_examiner_assignments` WRITE;
/*!40000 ALTER TABLE `fyp_examiner_assignments` DISABLE KEYS */;
INSERT INTO `fyp_examiner_assignments` VALUES (1,15,4022,2,'Assigned',75.00,'Expertise, workload and availability considered','2026-07-30 17:46:15',NULL,'2026-07-30 17:47:34');
/*!40000 ALTER TABLE `fyp_examiner_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_feedback`
--

DROP TABLE IF EXISTS `fyp_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `submission_id` int DEFAULT NULL,
  `author_user_id` int NOT NULL,
  `author_role` enum('Supervisor','Examiner','Coordinator') NOT NULL,
  `comment` text NOT NULL,
  `attachment_path` varchar(500) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_mime` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  KEY `idx_feedback_project` (`project_id`,`created_at`),
  KEY `fk_feedback_submission` (`submission_id`),
  KEY `fk_feedback_author` (`author_user_id`),
  CONSTRAINT `fk_feedback_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_feedback_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_submission` FOREIGN KEY (`submission_id`) REFERENCES `projects_submissions` (`submission_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_feedback`
--

LOCK TABLES `fyp_feedback` WRITE;
/*!40000 ALTER TABLE `fyp_feedback` DISABLE KEYS */;
INSERT INTO `fyp_feedback` VALUES (1,15,10,4017,'Supervisor','Correction attachment provided by supervisor.','uploads/journey/15-1785433394359-proposal_ai_matching_wong__1_.docx','proposal_ai_matching_wong (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','2026-07-30 17:43:14'),(2,16,13,4022,'Supervisor','please correct this','uploads/journey/16-1785465549166-proposal_database_lim__1_.pdf','proposal_database_lim (1).pdf','application/pdf','2026-07-31 02:39:09'),(3,17,NULL,4022,'Examiner','test email','uploads/journey/17-1785481290851-proposal_database_lim__1___1_.pdf','proposal_database_lim (1) (1).pdf','application/pdf','2026-07-31 07:01:30'),(4,17,NULL,4022,'Examiner','test email','uploads/journey/17-1785481292348-proposal_database_lim__1___1_.pdf','proposal_database_lim (1) (1).pdf','application/pdf','2026-07-31 07:01:32'),(5,17,NULL,4022,'Examiner','hehehe','uploads/journey/17-1785488394377-proposal_ai_matching_wong__2_.docx','proposal_ai_matching_wong (2).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','2026-07-31 08:59:54'),(6,18,18,4022,'Supervisor','fuck you','uploads/journey/18-1785488815093-proposal_database_lim__1___1_.pdf','proposal_database_lim (1) (1).pdf','application/pdf','2026-07-31 09:06:55');
/*!40000 ALTER TABLE `fyp_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_logbooks`
--

DROP TABLE IF EXISTS `fyp_logbooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_logbooks` (
  `logbook_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `student_user_id` int NOT NULL,
  `meeting_date` datetime NOT NULL,
  `meeting_type` varchar(50) NOT NULL DEFAULT 'Physical',
  `topics_discussed` text NOT NULL,
  `progress_summary` text,
  `problems_identified` text,
  `supervisor_advice` text,
  `next_meeting_date` datetime DEFAULT NULL,
  `status` enum('Pending','Approved','Request Edit') NOT NULL DEFAULT 'Pending',
  `supervisor_comment` text,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`logbook_id`),
  KEY `idx_logbook_project` (`project_id`,`meeting_date`),
  KEY `fk_logbook_student` (`student_user_id`),
  KEY `fk_logbook_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_logbook_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_logbook_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_logbook_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_logbooks`
--

LOCK TABLES `fyp_logbooks` WRITE;
/*!40000 ALTER TABLE `fyp_logbooks` DISABLE KEYS */;
INSERT INTO `fyp_logbooks` VALUES (1,15,4025,'2026-07-30 17:44:51','Google Meet','Final progress review, testing results and examination readiness.','All planned development milestones and final deliverables were completed.','No critical blocker. Minor formatting improvements remain.','Prepare the final package and demonstrate the completed system.','2026-08-06 17:44:51','Approved','Demo logbook approved for workflow testing.',4017,'2026-07-30 17:44:51','2026-07-30 17:44:51','2026-07-30 17:44:51'),(2,17,4028,'2026-07-31 07:00:22','Google Meet','Final progress review, testing results and examination readiness.','All planned development milestones and final deliverables were completed.','No critical blocker. Minor formatting improvements remain.','Prepare the final package and demonstrate the completed system.','2026-08-07 07:00:22','Approved','Demo logbook approved for workflow testing.',4022,'2026-07-31 07:00:22','2026-07-31 07:00:22','2026-07-31 07:00:22');
/*!40000 ALTER TABLE `fyp_logbooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_milestones`
--

DROP TABLE IF EXISTS `fyp_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_milestones` (
  `milestone_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` date NOT NULL,
  `status` enum('Not Started','In Progress','Submitted','Revision Required','Completed','Overdue') NOT NULL DEFAULT 'Not Started',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`milestone_id`),
  KEY `idx_milestone_project` (`project_id`,`due_date`),
  KEY `fk_milestone_creator` (`created_by`),
  CONSTRAINT `fk_milestone_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_milestone_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_milestones`
--

LOCK TABLES `fyp_milestones` WRITE;
/*!40000 ALTER TABLE `fyp_milestones` DISABLE KEYS */;
INSERT INTO `fyp_milestones` VALUES (1,15,'Requirements and Design','Complete project requirements and system design.','2026-07-09','Completed',4025,'2026-07-30 17:44:51','2026-07-30 17:44:51'),(2,15,'Prototype Development','Implement and demonstrate the core prototype.','2026-07-23','Completed',4025,'2026-07-30 17:44:51','2026-07-30 17:44:51'),(3,15,'Testing and Final Report','Complete testing evidence and final report.','2026-07-30','Completed',4025,'2026-07-30 17:44:51','2026-07-30 17:44:51'),(4,17,'Requirements and Design','Complete project requirements and system design.','2026-07-10','Completed',4028,'2026-07-31 07:00:22','2026-07-31 07:00:22'),(5,17,'Prototype Development','Implement and demonstrate the core prototype.','2026-07-24','Completed',4028,'2026-07-31 07:00:22','2026-07-31 07:00:22'),(6,17,'Testing and Final Report','Complete testing evidence and final report.','2026-07-31','Completed',4028,'2026-07-31 07:00:22','2026-07-31 07:00:22');
/*!40000 ALTER TABLE `fyp_milestones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_notifications`
--

DROP TABLE IF EXISTS `fyp_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `recipient_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recipient_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recipient_email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email_requested` tinyint(1) NOT NULL DEFAULT '0',
  `email_status` varchar(30) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Not Requested',
  `email_sent_at` datetime DEFAULT NULL,
  `email_error` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `action_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fyp_notifications_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_notifications`
--

LOCK TABLES `fyp_notifications` WRITE;
/*!40000 ALTER TABLE `fyp_notifications` DISABLE KEYS */;
INSERT INTO `fyp_notifications` VALUES (1,1,'Supervisor','Dr. David Kumar','david.kumar@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',1,'2026-06-11 15:09:53',0,'Not Requested',NULL,NULL,NULL),(2,1,'Student','Ahmad Daniel Tamingsari Bin Ramlan','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Dr. David Kumar.',0,'2026-06-11 15:09:53',0,'Not Requested',NULL,NULL,NULL),(3,1,'Student','Ahmad Fadzril Bin Ahmad Badril','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Dr. David Kumar.',0,'2026-06-11 15:09:53',0,'Not Requested',NULL,NULL,NULL),(4,2,'Supervisor','coordinator','Coordinator@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',0,'2026-06-11 15:23:39',0,'Not Requested',NULL,NULL,NULL),(5,2,'Student','Shaiikh Amir Husaini Bin Sh.Mohd Saifuddeen','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to coordinator.',0,'2026-06-11 15:23:39',0,'Not Requested',NULL,NULL,NULL),(6,2,'Student','Ahmad Fadzril Bin Ahmad Badril','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to coordinator.',0,'2026-06-11 15:23:39',0,'Not Requested',NULL,NULL,NULL),(7,2,'Student','Ahmad Daniel Tamingsari Bin Ramlan','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to coordinator.',0,'2026-06-11 15:23:40',0,'Not Requested',NULL,NULL,NULL),(8,2,'Student','Adlan Hazim Bin Abdul Rahman','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to coordinator.',0,'2026-06-11 15:23:40',0,'Not Requested',NULL,NULL,NULL),(9,3,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',1,'2026-06-11 16:50:16',0,'Not Requested',NULL,NULL,NULL),(10,3,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',1,'2026-06-11 16:50:16',0,'Not Requested',NULL,NULL,NULL),(11,3,'Student','Shaiikh Amir Husaini Bin Sh.Mohd Saifuddeen','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Daniel Ramlan.',0,'2026-06-11 16:50:16',0,'Not Requested',NULL,NULL,NULL),(12,3,'Student','Ahmad Fadzril Bin Ahmad Badril','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Daniel Ramlan.',0,'2026-06-11 16:50:16',0,'Not Requested',NULL,NULL,NULL),(13,3,'Student','Ahmad Daniel Tamingsari Bin Ramlan','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Daniel Ramlan.',0,'2026-06-11 16:50:16',0,'Not Requested',NULL,NULL,NULL),(14,3,'Student','Adlan Hazim Bin Abdul Rahman','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Daniel Ramlan.',0,'2026-06-11 16:50:16',0,'Not Requested',NULL,NULL,NULL),(15,4,'Supervisor','Dr. Lim Wei Jie','lim.wei@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Database-Driven Academic Information and Automation System\".',0,'2026-06-11 17:40:56',0,'Not Requested',NULL,NULL,NULL),(16,4,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Dr. Lim Wei Jie as supervisor for the project \"Database-Driven Academic Information and Automation System\".',1,'2026-06-11 17:40:56',0,'Not Requested',NULL,NULL,NULL),(17,4,'Student','Lim Wei Jie','','FYP Supervisor Assigned','Your project \"Database-Driven Academic Information and Automation System\" has been assigned to Dr. Lim Wei Jie.',0,'2026-06-11 17:40:57',0,'Not Requested',NULL,NULL,NULL),(21,8,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',1,'2026-06-12 19:35:11',0,'Not Requested',NULL,NULL,NULL),(22,8,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',1,'2026-06-12 19:35:11',0,'Not Requested',NULL,NULL,NULL),(23,8,'Student','daniel','','FYP Supervisor Assigned','Your project \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been assigned to Daniel Ramlan.',0,'2026-06-12 19:35:11',0,'Not Requested',NULL,NULL,NULL),(56,8,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Rejected\" for project \"Software Engineering Smart Academic Advisor (AA) Audit System\".',1,'2026-06-13 03:55:43',0,'Not Requested',NULL,NULL,NULL),(57,8,'Student','Student','','FYP Proposal Rejected','Your FYP proposal \"Software Engineering Smart Academic Advisor (AA) Audit System\" has been rejected. Supervisor feedback: No feedback provided.',0,'2026-06-13 03:55:43',0,'Not Requested',NULL,NULL,NULL),(58,10,'Coordinator','Coordinator','','New FYP Proposal Submitted','daniel submitted a new FYP proposal titled \"Private Member Portal for a Fitness Club\". Please review and run supervisor matching.',1,'2026-06-15 01:17:10',0,'Not Requested',NULL,NULL,NULL),(59,10,'Supervisor','Dr. David Kumar','david.k@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Private Member Portal for a Fitness Club\".',0,'2026-06-15 01:44:20',0,'Not Requested',NULL,NULL,NULL),(60,10,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Dr. David Kumar as supervisor for the project \"Private Member Portal for a Fitness Club\".',1,'2026-06-15 01:44:21',0,'Not Requested',NULL,NULL,NULL),(61,10,'Student','daniel','daniel@graduate.utm.my','FYP Supervisor Assigned','Your project \"Private Member Portal for a Fitness Club\" has been assigned to Dr. David Kumar.',0,'2026-06-15 01:44:21',0,'Not Requested',NULL,NULL,NULL),(62,10,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Private Member Portal for a Fitness Club\".',1,'2026-06-15 02:05:08',0,'Not Requested',NULL,NULL,NULL),(63,10,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Private Member Portal for a Fitness Club\".',0,'2026-06-15 02:05:09',0,'Not Requested',NULL,NULL,NULL),(64,10,'Student','daniel','daniel@graduate.utm.my','FYP Supervisor Assigned','Your project \"Private Member Portal for a Fitness Club\" has been assigned to Daniel Ramlan.',0,'2026-06-15 02:05:09',0,'Not Requested',NULL,NULL,NULL),(65,10,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Rejected\" for project \"Private Member Portal for a Fitness Club\".',1,'2026-06-15 02:06:39',0,'Not Requested',NULL,NULL,NULL),(66,10,'Student','daniel','daniel@graduate.utm.my','FYP Proposal Rejected','Your FYP proposal \"Private Member Portal for a Fitness Club\" has been rejected. Supervisor feedback: No feedback provided.',1,'2026-06-15 02:06:39',0,'Not Requested',NULL,NULL,NULL),(68,12,'Coordinator','Coordinator','','New FYP Proposal Submitted','daniel submitted a new FYP proposal titled \"Intelligent FYP Assessment Management and Outcome System\". Please review and run supervisor matching.',1,'2026-07-29 13:51:04',0,'Not Requested',NULL,NULL,NULL),(69,12,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Intelligent FYP Assessment Management and Outcome System\".',1,'2026-07-29 13:59:26',0,'Not Requested',NULL,NULL,NULL),(70,12,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-29 13:59:26',0,'Not Requested',NULL,NULL,NULL),(71,12,'Student','daniel','daniel@graduate.utm.my','FYP Supervisor Assigned','Your project \"Intelligent FYP Assessment Management and Outcome System\" has been assigned to Daniel Ramlan.',0,'2026-07-29 13:59:27',0,'Not Requested',NULL,NULL,NULL),(72,12,'Student','daniel','daniel@graduate.utm.my','FYP Proposal Approved','Your FYP proposal \"Intelligent FYP Assessment Management and Outcome System\" has been approved by your supervisor.',1,'2026-07-29 14:06:34',0,'Not Requested',NULL,NULL,NULL),(73,12,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Active\" for project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-29 14:06:34',0,'Not Requested',NULL,NULL,NULL),(74,13,'Coordinator','Coordinator','','New FYP Proposal Submitted','test submitted a new FYP proposal titled \"Intelligent FYP Assessment Management and Outcome System\". Please review and run supervisor matching.',0,'2026-07-30 15:40:40',0,'Not Requested',NULL,NULL,NULL),(75,13,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:12:52',0,'Not Requested',NULL,NULL,NULL),(76,13,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:12:52',0,'Not Requested',NULL,NULL,NULL),(77,13,'Student','test','test@graduate.utm.my','FYP Supervisor Assigned','Your project \"Intelligent FYP Assessment Management and Outcome System\" has been assigned to Daniel Ramlan.',0,'2026-07-30 17:12:52',0,'Not Requested',NULL,NULL,NULL),(78,13,'Student','test','test@graduate.utm.my','FYP Proposal Rejected','Your FYP proposal \"Intelligent FYP Assessment Management and Outcome System\" has been rejected. No feedback provided.',0,'2026-07-30 17:13:24',0,'Not Requested',NULL,NULL,NULL),(79,13,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Rejected\" for project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:13:24',0,'Not Requested',NULL,NULL,NULL),(80,15,'Coordinator','Coordinator','','New FYP Proposal Submitted','test submitted a new FYP proposal titled \"Intelligent FYP Assessment Management and Outcome System\". Please review and run supervisor matching.',1,'2026-07-30 17:16:30',0,'Not Requested',NULL,NULL,NULL),(81,15,'Supervisor','Ts. Dr. Wong Mei Ling','wong.mei@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:41:43',0,'Not Requested',NULL,NULL,NULL),(82,15,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Ts. Dr. Wong Mei Ling as supervisor for the project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:41:43',0,'Not Requested',NULL,NULL,NULL),(83,15,'Student','test','test@graduate.utm.my','FYP Supervisor Assigned','Your project \"Intelligent FYP Assessment Management and Outcome System\" has been assigned to Ts. Dr. Wong Mei Ling.',0,'2026-07-30 17:41:43',0,'Not Requested',NULL,NULL,NULL),(84,15,'Student','test','test@graduate.utm.my','FYP Proposal Requires Revision','Your FYP proposal \"Intelligent FYP Assessment Management and Outcome System\" requires revision. Please review the supervisor feedback and correction attachment.',1,'2026-07-30 17:43:14',0,'Not Requested',NULL,NULL,NULL),(85,15,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Revision Required\" for project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:43:14',0,'Not Requested',NULL,NULL,NULL),(86,15,'Student','test','test@graduate.utm.my','FYP Proposal Approved','Your FYP proposal \"Intelligent FYP Assessment Management and Outcome System\" has been approved. You may begin the FYP development journey.',1,'2026-07-30 17:44:34',0,'Not Requested',NULL,NULL,NULL),(87,15,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Active\" for project \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:44:34',0,'Not Requested',NULL,NULL,NULL),(88,15,'Supervisor','Ts. Dr. Wong Mei Ling','wong.mei@utm.my','Demo Final Deliverables Submitted','test filled the demo journey and submitted a test final package for Intelligent FYP Assessment Management and Outcome System.',0,'2026-07-30 17:44:51',0,'Not Requested',NULL,NULL,NULL),(89,15,'Student','test','test@graduate.utm.my','Approved for Examination','Your final submission for Intelligent FYP Assessment Management and Outcome System was approved for examination.',0,'2026-07-30 17:45:43',0,'Not Requested',NULL,NULL,NULL),(90,15,'Coordinator','coordinator','Coordinator@utm.my','Examiner Assignment Required','Intelligent FYP Assessment Management and Outcome System is ready for examiner assignment.',0,'2026-07-30 17:45:43',0,'Not Requested',NULL,NULL,NULL),(91,15,'Examiner','Daniel Ramlan','danielramlann@utm.my','FYP Examination Assigned','You have been assigned to examine \"Intelligent FYP Assessment Management and Outcome System\".',0,'2026-07-30 17:46:15',0,'Not Requested',NULL,NULL,NULL),(92,15,'Coordinator','coordinator','Coordinator@utm.my','Examiner Evaluation Submitted','The examiner completed grading for Intelligent FYP Assessment Management and Outcome System.',0,'2026-07-30 17:47:34',0,'Not Requested',NULL,NULL,NULL),(93,15,'Coordinator','coordinator','Coordinator@utm.my','Supervisor Assessment Submitted','The supervisor completed assessment for Intelligent FYP Assessment Management and Outcome System.',0,'2026-07-30 17:55:01',0,'Not Requested',NULL,NULL,NULL),(94,15,'Student','test','test@graduate.utm.my','FYP Result Released','Your result for Intelligent FYP Assessment Management and Outcome System has been released.',1,'2026-07-30 17:55:16',0,'Not Requested',NULL,NULL,NULL),(95,16,'Coordinator','Coordinator','','New FYP Proposal Submitted','test submitted a new FYP proposal titled \"Database-Driven Academic Information and Automation System\" with 3 supervisor nomination(s). Please review the preferences and run supervisor matching if needed.',0,'2026-07-31 02:31:35',0,'Not Requested',NULL,NULL,NULL),(96,16,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 02:34:07',0,'Not Requested',NULL,NULL,NULL),(97,16,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 02:34:07',0,'Not Requested',NULL,NULL,NULL),(98,16,'Student','test','test@graduate.utm.my','FYP Supervisor Assigned','Your project \"Database-Driven Academic Information and Automation System\" has been assigned to Daniel Ramlan.',0,'2026-07-31 02:34:07',0,'Not Requested',NULL,NULL,NULL),(99,16,'Student','test','test@graduate.utm.my','FYP Proposal Requires Revision','Your FYP proposal \"Database-Driven Academic Information and Automation System\" requires revision. please correct this',0,'2026-07-31 02:39:09',0,'Not Requested',NULL,NULL,NULL),(100,16,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Revision Required\" for project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 02:39:09',0,'Not Requested',NULL,NULL,NULL),(101,16,'Supervisor','Daniel Ramlan','danielramlann@utm.my','Revised FYP Proposal Submitted','test submitted proposal version 2 for \"Database-Driven Academic Information and Automation System\". Please review the revised proposal.',0,'2026-07-31 03:19:38',0,'Not Requested',NULL,NULL,NULL),(102,16,'Student','test','test@graduate.utm.my','FYP Proposal Approved','Your FYP proposal \"Database-Driven Academic Information and Automation System\" has been approved. You may begin the FYP development journey.',1,'2026-07-31 03:20:58',0,'Not Requested',NULL,NULL,NULL),(103,16,'Coordinator','Coordinator','','Supervisor Decision Submitted','Supervisor submitted decision \"Active\" for project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 03:20:58',0,'Not Requested',NULL,NULL,NULL),(104,17,'Coordinator','Coordinator','','New FYP Proposal Submitted','Daniel Encem submitted a new FYP proposal titled \"Database-Driven Academic Information and Automation System\" with 3 supervisor nomination(s). Please review the preferences and run supervisor matching if needed.',0,'2026-07-31 03:23:12',0,'Not Requested',NULL,NULL,NULL),(105,17,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 03:23:42',0,'Not Requested',NULL,NULL,NULL),(106,17,'Coordinator','Coordinator','','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 03:23:42',0,'Not Requested',NULL,NULL,NULL),(107,17,'Student','Daniel Encem','daniel-02@graduate.utm.my','FYP Supervisor Assigned','Your project \"Database-Driven Academic Information and Automation System\" has been assigned to Daniel Ramlan.',0,'2026-07-31 03:23:42',0,'Not Requested',NULL,NULL,NULL),(108,17,'Student','Daniel Encem','daniel-02@graduate.utm.my','FYP Proposal Approved','Your FYP proposal \"Database-Driven Academic Information and Automation System\" has been approved. You may begin the FYP development journey.',1,'2026-07-31 04:48:19',1,'Sent','2026-07-31 04:48:23',NULL,'http://localhost:5173/student-project-details?projectId=17&tab=decision'),(109,17,'Coordinator','coordinator','Coordinator@utm.my','Supervisor Decision Submitted','Supervisor submitted decision \"Active\" for project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 04:48:19',1,'Sent','2026-07-31 04:48:23',NULL,'http://localhost:5173/coordinator-project-details?projectId=17'),(110,17,'Supervisor','Daniel Ramlan','danielramlann@utm.my','Demo Final Deliverables Submitted','Daniel Encem filled the demo journey and submitted a test final package for Database-Driven Academic Information and Automation System.',1,'2026-07-31 07:00:22',1,'Sent','2026-07-31 07:00:27',NULL,'http://localhost:5173/project-journey?projectId=17'),(111,17,'Student','Daniel Encem','daniel-02@graduate.utm.my','Examiner Feedback Added','New feedback was added to Database-Driven Academic Information and Automation System.',0,'2026-07-31 07:01:30',1,'Sent','2026-07-31 07:01:32',NULL,'http://localhost:5173/student-project-details?projectId=17'),(112,17,'Student','Daniel Encem','daniel-02@graduate.utm.my','Examiner Feedback Added','New feedback was added to Database-Driven Academic Information and Automation System.',0,'2026-07-31 07:01:32',1,'Sent','2026-07-31 07:01:36',NULL,'http://localhost:5173/student-project-details?projectId=17'),(113,17,'Student','Daniel Encem','daniel-02@graduate.utm.my','Examiner Feedback Added','New feedback was added to Database-Driven Academic Information and Automation System.',0,'2026-07-31 08:59:54',1,'Accepted','2026-07-31 08:59:58',NULL,'http://localhost:5173/student-project-details?projectId=17'),(114,18,'Coordinator','Coordinator','','New FYP Proposal Submitted','Daniello submitted a new FYP proposal titled \"Database-Driven Academic Information and Automation System\" with 3 supervisor nomination(s). Please review the preferences and run supervisor matching if needed.',1,'2026-07-31 09:05:19',0,'Not Requested',NULL,NULL,NULL),(115,18,'Supervisor','Daniel Ramlan','danielramlann@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 09:06:04',1,'Accepted','2026-07-31 09:06:06',NULL,'http://localhost:5173/supervisor-review?projectId=18'),(116,18,'Student','Daniello','danielramlann@gmail.com','FYP Supervisor Assigned','Your project \"Database-Driven Academic Information and Automation System\" has been assigned to Daniel Ramlan.',0,'2026-07-31 09:06:04',1,'Accepted','2026-07-31 09:06:08',NULL,'http://localhost:5173/student-project-details?projectId=18'),(117,18,'Coordinator','coordinator','Coordinator@utm.my','Supervisor Assignment Completed','You assigned Daniel Ramlan as supervisor for the project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 09:06:04',1,'Accepted','2026-07-31 09:06:08',NULL,'http://localhost:5173/coordinator-project-details?projectId=18'),(118,18,'Student','Daniello','danielramlann@gmail.com','FYP Proposal Requires Revision','Your FYP proposal \"Database-Driven Academic Information and Automation System\" requires revision. fuck you',1,'2026-07-31 09:06:55',1,'Accepted','2026-07-31 09:06:57',NULL,'http://localhost:5173/student-project-details?projectId=18&tab=revision'),(119,18,'Coordinator','coordinator','Coordinator@utm.my','Supervisor Decision Submitted','Supervisor submitted decision \"Revision Required\" for project \"Database-Driven Academic Information and Automation System\".',0,'2026-07-31 09:06:55',1,'Accepted','2026-07-31 09:06:57',NULL,'http://localhost:5173/coordinator-project-details?projectId=18'),(121,20,'Coordinator','Coordinator','','New FYP Proposal Submitted','Jason Wong submitted a new FYP proposal titled \"Testing IOT on Chiller Room\" with 2 supervisor nomination(s). Please review the preferences and run supervisor matching if needed.',1,'2026-08-01 02:02:23',0,'Not Requested',NULL,NULL,NULL),(122,20,'Supervisor','normalstaff@utm.my','normalstaff@utm.my','New FYP Supervision Assignment','You have been assigned to supervise the project \"Testing IOT on Chiller Room\".',0,'2026-08-01 02:02:57',1,'Not Configured',NULL,'SMTP is not configured. Set SMTP_URL or SMTP_HOST, SMTP_USER and SMTP_PASS.','http://localhost:5173/supervisor-review?projectId=20'),(123,20,'Student','Jason Wong','jason@graduate.utm.my','FYP Supervisor Assigned','Your project \"Testing IOT on Chiller Room\" has been assigned to normalstaff@utm.my.',0,'2026-08-01 02:02:57',1,'Not Configured',NULL,'SMTP is not configured. Set SMTP_URL or SMTP_HOST, SMTP_USER and SMTP_PASS.','http://localhost:5173/student-project-details?projectId=20'),(124,20,'Coordinator','coordinator','Coordinator@utm.my','Supervisor Assignment Completed','You assigned normalstaff@utm.my as supervisor for the project \"Testing IOT on Chiller Room\".',0,'2026-08-01 02:02:57',1,'Not Configured',NULL,'SMTP is not configured. Set SMTP_URL or SMTP_HOST, SMTP_USER and SMTP_PASS.','http://localhost:5173/coordinator-project-details?projectId=20');
/*!40000 ALTER TABLE `fyp_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_progress_updates`
--

DROP TABLE IF EXISTS `fyp_progress_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_progress_updates` (
  `progress_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `work_completed` text NOT NULL,
  `next_work` text NOT NULL,
  `blockers` text,
  `evidence_url` varchar(500) DEFAULT NULL,
  `progress_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`progress_id`),
  KEY `idx_progress_project` (`project_id`,`created_at`),
  KEY `fk_progress_user` (`user_id`),
  CONSTRAINT `fk_progress_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_progress_updates`
--

LOCK TABLES `fyp_progress_updates` WRITE;
/*!40000 ALTER TABLE `fyp_progress_updates` DISABLE KEYS */;
INSERT INTO `fyp_progress_updates` VALUES (1,15,4025,'Completed requirements, implementation, integration testing and final report preparation.','Submit the final package for supervisor examination-readiness approval.',NULL,'https://github.com/demo/ifamous-project-15/commits/main',100.00,'2026-07-30 17:44:51'),(2,17,4028,'Completed requirements, implementation, integration testing and final report preparation.','Submit the final package for supervisor examination-readiness approval.',NULL,'https://github.com/demo/ifamous-project-17/commits/main',100.00,'2026-07-31 07:00:22');
/*!40000 ALTER TABLE `fyp_progress_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_project_members`
--

DROP TABLE IF EXISTS `fyp_project_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_project_members` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `student_name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `matric_no` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fyp_project_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_project_members`
--

LOCK TABLES `fyp_project_members` WRITE;
/*!40000 ALTER TABLE `fyp_project_members` DISABLE KEYS */;
INSERT INTO `fyp_project_members` VALUES (1,1,'Ahmad Daniel Tamingsari Bin Ramlan','A24MJ5074','2026-06-11 15:09:53'),(2,1,'Ahmad Fadzril Bin Ahmad Badril','A24MJ5050','2026-06-11 15:09:53'),(3,2,'Shaiikh Amir Husaini Bin Sh.Mohd Saifuddeen','A24MJ5068','2026-06-11 15:23:39'),(4,2,'Ahmad Fadzril Bin Ahmad Badril','A24MJ5050','2026-06-11 15:23:39'),(5,2,'Ahmad Daniel Tamingsari Bin Ramlan','A24MJ5074','2026-06-11 15:23:39'),(6,2,'Adlan Hazim Bin Abdul Rahman','A24MJ5056','2026-06-11 15:23:39'),(7,3,'Shaiikh Amir Husaini Bin Sh.Mohd Saifuddeen','A24MJ5068','2026-06-11 16:50:16'),(8,3,'Ahmad Fadzril Bin Ahmad Badril','A24MJ5050','2026-06-11 16:50:16'),(9,3,'Ahmad Daniel Tamingsari Bin Ramlan','A24MJ5074','2026-06-11 16:50:16'),(10,3,'Adlan Hazim Bin Abdul Rahman','A24MJ5056','2026-06-11 16:50:16'),(11,4,'Lim Wei Jie','A24MJ4001','2026-06-11 17:40:56'),(15,8,'daniel','A24MJ5074','2026-06-12 19:35:11'),(17,10,'daniel','A24MJ5074','2026-06-15 01:17:10'),(19,12,'daniel','A24MJ5074','2026-07-29 13:51:03'),(20,13,'test','A24MJ0000','2026-07-30 15:40:40'),(22,15,'test','A24MJ0000','2026-07-30 17:16:30'),(23,16,'test','A24MJ0000','2026-07-31 02:31:34'),(24,17,'Daniel Encem','STU4028','2026-07-31 03:23:12'),(25,18,'Daniello','STU4030','2026-07-31 09:05:19'),(27,20,'Jason Wong','A24MJ5038','2026-08-01 02:02:23');
/*!40000 ALTER TABLE `fyp_project_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_projects`
--

DROP TABLE IF EXISTS `fyp_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int DEFAULT NULL,
  `student_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `matric_no` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `project_title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `project_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Development',
  `abstract` text COLLATE utf8mb4_general_ci,
  `keywords` text COLLATE utf8mb4_general_ci,
  `supervisor_user_id` int DEFAULT NULL,
  `supervisor_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `supervisor_email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `supervisor_expertise` text COLLATE utf8mb4_general_ci,
  `examiner_user_id` int DEFAULT NULL,
  `examiner_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `examiner_email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `match_score` int DEFAULT '0',
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Pending Assignment',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `github_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `google_drive_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `proposal_approved_at` datetime DEFAULT NULL,
  `final_approved_at` datetime DEFAULT NULL,
  `approved_submission_id` int DEFAULT NULL,
  `current_phase` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Proposal',
  `progress_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `risk_status` varchar(30) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'On Track',
  `result_status` varchar(40) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `result_released_at` datetime DEFAULT NULL,
  `final_score` decimal(6,2) DEFAULT NULL,
  `final_grade` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_projects`
--

LOCK TABLES `fyp_projects` WRITE;
/*!40000 ALTER TABLE `fyp_projects` DISABLE KEYS */;
INSERT INTO `fyp_projects` VALUES (1,NULL,NULL,NULL,'Software Engineering Smart Academic Advisor (AA) Audit System','Development','This project develops a Vue.js academic advisor dashboard.','Vue.js, academic advisor, credit audit',4019,'Dr. David Kumar','david.kumar@utm.my','Software Engineering, Web Application, System Architecture',NULL,NULL,NULL,88,'Assigned','2026-06-11 15:09:52','2026-06-11 15:09:52',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'On Track',NULL,NULL,NULL,NULL),(2,NULL,NULL,NULL,'Software Engineering Smart Academic Advisor (AA) Audit System','Development','Managing academic progression is a significant challenge for students who must navigate complex course structures while tracking failed or missed subjects. Traditional methods of checking graduation eligibility are manual and prone to human error, often leading to delayed graduations due to missing credit hours. Our system addresses this by implementing a Vue.js-based Credit Audit Dashboard.','Credit Audit Dashboard,Vue.js,Academic Progression,Graduation Eligibility',2,'coordinator','Coordinator@utm.my','coordinator',NULL,NULL,NULL,55,'Assigned','2026-06-11 15:23:39','2026-06-11 15:23:39',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'On Track',NULL,NULL,NULL,NULL),(3,NULL,NULL,NULL,'Software Engineering Smart Academic Advisor (AA) Audit System','Development','Managing academic progression is a significant challenge for students who must navigate complex course structures while tracking failed or missed subjects. Traditional methods of checking graduation eligibility are manual and prone to human error, often leading to delayed graduations due to missing credit hours. Our system addresses this by implementing a Vue.js-based Credit Audit Dashboard.','Credit Audit Dashboard,Vue.js,Academic Progression,Graduation Eligibility',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,95,'Assigned','2026-06-11 16:50:16','2026-07-30 15:11:08',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'At Risk',NULL,NULL,NULL,NULL),(4,NULL,NULL,NULL,'Database-Driven Academic Information and Automation System','Development','This project proposes a database-driven academic information system that centralizes student records, project data, supervisor assignments, timetable records, and assessment status into a structured relational database.','Database Systems, Academic Information Systems, Automation, MySQL, Data Integrity, Reporting, Academic Records',4020,'Dr. Lim Wei Jie','lim.wei@utm.my','Database Systems, Academic Information Systems, Automation, MySQL',NULL,NULL,NULL,92,'Assigned','2026-06-11 17:40:55','2026-06-11 17:40:55',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'On Track',NULL,NULL,NULL,NULL),(8,NULL,NULL,NULL,'Software Engineering Smart Academic Advisor (AA) Audit System','Development','The Software Engineering Smart Academic Advisor (AA) Audit System is designed to automate the tracking of academic progression for students and advisors. By replacing manual graduation eligibility checks, the system utilizes a Vue.js-based dashboard to compare student results against a predefined course structure in real-time. The application dynamically identifies failed or missed subjects and calculates remaining credit hours using reactive state management and reusable components. Key features include a dynamic credit progress bar and an advisor filtering system to identify \'at-risk\' students, thereby reducing administrative errors and enhancing academic planning and oversight.','Vue.js, Academic Audit System, Reactive State Management, Educational Technology, Credit Tracking, Frontend Framework, Student Progress Monitoring',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,98,'Rejected','2026-06-12 19:35:11','2026-06-13 03:55:43',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'On Track',NULL,NULL,NULL,NULL),(10,4023,'daniel','A24MJ5074','Private Member Portal for a Fitness Club','Development','The project focuses on the development of a Private Member Portal for a fitness club, addressing the scalability and cross-platform limitations of traditional PHP sessions. The system implements a stateless authentication mechanism using JSON Web Tokens (JWT) to ensure secure access across various frontend platforms, including web and mobile applications. The technical implementation involves creating a secure login endpoint that issues signed tokens, storing these tokens on the client-side via localStorage, and utilizing Authorization Headers for protected API requests. The final solution ensures a secure user experience by restricting access to sensitive profile pages based on the validity and expiration of the JWT.','JSON Web Token, Stateless Authentication, Cross-Platform Development, RESTful API, PHP Slim, Web Security, Client-Side Storage, User Authorization',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,82,'Rejected','2026-06-15 01:17:10','2026-07-30 16:59:11',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'At Risk',NULL,NULL,NULL,NULL),(12,4023,'daniel','A24MJ5074','Intelligent FYP Assessment Management and Outcome System','Development','This project proposes an intelligent web-based Final Year Project management platform designed to assist coordinators in supervisor matching, scheduling, workload balancing, and project monitoring. By leveraging artificial intelligence, the system analyzes proposal titles, abstracts, and keywords to compare them with lecturer expertise, providing automated recommendations for suitable supervisors. The platform features a coordinator dashboard, proposal tracking, and AI-assisted decision support utilizing semantic analysis and recommendation logic. The intended outcome is to accelerate the supervisor assignment process, ensure equitable workload distribution among staff, and enhance the overall monitoring of FYP progress through academic workflow automation.','Artificial Intelligence, Machine Learning, Data Analytics, Supervisor Matching, FYP Management, Scheduling, Decision Support System',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,80,'Active','2026-07-29 13:51:03','2026-07-30 15:07:05',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'At Risk',NULL,NULL,NULL,NULL),(13,4025,'test','A24MJ0000','Intelligent FYP Assessment Management and Outcome System','Development','This project proposes an intelligent web-based Final Year Project management platform designed to assist coordinators in supervisor matching, scheduling, workload balancing, and project monitoring. By utilizing artificial intelligence, the system analyzes project proposal titles, abstracts, and keywords, comparing them against lecturer expertise to recommend the most suitable supervisors. The platform features a coordinator dashboard, proposal tracking, and AI-assisted decision support using semantic analysis and recommendation logic. The primary objective is to streamline the supervisor assignment process, ensure fair workload distribution among faculty members, and enhance the overall monitoring of FYP progress through academic workflow automation.','Artificial Intelligence, Machine Learning, Data Analytics, Supervisor Matching, FYP Management, Semantic Analysis, Recommendation Systems, Workflow Automation',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,75,'Rejected','2026-07-30 15:40:39','2026-07-30 17:13:24',NULL,NULL,NULL,NULL,NULL,'Proposal',0.00,'At Risk',NULL,NULL,NULL,NULL),(15,4025,'test','A24MJ0000','Intelligent FYP Assessment Management and Outcome System','Development','This project proposes an intelligent web-based Final Year Project management platform designed to assist coordinators in supervisor matching, scheduling, workload balancing, and project monitoring. By leveraging artificial intelligence, the system analyzes project proposal titles, abstracts, and keywords to recommend suitable supervisors based on their specific areas of expertise. The platform features a coordinator dashboard, proposal tracking, and AI-assisted decision support utilizing semantic analysis and recommendation logic. The primary objective is to streamline the supervisor assignment process, ensure fairness in workload distribution, and enhance the overall monitoring of FYP progress through academic workflow automation.','Artificial Intelligence, Machine Learning, Data Analytics, Supervisor Matching, FYP Management, Scheduling, Recommendation Systems, Semantic Analysis',4017,'Ts. Dr. Wong Mei Ling','wong.mei@utm.my','Artificial Intelligence, Machine Learning, Data Analytics, Recommendation System',4022,'Daniel Ramlan','danielramlann@utm.my',98,'Result Released','2026-07-30 17:16:30','2026-07-30 17:55:16','https://github.com/demo/ifamous-project-15','https://drive.google.com/drive/folders/demo-ifamous-15','2026-07-30 17:44:33','2026-07-30 17:45:43',12,'Completed',100.00,'On Track','Released','2026-07-30 17:55:16',97.50,NULL),(16,4025,'test','A24MJ0000','Database-Driven Academic Information and Automation System','Development','This project proposes a database-driven academic information system designed to centralize student records, project data, supervisor assignments, timetable records, and assessment status into a structured relational database. The system focuses on optimizing database design, academic information management, automated record updates, and query-based reporting to ensure high data integrity. By reducing reliance on manual spreadsheet work, the system aims to improve consistency in FYP data handling for coordinators. Key deliverables include the development of a database schema, automated information retrieval mechanisms, academic workflow automation, and a decision-support dashboard for reporting. The expected outcome is a reliable, database-centered platform that significantly enhances academic administration and reporting efficiency.','Database Systems, Academic Information Systems, Automation, MySQL, Data Integrity, Reporting, Relational Databases',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,0,'Active','2026-07-31 02:31:34','2026-07-31 03:20:57',NULL,NULL,'2026-07-31 03:20:57',NULL,NULL,'Development in Progress',30.00,'On Track',NULL,NULL,NULL,NULL),(17,4028,'Daniel Encem','STU4028','Database-Driven Academic Information and Automation System','Development','This project proposes a database-driven academic information system designed to centralize student records, project data, supervisor assignments, timetable records, and assessment status into a structured relational database. The system focuses on enhancing database design, academic information management, and the automation of record updates and query-based reporting to ensure data integrity. By reducing reliance on manual spreadsheet workflows, the system aims to improve consistency in Final Year Project (FYP) data handling. Key deliverables include the database schema design, automated information retrieval, academic workflow automation, and a decision-support dashboard, resulting in a reliable platform that optimizes academic administration and reporting efficiency.','Database Systems, Academic Information Systems, Automation, MySQL, Data Integrity, Reporting, Academic Records',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,0,'Final Deliverables Submitted','2026-07-31 03:23:12','2026-07-31 07:00:29','https://github.com/demo/ifamous-project-17','https://drive.google.com/drive/folders/demo-ifamous-17','2026-07-31 04:48:19',NULL,NULL,'Final Review',100.00,'On Track',NULL,NULL,NULL,NULL),(18,4030,'Daniello','STU4030','Database-Driven Academic Information and Automation System','Development','This project proposes a database-driven academic information system designed to centralize student records, project data, supervisor assignments, timetable records, and assessment status into a structured relational database. The system emphasizes robust database design, academic information management, automated record updates, and query-based reporting to ensure data integrity. By reducing reliance on manual spreadsheet work, the system aims to improve consistency in FYP data handling. The development scope includes database schema design, automated information retrieval, academic workflow automation, and the creation of dashboard reporting for decision support, ultimately providing a reliable platform to enhance academic administration and reporting efficiency.','Database Systems, Academic Information Systems, Automation, MySQL, Data Integrity, Reporting, Relational Databases, Academic Records',4022,'Daniel Ramlan','danielramlann@utm.my','software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL,NULL,NULL,98,'Pending Supervisor Assignment','2026-07-31 09:05:19','2026-07-31 12:28:17',NULL,NULL,NULL,NULL,NULL,'Supervisor Assignment',20.00,'On Track',NULL,NULL,NULL,NULL),(20,4026,'Jason Wong','A24MJ5038','Testing IOT on Chiller Room','Development','This project aims to address energy inefficiency and waste in chiller rooms within the Malaysian context, specifically focusing on the Chiller Lab at MJIIT, Universiti Teknologi Malaysia. The proposed solution involves the development of an IoT-based control system designed to optimize energy consumption by monitoring and regulating speed and temperature. By implementing automated controls to shut down or adjust the chiller based on specific temperature thresholds, the system seeks to improve operational efficiency. The technical implementation will utilize Arduino hardware integrated with software developed in C#, C++, or Java, utilizing a localhost network configuration and password-based security to ensure stable and secure environmental monitoring.','Internet of Things, Energy Efficiency, Temperature Control, Automated Monitoring, Arduino, Industrial Automation, Smart Cooling Systems',4027,'normalstaff@utm.my','normalstaff@utm.my','IOT, AI, Machine Learning, GG, Hardware Expertise',NULL,NULL,NULL,0,'Pending AI Matching','2026-08-01 02:02:23','2026-08-01 02:03:24',NULL,NULL,'2026-08-01 02:03:24',NULL,NULL,'AI Supervisor Matching',25.00,'On Track',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `fyp_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_rubric_items`
--

DROP TABLE IF EXISTS `fyp_rubric_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_rubric_items` (
  `rubric_item_id` int NOT NULL AUTO_INCREMENT,
  `criterion` varchar(255) NOT NULL,
  `description` text,
  `max_score` decimal(6,2) NOT NULL,
  `weightage` decimal(6,2) DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rubric_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_rubric_items`
--

LOCK TABLES `fyp_rubric_items` WRITE;
/*!40000 ALTER TABLE `fyp_rubric_items` DISABLE KEYS */;
INSERT INTO `fyp_rubric_items` VALUES (1,'Technical Quality','Quality and correctness of the technical implementation.',30.00,NULL,1,1,'2026-07-30 15:06:52'),(2,'Innovation','Originality and value of the proposed solution.',20.00,NULL,2,1,'2026-07-30 15:06:52'),(3,'Documentation','Clarity, completeness and academic quality of the report.',20.00,NULL,3,1,'2026-07-30 15:06:52'),(4,'Presentation and Demonstration','Communication, demonstration and response to questions.',20.00,NULL,4,1,'2026-07-30 15:06:52'),(5,'Project Management','Planning, progress, testing and professional practice.',10.00,NULL,5,1,'2026-07-30 15:06:52');
/*!40000 ALTER TABLE `fyp_rubric_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_session`
--

DROP TABLE IF EXISTS `fyp_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_session` (
  `fyp_session_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`fyp_session_id`),
  UNIQUE KEY `fyp_session_id` (`fyp_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_session`
--

LOCK TABLES `fyp_session` WRITE;
/*!40000 ALTER TABLE `fyp_session` DISABLE KEYS */;
INSERT INTO `fyp_session` VALUES (25261,0),(25262,1);
/*!40000 ALTER TABLE `fyp_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_supervisor_assessment_scores`
--

DROP TABLE IF EXISTS `fyp_supervisor_assessment_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_supervisor_assessment_scores` (
  `score_id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `rubric_item_id` int NOT NULL,
  `score` decimal(6,2) NOT NULL,
  `comment` text,
  PRIMARY KEY (`score_id`),
  UNIQUE KEY `uq_sv_assessment_rubric` (`assessment_id`,`rubric_item_id`),
  KEY `fk_sv_score_rubric` (`rubric_item_id`),
  CONSTRAINT `fk_sv_score_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `fyp_supervisor_assessments` (`assessment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sv_score_rubric` FOREIGN KEY (`rubric_item_id`) REFERENCES `fyp_rubric_items` (`rubric_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_supervisor_assessment_scores`
--

LOCK TABLES `fyp_supervisor_assessment_scores` WRITE;
/*!40000 ALTER TABLE `fyp_supervisor_assessment_scores` DISABLE KEYS */;
INSERT INTO `fyp_supervisor_assessment_scores` VALUES (1,1,1,30.00,NULL),(2,1,2,20.00,NULL),(3,1,3,20.00,NULL),(4,1,4,20.00,NULL),(5,1,5,10.00,NULL);
/*!40000 ALTER TABLE `fyp_supervisor_assessment_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_supervisor_assessments`
--

DROP TABLE IF EXISTS `fyp_supervisor_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_supervisor_assessments` (
  `assessment_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `supervisor_user_id` int NOT NULL,
  `comments` text,
  `total_score` decimal(8,2) NOT NULL DEFAULT '0.00',
  `percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('Draft','Submitted') NOT NULL DEFAULT 'Draft',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assessment_id`),
  UNIQUE KEY `uq_supervisor_assessment` (`project_id`,`supervisor_user_id`),
  KEY `fk_sv_assessment_supervisor` (`supervisor_user_id`),
  CONSTRAINT `fk_sv_assessment_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sv_assessment_supervisor` FOREIGN KEY (`supervisor_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_supervisor_assessments`
--

LOCK TABLES `fyp_supervisor_assessments` WRITE;
/*!40000 ALTER TABLE `fyp_supervisor_assessments` DISABLE KEYS */;
INSERT INTO `fyp_supervisor_assessments` VALUES (1,15,4017,NULL,100.00,100.00,'Submitted','2026-07-31 01:55:02','2026-07-30 17:55:01','2026-07-30 17:55:01');
/*!40000 ALTER TABLE `fyp_supervisor_assessments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fyp_supervisor_nominations`
--

DROP TABLE IF EXISTS `fyp_supervisor_nominations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fyp_supervisor_nominations` (
  `nomination_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `student_user_id` int NOT NULL,
  `supervisor_user_id` int NOT NULL,
  `preference_rank` int NOT NULL DEFAULT '1',
  `note` varchar(500) DEFAULT NULL,
  `status` enum('Nominated','Accepted','Not Selected') NOT NULL DEFAULT 'Nominated',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`nomination_id`),
  UNIQUE KEY `uq_project_student_supervisor_nomination` (`project_id`,`student_user_id`,`supervisor_user_id`),
  KEY `fk_nomination_student` (`student_user_id`),
  KEY `fk_nomination_supervisor` (`supervisor_user_id`),
  CONSTRAINT `fk_nomination_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nomination_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nomination_supervisor` FOREIGN KEY (`supervisor_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fyp_supervisor_nominations`
--

LOCK TABLES `fyp_supervisor_nominations` WRITE;
/*!40000 ALTER TABLE `fyp_supervisor_nominations` DISABLE KEYS */;
INSERT INTO `fyp_supervisor_nominations` VALUES (1,16,4025,4022,1,'AI match 98%: Perfect match with direct expertise in Database Management, MySQL, and academic-specific systems (Academic Advising, Graduation Checking), which aligns exactly with the project\'s core objectives.','Accepted','2026-07-31 02:31:34'),(2,16,4025,4017,2,'AI match 65%: Relevant expertise in Data Analytics which supports the reporting and decision-support dashboard aspects of the project.','Not Selected','2026-07-31 02:31:35'),(3,16,4025,4027,3,'AI match 30%: Limited relevance as expertise is focused on hardware and IoT, though AI knowledge provides minimal overlap with automation.','Not Selected','2026-07-31 02:31:35'),(4,17,4028,4022,1,'AI match 98%: Perfect match with direct expertise in Database Management, MySQL, and academic-specific systems such as graduation requirement checking and course planning.','Accepted','2026-07-31 03:23:12'),(5,17,4028,4017,2,'AI match 65%: Relevant for the data analytics and reporting aspects of the project, although less focused on database architecture than the top candidate.','Not Selected','2026-07-31 03:23:12'),(6,17,4028,4027,3,'AI match 30%: Limited relevance as expertise is primarily in hardware and AI, with no specific mention of database or academic information systems.','Not Selected','2026-07-31 03:23:12'),(7,18,4030,4022,1,'AI match 98%: Perfect match with direct expertise in Database Management, MySQL, and academic-specific systems (CGPA analysis, graduation checking), aligning exactly with the project\'s goals.','Accepted','2026-07-31 09:05:19'),(8,18,4030,4017,2,'AI match 65%: Relevant expertise in Data Analytics which supports the reporting and decision support aspects of the proposed system.','Not Selected','2026-07-31 09:05:19'),(9,18,4030,4024,3,'AI match 40%: General system administration knowledge may assist in deployment, but lacks specific database development expertise.','Not Selected','2026-07-31 09:05:19'),(10,20,4026,4027,1,'AI match 95%: Direct match with IoT and Hardware expertise, which are the core requirements for the chiller room monitoring system using Arduino.','Accepted','2026-08-01 02:02:23'),(11,20,4026,4022,2,'AI match 45%: Provides software engineering and database expertise for the localhost network and security implementation of the system.','Not Selected','2026-08-01 02:02:23');
/*!40000 ALTER TABLE `fyp_supervisor_nominations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grading_table`
--

DROP TABLE IF EXISTS `grading_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grading_table` (
  `grading_id` int NOT NULL AUTO_INCREMENT,
  `grading_data` json NOT NULL,
  `total_score` float NOT NULL,
  `comments` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `project_id` int NOT NULL,
  `grader_id` int NOT NULL,
  PRIMARY KEY (`grading_id`),
  KEY `grader_id` (`grader_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `grading_table_ibfk_1` FOREIGN KEY (`grader_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `grading_table_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grading_table`
--

LOCK TABLES `grading_table` WRITE;
/*!40000 ALTER TABLE `grading_table` DISABLE KEYS */;
/*!40000 ALTER TABLE `grading_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting`
--

DROP TABLE IF EXISTS `meeting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting` (
  `meeting_id` int NOT NULL AUTO_INCREMENT,
  `mom` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `meeting_date` date NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `meeting_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting`
--

LOCK TABLES `meeting` WRITE;
/*!40000 ALTER TABLE `meeting` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_schedule`
--

DROP TABLE IF EXISTS `meeting_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_schedule` (
  `meeting_id` int NOT NULL AUTO_INCREMENT,
  `meeting_json` json NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `meeting_schedule_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_schedule`
--

LOCK TABLES `meeting_schedule` WRITE;
/*!40000 ALTER TABLE `meeting_schedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `github_link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `drive_link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parent_project_id` int DEFAULT NULL,
  `supervisor_id` int NOT NULL,
  `student_id` int NOT NULL,
  `fyp_session_id` int NOT NULL,
  PRIMARY KEY (`project_id`),
  KEY `parent_project_id` (`parent_project_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `student_id` (`student_id`),
  KEY `fyp_session_id` (`fyp_session_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`parent_project_id`) REFERENCES `projects` (`project_id`),
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisor` (`supervisor_id`),
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `projects_ibfk_4` FOREIGN KEY (`fyp_session_id`) REFERENCES `fyp_session` (`fyp_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects_submissions`
--

DROP TABLE IF EXISTS `projects_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects_submissions` (
  `submission_id` int NOT NULL AUTO_INCREMENT,
  `submission_title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `original_file_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `submission_type` enum('proposal','administrative','presentation','progress_report','final_deliverable','logbook','prototype','testing_evidence','feedback_attachment') COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_general_ci NOT NULL DEFAULT (_utf8mb4'pending'),
  `feedback` text COLLATE utf8mb4_general_ci,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `project_id` int NOT NULL,
  `mime_type` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `version_number` int NOT NULL DEFAULT '1',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  PRIMARY KEY (`submission_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fk_projects_submissions_fyp_project` FOREIGN KEY (`project_id`) REFERENCES `fyp_projects` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects_submissions`
--

LOCK TABLES `projects_submissions` WRITE;
/*!40000 ALTER TABLE `projects_submissions` DISABLE KEYS */;
INSERT INTO `projects_submissions` VALUES (10,'Proposal Submission','uploads/proposals/1785431790143_proposal_ai_matching_wong.docx','proposal_ai_matching_wong.docx','2026-07-30 17:16:30','proposal','approved','',4017,'2026-07-30 17:44:33',15,'application/vnd.openxmlformats-officedocument.wordprocessingml.document',1,0,4025),(11,'Demo Progress Report','uploads/journey/15-demo-progress-report.txt','progress-report.txt','2026-07-30 17:44:51','progress_report','pending',NULL,NULL,NULL,15,'text/plain',1,0,4025),(12,'Demo Final Deliverable','uploads/journey/15-demo-final-deliverable.txt','final-deliverable.txt','2026-07-30 17:44:51','final_deliverable','approved',NULL,4017,'2026-07-30 17:45:43',15,'text/plain',1,1,4025),(13,'Proposal Submission','uploads/proposals/1785465094834_proposal_database_lim.pdf','proposal_database_lim.pdf','2026-07-31 02:31:35','proposal','pending','please correct this',4022,'2026-07-31 02:39:09',16,'application/pdf',1,0,4025),(14,'Revised Proposal - Version 2','uploads/proposals/1785467978683_proposal_database_lim__1___1_.pdf','proposal_database_lim (1) (1).pdf','2026-07-31 03:19:38','proposal','approved','',4022,'2026-07-31 03:20:58',16,'application/pdf',2,0,4025),(15,'Proposal Submission','uploads/proposals/1785468192746_proposal_database_lim__1_.pdf','proposal_database_lim (1).pdf','2026-07-31 03:23:12','proposal','approved','',4022,'2026-07-31 04:48:19',17,'application/pdf',1,0,4028),(16,'Demo Progress Report','uploads/journey/17-demo-progress-report.txt','progress-report.txt','2026-07-31 07:00:22','progress_report','pending',NULL,NULL,NULL,17,'text/plain',1,0,4028),(17,'Demo Final Deliverable','uploads/journey/17-demo-final-deliverable.txt','final-deliverable.txt','2026-07-31 07:00:22','final_deliverable','pending',NULL,NULL,NULL,17,'text/plain',1,0,4028),(18,'Proposal Submission','uploads/proposals/1785488718939_proposal_database_lim__1___1_.pdf','proposal_database_lim (1) (1).pdf','2026-07-31 09:05:19','proposal','pending','fuck you',4022,'2026-07-31 09:06:55',18,'application/pdf',1,0,4030),(20,'Proposal Submission','uploads/proposals/1785549742414_Project_Proposal.pdf','Project Proposal.pdf','2026-08-01 02:02:23','proposal','pending',NULL,NULL,NULL,20,'application/pdf',1,0,4026);
/*!40000 ALTER TABLE `projects_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `metric_number` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `class_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `CGPA` float NOT NULL,
  `GPA` float DEFAULT NULL,
  `proof_of_credit_hours` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `credit_hours_completed` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `metric_number` (`metric_number`),
  KEY `fk_student_class` (`class_id`),
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `fyp_classes` (`class_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES ('A24MJ1001',1,4001,3.85,3.8,'mock',110),('A24MJ1002',3,4002,3.6,3.8,'mock',105),('A24MJ1003',4,4003,3.92,3.8,'mock',112),('A24MJ1004',2,4004,2.95,3.8,'mock',98),('A24MJ5074',NULL,4023,3.5,NULL,'Screenshot from 2026-07-31 10-44-25.png',90),('A24MJ0000',NULL,4025,3.5,NULL,'7286d78c-6f6a-4b1f-8ca8-1479b9224fc7.png',90),('A24MJ5038',NULL,4026,3.8,NULL,'profile.png',110),('STU4028',NULL,4028,3,NULL,'Updated by admin',90),('STU4030',NULL,4030,3,NULL,'Updated by admin',90);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisor`
--

DROP TABLE IF EXISTS `supervisor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisor` (
  `research_expertise` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sv_capacity` int NOT NULL,
  `current_capacity` int NOT NULL,
  `supervisor_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`supervisor_id`),
  CONSTRAINT `supervisor_ibfk_1` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisor`
--

LOCK TABLES `supervisor` WRITE;
/*!40000 ALTER TABLE `supervisor` DISABLE KEYS */;
INSERT INTO `supervisor` VALUES ('coordinator',5,0,2),('Artificial Intelligence, Machine Learning, Data Analytics, Recommendation System',5,0,4017),('software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',5,0,4022),('System Administration',5,0,4024),('IOT, AI, Machine Learning, GG, Hardware Expertise',5,0,4027),('ai, robotics',5,0,4029);
/*!40000 ALTER TABLE `supervisor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisor_nominations`
--

DROP TABLE IF EXISTS `supervisor_nominations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisor_nominations` (
  `nomination_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `preference_order` int NOT NULL,
  PRIMARY KEY (`nomination_id`),
  UNIQUE KEY `student_id` (`student_id`,`supervisor_id`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `supervisor_nominations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  CONSTRAINT `supervisor_nominations_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisor` (`supervisor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisor_nominations`
--

LOCK TABLES `supervisor_nominations` WRITE;
/*!40000 ALTER TABLE `supervisor_nominations` DISABLE KEYS */;
/*!40000 ALTER TABLE `supervisor_nominations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_table`
--

DROP TABLE IF EXISTS `time_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_table` (
  `time_table_id` int NOT NULL AUTO_INCREMENT,
  `fyp_session_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `schedule_json` json NOT NULL,
  PRIMARY KEY (`time_table_id`),
  UNIQUE KEY `unique_user_schedule` (`fyp_session_id`,`user_id`),
  UNIQUE KEY `unique_class_schedule` (`fyp_session_id`,`class_id`),
  KEY `fk_tt_user` (`user_id`),
  KEY `fk_tt_class` (`class_id`),
  CONSTRAINT `fk_tt_class` FOREIGN KEY (`class_id`) REFERENCES `fyp_classes` (`class_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_session` FOREIGN KEY (`fyp_session_id`) REFERENCES `fyp_session` (`fyp_session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_exclusive_owner` CHECK ((((`user_id` is not null) and (`class_id` is null)) or ((`user_id` is null) and (`class_id` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_table`
--

LOCK TABLES `time_table` WRITE;
/*!40000 ALTER TABLE `time_table` DISABLE KEYS */;
INSERT INTO `time_table` VALUES (1,25262,NULL,5,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"SECJ3553-01 (L) | N28-BK2\", \"end_time\": \"08:50\", \"start_time\": \"08:00\", \"is_blocking\": true}, {\"label\": \"SECJ3553-01 (L) | N28-MPKT1\", \"end_time\": \"10:50\", \"start_time\": \"09:00\", \"is_blocking\": true}, {\"label\": \"SECJ3104-01 (L) | N28-BK2\", \"end_time\": \"12:50\", \"start_time\": \"11:00\", \"is_blocking\": true}, {\"label\": \"SECJ3104-01 (L) | N28-MPKT1\", \"end_time\": \"16:50\", \"start_time\": \"14:00\", \"is_blocking\": true}], \"day_name\": \"Monday\", \"day_of_week\": 1}, {\"slots\": [{\"label\": \"SECJ3553-01 (L) | N28-MPKT2\", \"end_time\": \"16:50\", \"start_time\": \"14:00\", \"is_blocking\": true}], \"day_name\": \"Tuesday\", \"day_of_week\": 2}, {\"slots\": [{\"label\": \"SECH3143-01 (L) | N28-MPKT2\", \"end_time\": \"10:50\", \"start_time\": \"08:00\", \"is_blocking\": true}], \"day_name\": \"Wednesday\", \"day_of_week\": 3}, {\"slots\": [{\"label\": \"UKQF2102-06 (L) | U-BK2\", \"end_time\": \"09:50\", \"start_time\": \"08:00\", \"is_blocking\": true}, {\"label\": \"SECJ3623-01 (L) | N28-MPKT2\", \"end_time\": \"16:50\", \"start_time\": \"14:00\", \"is_blocking\": true}], \"day_name\": \"Thursday\", \"day_of_week\": 4}]}'),(2,25262,4016,NULL,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"Software Engineering 1 - Lecture\", \"end_time\": \"12:00\", \"start_time\": \"10:00\", \"is_blocking\": true}], \"day_name\": \"Monday\", \"day_of_week\": 1}, {\"slots\": [{\"label\": \"Open Consultation Hours\", \"end_time\": \"16:00\", \"start_time\": \"14:00\", \"is_blocking\": false}], \"day_name\": \"Wednesday\", \"day_of_week\": 3}]}'),(3,25262,4017,NULL,'{\"specific_events\": [{\"date\": \"2026-06-15\", \"label\": \"Final Year Project Presentations - Panel D\", \"end_time\": \"12:00\", \"start_time\": \"09:00\", \"is_blocking\": true}], \"weekly_recurring\": [{\"slots\": [{\"label\": \"Data Structures - Lab\", \"end_time\": \"11:00\", \"start_time\": \"08:00\", \"is_blocking\": true}], \"day_name\": \"Tuesday\", \"day_of_week\": 2}, {\"slots\": [{\"label\": \"Department Meeting\", \"end_time\": \"12:00\", \"start_time\": \"10:00\", \"is_blocking\": true}], \"day_name\": \"Thursday\", \"day_of_week\": 4}]}'),(4,25262,4018,NULL,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"FYP Consultation\", \"end_time\": \"16:00\", \"start_time\": \"14:00\", \"is_blocking\": false}], \"day_name\": \"Monday\", \"day_of_week\": 1}, {\"slots\": [{\"label\": \"Artificial Intelligence - Lecture\", \"end_time\": \"11:00\", \"start_time\": \"09:00\", \"is_blocking\": true}], \"day_name\": \"Friday\", \"day_of_week\": 5}]}'),(5,25261,4019,NULL,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"Web Programming - Lecture\", \"end_time\": \"10:00\", \"start_time\": \"08:00\", \"is_blocking\": true}], \"day_name\": \"Wednesday\", \"day_of_week\": 3}, {\"slots\": [{\"label\": \"Student Consultation\", \"end_time\": \"16:00\", \"start_time\": \"14:00\", \"is_blocking\": false}], \"day_name\": \"Thursday\", \"day_of_week\": 4}]}'),(7,25262,NULL,1,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"UHMS1182-07 (L) | KTG, L50 - BK2\", \"end_time\": \"15:50\", \"start_time\": \"14:00\", \"is_blocking\": true}], \"day_name\": \"Monday\", \"day_of_week\": 1}, {\"slots\": [{\"label\": \"SECP1513-10 (L) | N28 - BK5\", \"end_time\": \"08:50\", \"start_time\": \"08:00\", \"is_blocking\": true}, {\"label\": \"SECP1513-10 (L) | N28 - MPKT1\", \"end_time\": \"10:50\", \"start_time\": \"09:00\", \"is_blocking\": true}, {\"label\": \"UHMT1012-25 (L) | N24 - BK7\", \"end_time\": \"15:50\", \"start_time\": \"14:00\", \"is_blocking\": true}, {\"label\": \"UHLB1112-58 (L) | D06 - BLIK SEMI 2\", \"end_time\": \"16:50\", \"start_time\": \"16:00\", \"is_blocking\": true}], \"day_name\": \"Tuesday\", \"day_of_week\": 2}, {\"slots\": [{\"label\": \"SECI1013-09 (L) | N28 - BK2\", \"end_time\": \"10:50\", \"start_time\": \"10:00\", \"is_blocking\": true}, {\"label\": \"UHLB1112-58 (L) | N24 - BK4\", \"end_time\": \"15:50\", \"start_time\": \"14:00\", \"is_blocking\": true}, {\"label\": \"SECI1013-09 (L) | N28 - BK3\", \"end_time\": \"16:50\", \"start_time\": \"16:00\", \"is_blocking\": true}], \"day_name\": \"Wednesday\", \"day_of_week\": 3}, {\"slots\": [{\"label\": \"SECP1513-10 (L) | N28A - MP2\", \"end_time\": \"08:50\", \"start_time\": \"08:00\", \"is_blocking\": true}, {\"label\": \"SECI1013-09 (L) | N28 - MPKT2\", \"end_time\": \"12:50\", \"start_time\": \"10:00\", \"is_blocking\": true}], \"day_name\": \"Thursday\", \"day_of_week\": 4}]}'),(8,25262,NULL,2,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"SECJ1013-02 (L) | N28 - BK1\", \"end_time\": \"09:50\", \"start_time\": \"08:00\", \"is_blocking\": true}, {\"label\": \"SECJ2013-05 (L) | N28 - MPKT3\", \"end_time\": \"16:50\", \"start_time\": \"14:00\", \"is_blocking\": true}], \"day_name\": \"Monday\", \"day_of_week\": 1}, {\"slots\": [{\"label\": \"SECJ1013-02 (L) | N28 - BK1\", \"end_time\": \"09:50\", \"start_time\": \"08:00\", \"is_blocking\": true}], \"day_name\": \"Wednesday\", \"day_of_week\": 3}]}'),(9,25261,NULL,3,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"SECV2113-01 (L) | N28 - LAB 1\", \"end_time\": \"12:50\", \"start_time\": \"10:00\", \"is_blocking\": true}], \"day_name\": \"Tuesday\", \"day_of_week\": 2}, {\"slots\": [{\"label\": \"SECV3104-03 (L) | N28 - LAB 2\", \"end_time\": \"11:50\", \"start_time\": \"09:00\", \"is_blocking\": true}], \"day_name\": \"Friday\", \"day_of_week\": 5}]}'),(10,25262,4024,NULL,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"Wag\", \"slot_id\": \"1781336068779\", \"end_time\": \"03:34\", \"location\": \"\", \"start_time\": \"15:34\"}], \"day_name\": \"Monday\", \"day_of_week\": 1}]}'),(11,25262,NULL,7,'{\"specific_events\": [], \"weekly_recurring\": [{\"slots\": [{\"label\": \"SCSE2233 (L) SEC 15 BILIK KULIAH 20 (08.47.01) NUR AFIQAH BINTI SUZELAN AMIR (DR.)\", \"slot_id\": \"1785551298261_e0v88o\", \"end_time\": \"12:50\", \"start_time\": \"09:00\", \"is_blocking\": true}, {\"label\": \"SCSP3213 (L) SEC 15 BILIK KULIAH 02 (02.36.02) NUR FARHANA BINTI HORDRI (DR.)\", \"slot_id\": \"1785551298261_fo1yw9\", \"end_time\": \"15:50\", \"start_time\": \"13:00\", \"is_blocking\": true}], \"day_name\": \"Monday\", \"day_of_week\": 1}, {\"slots\": [{\"label\": \"SCSM2223 (L) SEC 15 BILIK KULIAH 07 (04.38.01) YUSNAIDI BIN MD YUSOF (DR.)\", \"slot_id\": \"1785551298261_75ub3\", \"end_time\": \"10:50\", \"start_time\": \"09:00\", \"is_blocking\": true}, {\"label\": \"ULRF2782 (L) SEC 90 BILIK KULIAH 08 (04.41.01) MUHAMMAD NURAZAM BIN SAARI\", \"slot_id\": \"1785551298261_3zhgi\", \"end_time\": \"15:50\", \"start_time\": \"13:00\", \"is_blocking\": true}], \"day_name\": \"Tuesday\", \"day_of_week\": 2}, {\"slots\": [{\"label\": \"ULRS1022 (L) SEC 91 DK 1-120 ZILAL BINTI SAARI (DR.)\", \"slot_id\": \"1785551298261_gq1kjd\", \"end_time\": \"12:50\", \"start_time\": \"11:00\", \"is_blocking\": true}], \"day_name\": \"Wednesday\", \"day_of_week\": 3}, {\"slots\": [{\"label\": \"UHLB2122 (L) SEC 98 BILIK KULIAH 12 (06.50.01) SERIAZNITA BINTI MAT SAID (DR.)\", \"slot_id\": \"1785551298261_mhb89a\", \"end_time\": \"12:50\", \"start_time\": \"11:00\", \"is_blocking\": true}, {\"label\": \"SCSP3213 (LAB) SEC 15(Practical) BILIK KULIAH 17 (06.62.01) NUR FARHANA BINTI HORDRI (DR.)\", \"slot_id\": \"1785551298261_6bge53\", \"end_time\": \"15:50\", \"start_time\": \"14:00\", \"is_blocking\": true}], \"day_name\": \"Thursday\", \"day_of_week\": 4}, {\"slots\": [{\"label\": \"SCSM2223 (LAB) SEC 15(Practical) EGT COMPUTER LAB (LEVEL 4) YUSNAIDI BIN MD YUSOF (DR.)\", \"slot_id\": \"1785551298261_besay\", \"end_time\": \"09:50\", \"start_time\": \"08:00\", \"is_blocking\": true}], \"day_name\": \"Friday\", \"day_of_week\": 5}]}');
/*!40000 ALTER TABLE `time_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `user_id` int NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `organisation` varchar(255) DEFAULT NULL,
  `biography` text,
  `profile_photo_url` varchar(500) DEFAULT NULL,
  `professional_link` varchar(500) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `supervisor_specialisation` varchar(500) DEFAULT NULL,
  `examiner_specialisation` varchar(500) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (2,'MJIIT','UTM',NULL,NULL,NULL,1,'iot, Coordinator, admin','iot, Coordinator, admin','2026-07-31 13:00:49');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` char(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone_number` varchar(12) COLLATE utf8mb4_general_ci NOT NULL,
  `date_created` date NOT NULL,
  `last_date_login` date NOT NULL,
  `is_utm_staff` tinyint(1) DEFAULT '0',
  `affiliation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `co_org_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expertise` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone_number` (`phone_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4031 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'Coordinator@utm.my','$2b$10$3iFLLswvlZPI4lu3Cqk/KOogNwWePP1Z8yIskCPgrtAU8ENGPf4XK','coordinator','1234567890','2026-05-07','2026-05-07',1,'coordinator',NULL,'coordinator',NULL),(4001,'ali.abu@graduate.utm.my','$2b$10$dummyHashStringHere','Ali bin Abu','0123456781','2026-05-30','2026-05-30',0,NULL,NULL,NULL,NULL),(4002,'wong.mei@graduate.utm.my','$2b$10$dummyHashStringHere','Wong Mei Ling','0123456782','2026-05-30','2026-05-30',0,NULL,NULL,NULL,NULL),(4003,'siti.n@graduate.utm.my','$2b$10$dummyHashStringHere','Siti Nurhaliza','0123456783','2026-05-30','2026-05-30',0,NULL,NULL,NULL,NULL),(4004,'david.k@graduate.utm.my','$2b$10$dummyHashStringHere','David Kumar','0123456784','2026-05-30','2026-05-30',0,NULL,NULL,NULL,NULL),(4016,'ali.abu@utm.my','$2b$10$mEYq0Us52h6.wzTUVK5.Huv.FZ0IdbAHrqk5R8UsdyOGje12yWAiu','Dr Ali bin Abu','0133456781','2026-05-30','2026-05-30',1,NULL,NULL,'Software Engineering, Academic Advising, Web Application Development, Student Progress Tracking',NULL),(4017,'wong.mei@utm.my','$2b$10$w/zB.8KQsYVIupZMs1qQAeB.RdzHq1kd9.VWOj1GA/VndRfhT42ey','Ts. Dr. Wong Mei Ling','0123454782','2026-05-30','2026-05-30',1,NULL,NULL,'Artificial Intelligence, Machine Learning, Data Analytics, Recommendation System',NULL),(4018,'siti.n@utm.my','$2b$10$dummyHashStringHere','Ts. Ir. Dr. Siti Nurhaliza','0128256783','2026-05-30','2026-05-30',1,NULL,NULL,'Internet of Things, Embedded Systems, Automation, Robotics',NULL),(4019,'david.k@utm.my','$2b$10$dummyHashStringHere','Dr. David Kumar','0124456787','2026-05-30','2026-05-30',1,NULL,NULL,'Software Engineering, Web Application, System Architecture, Backend Development',NULL),(4022,'danielramlann@utm.my','$2b$10$VEF4CNuvKYGA3MoYv0AXlOGlWoXzt8ID1d11sPVO9r1uSy.diWTiq','Daniel Ramlan','0174076698','2026-06-11','2026-06-11',1,'mjiit',NULL,'software engineering, Academic Advising, Database Management, CGPA Analysis, Course Planning, Graduation Requirement Checking, MySQL, Node.js, Vue.js',NULL),(4023,'daniel@graduate.utm.my','$2b$10$LXdV3ULbxfy3RXwizPH/H.LqQobJAMBt5Q.oH6j56dDu6Ne49ydrm','daniel','15155','2026-06-12','2026-06-12',0,NULL,NULL,NULL,NULL),(4024,'admin@utm.my','$2b$10$BGiHpx892E.09Kd83tizd.NI0nMw1OThl2kF4rAlBYWLhKXaRmxnS','System Admin','0000000000','2026-06-12','2026-06-12',1,'Administrator','UTM','System Administration','UTM'),(4025,'test@graduate.utm.my','$2b$10$j.s/JTHvGRuZlDNaCXMgX.JOzpCt/KivbqeDP7LYk/7l4Kdr6QLo2','test','9999999','2026-06-13','2026-06-13',0,NULL,NULL,NULL,NULL),(4026,'jason@graduate.utm.my','$2b$10$GwDwj4NN9ONN49BIInX39uxERzPBEgI8ZfrDEySGuOYuSGqbi1zf6','Jason Wong','01222345738','2026-07-28','2026-07-28',0,NULL,NULL,NULL,NULL),(4027,'normalstaff@utm.my','$2b$10$drIXoJ2T0ItVn4bQMw5gteqLoeiNhlnmbzGyIONZ7tiN6v9GMNOFy','normalstaff@utm.my','01111223456','2026-07-30','2026-07-30',1,'FC',NULL,'IOT, AI, Machine Learning, GG, Hardware Expertise',NULL),(4028,'daniel-02@graduate.utm.my','$2b$10$0TY8uPERn0UMKKeuHr39MuBRDxeY3ri4f2attKYP6pgN6SSVGP1ZS','Daniel Encem','0174176698','2026-07-31','2026-07-31',0,NULL,NULL,NULL,NULL),(4029,'test@utm.my','$2b$10$3JX3fIK21UW9mbAEZfaw6uY9KU2ECbVIdJbRKPrAN0mhx3K3I1JBC','heheheehe','29299292','2026-07-31','2026-07-31',1,'mjiit',NULL,'ai, robotics',NULL),(4030,'danielramlann@gmail.com','$2b$10$EyQL9IbyDQfHCPyQChJxe.fU/hxNLirgwZQUuzvm74p/t8IVfsOWe','Daniello','0123456456','2026-07-31','2026-07-31',0,NULL,'aurora','ai, robotic, software engineering',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_project_scheduling_roster`
--

DROP TABLE IF EXISTS `vw_project_scheduling_roster`;
/*!50001 DROP VIEW IF EXISTS `vw_project_scheduling_roster`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_project_scheduling_roster` AS SELECT 
 1 AS `project_id`,
 1 AS `fyp_session_id`,
 1 AS `project_title`,
 1 AS `student_details`,
 1 AS `supervisor_details`,
 1 AS `examiners_json`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'ifamous_dbms'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_CheckClassExists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_CheckClassExists`(
    IN p_fyp_session_id INT,
    IN p_section_name VARCHAR(50)
)
BEGIN
    
    SELECT class_id 
    FROM fyp_classes
    WHERE fyp_session_id = p_fyp_session_id 
      AND section_name = p_section_name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_CreateCalendarSchedule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_CreateCalendarSchedule`(
    IN p_fyp_session_id INT,
    IN p_user_id INT,
    IN p_class_id INT,
    IN p_schedule_json JSON
)
BEGIN
    DECLARE v_session_exists INT DEFAULT 0;
    SELECT 1 INTO v_session_exists 
    FROM fyp_session 
    WHERE fyp_session_id = p_fyp_session_id LIMIT 1;

    IF v_session_exists = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Validation Error: The specified FYP Session does not exist.';
    ELSE
        INSERT INTO time_table (
            fyp_session_id, 
            user_id,
            class_id, 
            schedule_json
        ) 
        VALUES (
            p_fyp_session_id, 
            p_user_id, 
            p_class_id, 
            p_schedule_json
        );
        SELECT LAST_INSERT_ID() AS new_time_table_id;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_CreateClass` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_CreateClass`(
    IN p_fyp_session_id INT,
    IN p_section_name VARCHAR(50)
)
BEGIN
    
    INSERT INTO fyp_classes (fyp_session_id, section_name) 
    VALUES (p_fyp_session_id, p_section_name);
    
    
    SELECT LAST_INSERT_ID() AS class_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_DeleteCalendarSchedule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_DeleteCalendarSchedule`(
    IN p_time_table_id INT
)
BEGIN
    
    DELETE FROM time_table 
    WHERE time_table_id = p_time_table_id;
    
    
    SELECT ROW_COUNT() AS affected_rows;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_delete_session` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_delete_session`(
	IN session_id INT
)
BEGIN
	DELETE FROM fyp_session WHERE  fyp_session_id = session_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_GetRecentUsersByCategory` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_GetRecentUsersByCategory`()
BEGIN
    
    SELECT u.user_id, u.email, u.full_name, u.phone_number, s.metric_number
    FROM users u
    JOIN students s ON u.user_id = s.student_id
    ORDER BY u.date_created DESC, u.user_id DESC
    LIMIT 20;

    
    SELECT u.user_id, u.email, u.full_name, u.phone_number, u.expertise
    FROM users u
    WHERE u.is_utm_staff = 1
    ORDER BY u.date_created DESC, u.user_id DESC
    LIMIT 20;

    
    SELECT u.user_id, u.email, u.full_name, u.phone_number, u.co_org_name
    FROM users u
    WHERE u.is_utm_staff = 0 AND u.user_id NOT IN (SELECT student_id FROM students)
    ORDER BY u.date_created DESC, u.user_id DESC
    LIMIT 20;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_GetSessionCalendarData` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_GetSessionCalendarData`(IN p_session_id INT)
BEGIN
    SELECT fyp_session_id 
    FROM fyp_session 
    WHERE fyp_session_id = p_session_id;

    SELECT 
        tt.time_table_id,
        tt.user_id,
        u.full_name AS staff_name,
        u.email AS staff_email,
        tt.class_id,
        c.section_name,
        tt.schedule_json
    FROM time_table tt
    LEFT JOIN users u ON tt.user_id = u.user_id
    LEFT JOIN fyp_classes c ON tt.class_id = c.class_id
    WHERE tt.fyp_session_id = p_session_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_all_session` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_get_all_session`()
BEGIN
	SELECT * FROM fyp_session;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_session` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_insert_session`(
IN session_number INT)
BEGIN
	INSERT INTO fyp_session (fyp_session_id) VALUES (session_number);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_lookup_user_role` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_lookup_user_role`(
	IN email_address VARCHAR(255),
	IN user_id INT
)
BEGIN
	SELECT
		
		IF(s.student_id IS NOT NULL, 1, 0) AS is_student,
		IF(sv.supervisor_id IS NOT NULL, 1, 0) AS is_supervisor,
		IF(e.examiners_id IS NOT NULL, 1, 0) AS is_examiner,
		IF(c.user_id IS NOT NULL, 1, 0) AS is_coordinator
	FROM users u
	LEFT JOIN students s ON u.user_id = s.student_id
	LEFT JOIN supervisor sv ON u.user_id = sv.supervisor_id
	LEFT JOIN examiners e ON u.user_id = e.examiners_id
	LEFT JOIN coordinator c ON u.user_id = c.user_id
	WHERE u.email = email_address AND u.user_id = user_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_SearchNonStudentUsers` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_SearchNonStudentUsers`(
    IN p_search_query VARCHAR(255),
    IN p_session_id INT
)
BEGIN
    SELECT user_id, email, full_name, is_utm_staff 
    FROM users 
    WHERE (email LIKE p_search_query OR full_name LIKE p_search_query) 
      AND user_id NOT IN (SELECT student_id FROM students)
      AND user_id NOT IN (SELECT user_id FROM time_table WHERE fyp_session_id = p_session_id AND user_id IS NOT NULL)
    LIMIT 10;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_select_session` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_select_session`(
	IN session_number int
)
BEGIN
	SELECT fyp_session_id FROM fyp_session WHERE fyp_session_id = session_number;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_SetActiveFYPSession` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_SetActiveFYPSession`(
    IN p_target_session_id INT
)
BEGIN
    
    
    
    UPDATE fyp_session 
    SET is_active = IF(fyp_session_id = p_target_session_id, 1, 0);
    
    
    SELECT ROW_COUNT() AS affected_rows;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_signup_normal_user` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_signup_normal_user`(
    IN p_email CHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_full_name VARCHAR(255),
    IN p_phone_number VARCHAR(12),
    IN co_org_name VARCHAR(255),
    IN expertise VARCHAR(255),
    IN p_affiliation VARCHAR(255)
)
BEGIN
    DECLARE v_is_utm_staff TINYINT DEFAULT 0;
    
    
    IF EXISTS (SELECT 1 FROM `ifamous_dbms`.`users` WHERE `email` = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Email already registered.';
    ELSEIF EXISTS (SELECT 1 FROM `ifamous_dbms`.`users` WHERE `phone_number` = p_phone_number) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Phone number already registered.';
    ELSE
        
        
        IF p_email LIKE '%@utm.my' THEN
            SET v_is_utm_staff = 1;
        END IF;

		START TRANSACTION;
        
        INSERT INTO `ifamous_dbms`.`users` (
            `email`, 
            `password_hash`, 
            `full_name`, 
            `phone_number`, 
            `date_created`, 
            `last_date_login`, 
            `is_utm_staff`, 
            `co_org_name`,
            `expertise`,
            `affiliation`
        ) 
        VALUES (
            p_email, 
            p_password_hash, 
            p_full_name, 
            p_phone_number, 
            CURDATE(), 
            CURDATE(), 
            v_is_utm_staff, 
            co_org_name,
            expertise,
            p_affiliation
        );
        COMMIT;
        
        SELECT LAST_INSERT_ID() AS new_user_id;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_UpdateCalendarSchedule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_UpdateCalendarSchedule`(
    IN p_time_table_id INT,
    IN p_user_id INT,
    IN p_class_id INT,
    IN p_schedule_json JSON
)
BEGIN
    UPDATE time_table 
    SET 
        user_id = p_user_id,
        class_id = p_class_id,
        schedule_json = p_schedule_json
    WHERE 
        time_table_id = p_time_table_id;
        
    SELECT ROW_COUNT() AS affected_rows;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_UpdateUserProfile` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_UpdateUserProfile`(
    IN p_user_id INT,
    IN p_full_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone_number VARCHAR(20),
    IN p_expertise VARCHAR(255),
    IN p_affiliation VARCHAR(255)
)
BEGIN
    
    UPDATE users 
    SET 
        full_name = p_full_name,
        email = p_email,
        phone_number = p_phone_number,
        expertise = p_expertise,
        affiliation = p_affiliation
    WHERE 
        user_id = p_user_id;
        
    
    
    SELECT ROW_COUNT() AS affected_rows;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_session` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`avnadmin`@`%` PROCEDURE `sp_update_session`(
	IN old_session_id INT,
    IN new_session_id INT
)
BEGIN
	UPDATE time_table 
    SET 
        user_id = p_user_id,
        class_id = p_class_id,
        schedule_json = p_schedule_json
    WHERE 
        time_table_id = p_time_table_id;
        
    
    SELECT ROW_COUNT() AS affected_rows;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vw_project_scheduling_roster`
--

/*!50001 DROP VIEW IF EXISTS `vw_project_scheduling_roster`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`avnadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_project_scheduling_roster` AS select `project`.`project_id` AS `project_id`,`project`.`fyp_session_id` AS `fyp_session_id`,`project`.`title` AS `project_title`,json_object('student_id',`project`.`student_id`,'full_name',`stu_user`.`full_name`,'metric_number',`s`.`metric_number`,'email',`stu_user`.`email`) AS `student_details`,json_object('supervisor_id',`project`.`supervisor_id`,'full_name',`sv_user`.`full_name`,'email',`sv_user`.`email`) AS `supervisor_details`,coalesce((select concat('[',group_concat(json_object('examiner_id',`ea`.`examiners_id`,'name',`ex_user`.`full_name`,'email',`ex_user`.`email`) separator ','),']') from (`examine` `ea` join `users` `ex_user` on((`ea`.`examiners_id` = `ex_user`.`user_id`))) where (`ea`.`project_id` = `project`.`project_id`)),json_array()) AS `examiners_json` from (((`projects` `project` join `students` `s` on((`project`.`student_id` = `s`.`student_id`))) join `users` `stu_user` on((`project`.`student_id` = `stu_user`.`user_id`))) join `users` `sv_user` on((`project`.`supervisor_id` = `sv_user`.`user_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-01 17:19:23
