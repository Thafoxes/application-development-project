/**
 * Checks if a JWT is expired.
 * @param {string} token - The base64url-encoded JWT string.
 * @returns {boolean} True if token is expired or invalid, false otherwise.
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= payload.exp;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return true;
  }
}
