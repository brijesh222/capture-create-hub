const ADMIN_EMAIL = "brijeshprajapat52@gmail.com";
const SESSION_KEY = "admin-authenticated";

export function isAdminAllowed(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function setAdminSession() {
  sessionStorage.setItem(SESSION_KEY, "true");
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}
