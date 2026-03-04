// Supabase-backed auth — profiles are stored in the `profiles` DB table.
// Session (logged-in user info) is cached in localStorage for instant synchronous reads.

import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'localAuth_session';

export interface LocalUser {
  id: string;
  email: string;
  password: string; // password_hash field (plain text in demo)
  name: string;
  createdAt: string;
}

export interface LocalSession {
  id: string;
  email: string;
  name: string;
}

// ── Session helpers (synchronous, localStorage-only) ─────────────────────────

/**
 * Switches the active session to another registered account.
 * Accepts the user object directly (already loaded from DB by the caller).
 */
export function switchAccount(user: Pick<LocalUser, 'id' | 'email' | 'name'>): { error: string | null } {
  const session: LocalSession = { id: user.id, email: user.email, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { error: null };
}

export function getSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── Auth (async, Supabase-backed) ────────────────────────────────────────────

/** Create a new account. Stores the profile in the `profiles` table. */
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ error: string | null }> {
  const normalised = email.toLowerCase().trim();

  // Check for existing account first
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalised)
    .maybeSingle();

  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const { error } = await supabase
    .from('profiles')
    .insert({ email: normalised, name: name.trim(), password_hash: password });

  if (error) return { error: error.message };
  return { error: null };
}

/** Sign in: validates credentials against the `profiles` table. */
export async function signIn(
  email: string,
  password: string,
): Promise<{ user: LocalSession | null; error: string | null }> {
  const normalised = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, password_hash')
    .eq('email', normalised)
    .maybeSingle();

  if (error) return { user: null, error: error.message };
  if (!data) return { user: null, error: 'No account found with this email.' };
  if (data.password_hash !== password) return { user: null, error: 'Incorrect password.' };

  const session: LocalSession = { id: data.id, email: data.email, name: data.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session, error: null };
}

/** Update password in the `profiles` table. */
export async function updatePassword(
  email: string,
  newPassword: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ password_hash: newPassword })
    .eq('email', email.toLowerCase().trim());

  if (error) return { error: error.message };
  return { error: null };
}

// ── Admin helpers (async, Supabase-backed) ────────────────────────────────────

/** Returns every registered account (for the admin accounts panel). */
export async function getAllUsers(): Promise<LocalUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, password_hash, created_at')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password_hash,
    createdAt: u.created_at,
  }));
}

/**
 * Permanently deletes a user account from the database.
 * Also clears the session if the deleted account is currently logged-in.
 */
export async function deleteUser(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('email', email.toLowerCase().trim());

  if (error) return { error: error.message };

  // Clear session if deleted account is active
  const session = getSession();
  if (session?.email.toLowerCase() === email.toLowerCase()) {
    localStorage.removeItem(SESSION_KEY);
  }
  return { error: null };
}
