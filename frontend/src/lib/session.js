const TOKEN_KEY = 'chollomax_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
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
