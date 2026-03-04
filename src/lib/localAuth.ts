// Local storage-based auth — no backend required
// Users and sessions are stored in the browser's localStorage

const USERS_KEY = 'localAuth_users';
const SESSION_KEY = 'localAuth_session';

export interface LocalUser {
  id: string;
  email: string;
  password: string; // stored as-is (demo only)
  name: string;
  createdAt: string;
}

export interface LocalSession {
  id: string;
  email: string;
  name: string;
}

function getUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signUp(
  email: string,
  password: string,
  name: string
): { error: string | null } {
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }
  const newUser: LocalUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password,
    name,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { error: null };
}

export function signIn(
  email: string,
  password: string
): { user: LocalSession | null; error: string | null } {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { user: null, error: 'No account found with this email.' };
  }
  if (user.password !== password) {
    return { user: null, error: 'Incorrect password.' };
  }
  const session: LocalSession = { id: user.id, email: user.email, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session, error: null };
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

export function updatePassword(
  email: string,
  newPassword: string
): { error: string | null } {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) {
    return { error: 'No account found with this email.' };
  }
  users[idx].password = newPassword;
  saveUsers(users);
  return { error: null };
}

/** Returns every registered account (for the accounts panel on the login page). */
export function getAllUsers(): LocalUser[] {
  return getUsers();
}

/**
 * Permanently deletes a user account.
 * Also signs them out if they are the current session user.
 */
export function deleteUser(email: string): { error: string | null } {
  const users = getUsers();
  const newUsers = users.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
  if (newUsers.length === users.length) {
    return { error: 'No account found with this email.' };
  }
  saveUsers(newUsers);
  // If the deleted account is currently logged-in, clear the session
  const session = localStorage.getItem(SESSION_KEY);
  if (session) {
    try {
      const parsed = JSON.parse(session) as LocalSession;
      if (parsed.email.toLowerCase() === email.toLowerCase()) {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch { /* ignore */ }
  }
  return { error: null };
}
