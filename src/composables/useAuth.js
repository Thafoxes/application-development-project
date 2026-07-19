import { ref } from 'vue'

// Initialize user state from local storage if it exists
const user = ref(JSON.parse(localStorage.getItem('userSession')) || null)
const token = ref(localStorage.getItem('token') || null)

// Helper to determine initial default role from user flags
const getDefaultRole = (userData) => {
  if (!userData) return 'student'
  if (Number(userData.is_coordinator) === 1) return 'coordinator'
  if (Number(userData.is_supervisor) === 1) return 'supervisor'
  if (Number(userData.is_examiner) === 1) return 'examiner'
  return 'student'
}

const activeRole = ref(localStorage.getItem('activeRole') || getDefaultRole(user.value))

export function useAuth() {
  const login = (userData, authToken) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('userSession', JSON.stringify(userData))
    localStorage.setItem('token', authToken)
    
    // Automatically set default active role on login
    const defRole = getDefaultRole(userData)
    activeRole.value = defRole
    localStorage.setItem('activeRole', defRole)
  }

  const logout = () => {
    user.value = null
    token.value = null
    activeRole.value = 'student'
    localStorage.removeItem('userSession')
    localStorage.removeItem('token')
    localStorage.removeItem('activeRole')
  }

  const switchRole = (role) => {
    activeRole.value = role
    localStorage.setItem('activeRole', role)
  }

  return {
    user,
    token,
    activeRole,
    switchRole,
    login,
    logout,
  }
}
