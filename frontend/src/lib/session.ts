const TOKEN_KEY = 'chollomax_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function parseTokenPayload(token) {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event('auth-changed'));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('auth-changed'));
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getSessionUser() {
  const token = getToken();
  if (!token) return null;
  return parseTokenPayload(token);
}

export function isAdmin() {
  return getSessionUser()?.role === 'admin';
}
