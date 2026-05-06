import mockData from "../../localData/mockData.json";

// Simulated delay to mimic network latency
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * MOCK API SERVICE
 *
 * Once your backend (e.g. Node.js/Express connected to MySQL) is ready,
 * simply swap out these mock functions with real fetch or axios calls.
 *
 * Example for real backend:
 *
 * import axios from 'axios';
 * const API_BASE_URL = 'http://localhost:3000/api';
 *
 * export const getProjects = async () => {
 *   const response = await axios.get(`${API_BASE_URL}/projects`);
 *   return response.data;
 * }
 */

export const apiService = {
  // Users
  getUsers: async () => {
    await delay();
    return mockData.users;
  },

  // Students
  getStudents: async () => {
    await delay();
    return mockData.students;
  },

  // Supervisors
  getSupervisors: async () => {
    await delay();
    return mockData.supervisor;
  },

  // Examiners
  getExaminers: async () => {
    await delay();
    return mockData.examiners;
  },

  // Projects
  getProjects: async () => {
    await delay();
    return mockData.projects;
  },

  getProjectById: async (id) => {
    await delay();
    return mockData.projects.find((p) => p.project_id === parseInt(id));
  },

  // Submissions
  getProjectSubmissions: async (projectId) => {
    await delay();
    return mockData.projects_submissions.filter(
      (sub) => sub.project_id === parseInt(projectId),
    );
  },
};
