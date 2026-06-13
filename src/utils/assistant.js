const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Calls the backend AI endpoint to suggest a supervisor based on the full FYP details.
 * @param {Object} project - The full FYP project details object.
 * @param {Array} candidates - The list of supervisor candidates.
 * @returns {Promise<Object>} The recommendation object containing score, reason, and suggested_user_id.
 */
export async function getAISuggestedSupervisor(project, candidates) {
  const response = await fetch(`${API_BASE_URL}/api/assistant/suggest-supervisor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project: {
        projectTitle: project.projectTitle || project.title || '',
        title: project.projectTitle || project.title || '',
        abstract: project.abstract || '',
        keywords: project.keywords || '',
        projectType: project.projectType || 'System Development',
        examiners: project.examiners || []
      },
      candidates: candidates
    })
  });

  const data = await response.json();
  if (response.ok && data.success && data.recommendations) {
    return data.recommendations;
  }
  throw new Error(data.error || 'Failed to get AI recommendation');
}
