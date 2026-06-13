const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Calls the backend AI endpoint to suggest a supervisor based on the FYP title.
 * @param {string} fypTitle - The title of the FYP project.
 * @param {Array} candidates - The list of supervisor candidates.
 * @returns {Promise<Object>} The recommendation recommendation object containing score, reason, and suggested_user_id.
 */
export async function getAISuggestedSupervisor(fypTitle, candidates) {
  const response = await fetch(`${API_BASE_URL}/api/assistant/suggest-supervisor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project: {
        projectTitle: fypTitle,
        title: fypTitle,
        abstract: '',
        keywords: '',
        projectType: 'System Development',
        examiners: []
      },
      candidates: candidates
    })
  });

  const data = await response.json();
  if (response.ok && data.success && data.recommendation) {
    return data.recommendation;
  }
  throw new Error(data.error || 'Failed to get AI recommendation');
}
