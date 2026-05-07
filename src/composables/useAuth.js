import { ref } from 'vue'

// Initialize user state from local storage if it exists
const user = ref(JSON.parse(localStorage.getItem('userSession')) || null)

export function useAuth() {
  const login = (userData) => {
    user.value = userData
    localStorage.setItem('userSession', JSON.stringify(userData))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('userSession')
  }

  return {
    user,
    login,
    logout
  }
}
