# Database Integration — Implementation Summary

## Overview

This document describes all changes made to fully wire the **FoodRetainAI** frontend to its
Supabase backend. Prior to these changes, five core features operated purely in the browser and
never touched the database. Every feature is now backed by Supabase.

---

## Supabase Project

| Field | Value |
|---|---|
| Project ID | `uogfbedhjmcuwehahknh` |
| Project URL | `https://uogfbedhjmcuwehahknh.supabase.co` |
| Anon key env var | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Service role key env var | `VITE_SUPABASE_SERVICE_KEY` |

---

## Database Schema (tables used)

All tables are created by the migrations in `supabase/migrations/`.

| Table | Purpose |
|---|---|
| `public.profiles` | User accounts (email, name, password_hash) |
| `public.chat_sessions` | One row per chatbot conversation |
| `public.chat_messages` | Individual messages within a session |
| `public.churn_predictions` | Every prediction made in the dashboard |
| `public.password_reset_otps` | Temporary OTP storage for password reset (TTL 10 min) |

---

## Changes Made

### 1. `src/integrations/supabase/types.ts` — Typed DB schema

**Problem:** `types.ts` was auto-generated with empty tables (`[_ in never]: never`). The Supabase
client had no type information for any of the 5 real tables.

**Fix:** Manually added full `Row`, `Insert`, and `Update` types for all 5 tables. Also added the
`message_role` and `churn_result` enum types.

---

### 2. `src/lib/localAuth.ts` — Supabase-backed authentication

**Problem:** All auth (sign-up, sign-in, update password, list users, delete users) used
`localStorage` arrays with plain objects. No data was ever written to Supabase.

**Fix:** Rewrote all functions to be `async` and backed by the `public.profiles` table:

| Function | Before | After |
|---|---|---|
| `signUp` | Push to localStorage array | `supabase.from('profiles').insert(...)` |
| `signIn` | Find in localStorage array | `supabase.from('profiles').select(...).eq('email', ...)` |
| `updatePassword` | Mutate localStorage array | `supabase.from('profiles').update(...)` |
| `getAllUsers` | Return localStorage array | `supabase.from('profiles').select(...)` |
| `deleteUser` | Filter localStorage array | `supabase.from('profiles').delete(...)` |
| `getSession` | Stays synchronous (reads localStorage cache) | Same — cache only |
| `signOut` | Remove from localStorage | Same — clear cache only |

**Session caching:** The logged-in session (`id`, `email`, `name`) is still cached in localStorage
for instant synchronous reads (`getSession()`). It is populated on sign-in and cleared on
sign-out or account deletion.

---

### 3. `src/pages/LoginPage.tsx` — Password reset via Edge Functions

**Problem:** The 3-step "Forgot password?" OTP flow generated OTPs client-side, stored them in
`sessionStorage`, and sent emails via EmailJS. The three Supabase Edge Functions designed for this
flow (`send-reset-email`, `verify-reset-otp`, `update-password`) were completely unused.
`signIn`/`signUp` calls were not `await`-ed (the functions became async but callers weren't updated).

**Fix:**

- Removed `emailjs` import.
- Added `SUPABASE_FUNCTIONS_URL` and `ANON_KEY` constants from `import.meta.env`.
- **Step 1 (`handleSendOtp`):** Now calls `send-reset-email` Edge Function → generates OTP
  server-side, stores in `password_reset_otps`, and sends email via Resend.
- **Step 2 (`handleVerifyOtp`):** Now calls `verify-reset-otp` Edge Function → validates OTP
  from DB (checks expiry), deletes it on success (single use).
- **Step 3 (`handleUpdatePassword`):** Now `await`s `updatePassword(email, newPassword)` which
  writes to `public.profiles` via the Supabase client.
- `handleSubmit`: Added `await` to `signUp(...)` and `signIn(...)`.

---

### 4. `src/pages/DashboardPage.tsx` — Async account management

**Problem:** `getAllUsers()` and `deleteUser()` became async in `localAuth.ts` but their callers
in `DashboardPage` were still synchronous.

**Fix:**

- `refreshAccounts` useCallback converted to `async () => { const users = await getAllUsers(); setAccounts(users); }`.
- Delete action `onClick` handler converted to `async` with `await deleteUser(...)`.

---

### 5. `src/pages/ChatbotPage.tsx` — Persistent chat history

**Problem:** All chat messages were stored only in React state. Refreshing the page lost the
entire conversation. The `chat_sessions` and `chat_messages` tables in DB were never used.

**Fix:**

- Added imports: `supabase` and `getSession`.
- Added `sessionIdRef = useRef<string | null>(null)` to hold the DB session ID.
- Added `useEffect` on mount that inserts a new row into `chat_sessions` and stores the
  returned `id` in `sessionIdRef`.
- Modified the `onDone` callback in `sendMessage` to insert both the user message and the
  completed AI response into `chat_messages` (fire-and-forget, errors logged to console).

**Message persistence flow:**
```
User sends message
  → React state updated immediately (no latency to user)
  → streamChat() runs (SSE stream from Edge Function)
  → onDone fires when AI finishes
    → supabase.from('chat_messages').insert([userMsg, aiMsg])
```

---

### 6. `src/components/PredictionForm.tsx` — Predictions saved to DB

**Problem:** `predictChurn()` ran purely client-side. Results were shown in the UI but never
persisted. The `churn_predictions` table was never written to.

**Fix:**

- Added imports: `supabase` and `getSession`.
- After `setResult(res)`, calls `supabase.from('churn_predictions').insert(...)` with:
  - `user_email` from active session
  - `order_frequency`, `price`, `rating`, `loyalty_points` from form inputs
  - `prediction` mapped from `riskLevel`: `'LOW' → 'Active'`, otherwise `'Inactive'`
  - `confidence` from prediction result
  - `model_used: 'Rule-Based Ensemble'`

---

### 7. `src/pages/ResetPasswordPage.tsx` — Removed broken Supabase Auth dependency

**Problem:** This page used `supabase.auth.onAuthStateChange` waiting for a `PASSWORD_RECOVERY`
event. Since the app uses local auth (not Supabase Auth), this event never fires. The page would
show a spinning loader indefinitely.

**Fix:** Replaced the page with a clean redirect component that:
- Explains that password reset is handled via the "Forgot password?" dialog on the Login page.
- Auto-redirects to `/login` after 4 seconds.
- Shows a "Go to Sign In" button for immediate navigation.

---

## Edge Functions

All Edge Functions live in `supabase/functions/` and are deployed to the Supabase project.

| Function | Route | Description | Env vars required |
|---|---|---|---|
| `chat` | `/functions/v1/chat` | Streams AI responses via OpenAI GPT-4o-mini | `OPENAI_API_KEY` |
| `send-reset-email` | `/functions/v1/send-reset-email` | Generate + store OTP, send email via Resend | `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `verify-reset-otp` | `/functions/v1/verify-reset-otp` | Validate OTP from DB, delete on success | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `update-password` | `/functions/v1/update-password` | Update password via Supabase Auth Admin API | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

> **Note:** `update-password` targets **Supabase Auth** users (not the `profiles` table).
> For the local-auth flow, password updates go through `localAuth.updatePassword()` which
> writes directly to `public.profiles` via the anon client. The `update-password` Edge Function
> is kept for future Supabase Auth migration compatibility.

---

## Environment Variables Required

Set these in `.env` (already present and configured):

```env
VITE_SUPABASE_PROJECT_ID="uogfbedhjmcuwehahknh"
VITE_SUPABASE_URL="https://uogfbedhjmcuwehahknh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
VITE_SUPABASE_SERVICE_KEY="<service role key>"
```

Set these as **Supabase Edge Function secrets** (via Dashboard → Edge Functions → Secrets):

```
OPENAI_API_KEY=<your OpenAI key>
RESEND_API_KEY=<your Resend key>
```

---

## Data Flow Diagram

```
Browser                         Supabase (cloud)
───────                         ────────────────

Sign Up ──────────────────────► profiles (INSERT)
Sign In ──────────────────────► profiles (SELECT + compare)
Session ─── localStorage cache (synchronous reads)

Forgot Password:
  Step 1: Send OTP ────────────► send-reset-email (Edge Fn)
                                   └─► password_reset_otps (UPSERT)
                                   └─► Resend API (email)
  Step 2: Verify OTP ──────────► verify-reset-otp (Edge Fn)
                                   └─► password_reset_otps (SELECT + DELETE)
  Step 3: New Password ────────► profiles (UPDATE via supabase client)

Chat:
  Mount ───────────────────────► chat_sessions (INSERT → get id)
  Send/Receive ────────────────► chat (Edge Fn → OpenAI stream)
  onDone ──────────────────────► chat_messages (INSERT user + assistant)

Predict Churn:
  Local computation ──────────► (no network)
  After result ───────────────► churn_predictions (INSERT)

Admin (Dashboard):
  List users ──────────────────► profiles (SELECT)
  Delete user ─────────────────► profiles (DELETE)
```

---

## Migration Notes

Run migrations in order via Supabase Dashboard → SQL Editor:

1. `20260303000000_password_reset_otps.sql` — OTP table + RLS
2. `20260304000000_initial_schema.sql` — All other tables + RLS policies

RLS is configured with permissive `anon` policies (suitable for demo/dev). Tighten these
when moving to production by switching to Supabase Auth and user-scoped policies.
