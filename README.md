# I-famous

> **UTM Semester 4 Application Development Project (ADP)**  
> Developed for **Digitex 2026** (Digital Technology Exhibition 2026)  
> **Group:** Fukushima, Japan

---

## Introduction

**I-famous** is an intelligent Final Year Project (FYP) management and scheduling dashboard designed for Universiti Teknologi Malaysia (UTM). It solves the complex administrative problem of coordinating and scheduling presentation slots for students, supervisors, and examiners by leveraging asynchronous calendar cross-checking, automated conflict checking, and AI-driven slot allocation.

---

## Team Members & Responsibilities

<table>
  <tr>
    <th>Team Members</th>
    <th>Frontend</th>
    <th>API</th>
    <th>Backend</th>
    <th>Database</th>
    <th>ML/AL</th>
  </tr>
  <tr>
    <td><strong>Jason Doe </strong> <br> (mainly focusing on coordinator module)</td>
     <td>
     <a href="src/views/auth/LoginView.vue">Login view</a> <br>
     <a href="src/views/auth/SignupView.vue">Signup view</a> <br>
     <a href="src/views/coordinator">Coordinator module </a> <br>
     <a href="src/views/coordinator/CalendarView.vue">Calendar module </a> <br>
     <a href="src/views/coordinator/EditTimeTableView.vue">Edit Time table  </a> <br>
     <a href="src/views/coordinator/ManageUserView.vue">Manage user view </a> <br>
     <a href="src/views/coordinator">Coordinator module </a> <br>
     </td>
    <td></td>
    <td></td>
    <td> 
      <a href="Schema/new_sql_schema-v5.sql">Schema setup v1-5 </a> <br> 
      <a href="Schema/export_backup/backup v5.sql">Schema backup complete v1-5</a> <br> 
    </td>
    <td></td>
  </tr>
  <tr>
    <td><strong>Julkar Nahin</strong></td>
     <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td><strong>Hee Wah Hin</strong></td>
    <td>
      <a href="https://github.com/Thafoxes/application-development-project/blob/student-module/src/views/student/CreateFypView.vue">Create FYP view</a> <br>
    </td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td><strong>Daniel Rahman</strong></td>
   <td></td>
    <td></td>
    <td> </td>
    <td></td>
    <td></td>
  </tr>
</table>

---

## System Architecture

The project implements a clean **3-Tier Architecture** to separate user interaction, business logic, and transactional database states.

![3-Tier System Architecture](./media/3%20tier%20architecture.png)

### 1. Presentation Tier (Frontend / Client)
- **Technologies:** Vue 3 (Composition API) + Vite.
- **UI Model:** Designed using the **Model-View-ViewModel (MVVM)** pattern.
  - **View:** Reactive HTML templates (`ManageTimeTableView.vue`, `CreateMeetingView.vue`) bound to values.
  - **ViewModel:** `<script setup>` contexts utilizing Vue's reactivity system to bind the template to active stores.
  - **Model:** State models powered by **Pinia** (e.g., `useCalendarStore`) and local schemas.
- **Aesthetics:** Modern, responsive dashboard design utilizing dynamic overlays and clean custom CSS.
- **Centralized Navigation Configuration:** 
  - The single source of truth for the site menus is defined in [navigation.js](file:///d:/Github/application-development-project/src/config/navigation.js). It maps roles (`coordinator`, `student`, `supervisor`, `examiner`) to their respective array of navigation entries, paths, and icons.
  - **Sidebar App Integration:** [AppSidebar.vue](file:///d:/Github/application-development-project/src/components/common_components/AppSidebar.vue) imports this configuration file to generate the main desktop left-hand drawer links dynamically based on the current user's authenticated role.
  - **Header Mobile App Integration:** [AppHeader.vue](file:///d:/Github/application-development-project/src/components/common_components/AppHeader.vue) imports this same configuration file to drive the responsive mobile-viewport navigation dropdown overlay, ensuring that both views remain fully synchronized without duplicated lists.

### 2. Logic Tier (Backend / Application Server)
- **Technologies:** Node.js + Express.js.
- **AI Timetable Parsing:** Integrated with **Tesseract.js** for client/server-side OCR character extraction, and a locally hosted **Ollama** engine (running `gemma4:latest`) to convert visual timetables into validated JSON formats.
- **Constraint Engine:** Crosschecks schedules and runs the automated meeting placement logic.

### 3. Data Tier (Database)
- **Technologies:** MySQL.
- **Stored Procedures:** Business rules, user retrieval, and calendar entries are run through optimized SQL **Stored Procedures** (e.g., `sp_GetSessionCalendarData`, `sp_CreateCalendarSchedule`) to maximize execution speeds and maintain database integrity.

---

## Greedy Interval Scheduling & Auto-Assign

The core engine utilizes **Interval Arithmetic** and a **Constraint Satisfaction Problem (CSP)** solver to schedule conflict-free meetings automatically.

![Greedy Interval Scheduling](./media/Greedy%20Interval%20Scheduling.png)

### 1. Mathematical Interval Intersection
To check for time overlaps between classes, manual slots, and scheduled meetings, the system implements 1D Interval Arithmetic. Two time slots overlap ($[S_A, E_A] \cap [S_B, E_B] \neq \emptyset$) if:
$$S_A < E_B \quad \text{and} \quad E_A > S_B$$

### 2. Constraint Satisfaction (CSP)
- **Variables ($X$):** The set of projects needing meeting assignments.
- **Domains ($D$):** Generate candidate time slots matching selected ranges.
- **Constraints ($C$):** Exclude weekends, off-work hours, and lunch hours. No overlaps with the student's class schedule or the availability schedules of the supervisor and examiners.

### 3. Greedy Solver Heuristics
Because scheduling multi-agent appointments is NP-Hard, the AI solver applies a greedy depth-first search approach, checking local availability in chronological order and assigning the first conflict-free slot.

---

## Project Setup

### Recommended IDE Setup
[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Compile and Hot-Reload for Development
1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start Vue Vite Frontend:**
   ```sh
   npm run dev
   ```
3. **Start Express Backend:**
   Go to `server/` directory and run:
   ```sh
   node server.js
   ```
