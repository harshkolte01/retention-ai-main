import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  deleteUser,
  getAllUsers,
  getSession,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "@/lib/localAuth";
import {
  createChatCompletionStream,
  sendResetEmail,
  updatePasswordViaEdgeFunction,
  verifyResetOtp,
} from "@/lib/supabaseFunctions";

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

const db = {
  profiles: [] as ProfileRow[],
  nextId: 1,
};

function nowIso(): string {
  return new Date().toISOString();
}

function pickColumns(row: ProfileRow, columns: string): Record<string, unknown> {
  const keys = columns
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  if (keys.length === 0 || (keys.length === 1 && keys[0] === "*")) {
    return { ...row };
  }

  const selected: Record<string, unknown> = {};
  for (const key of keys) {
    selected[key] = (row as Record<string, unknown>)[key];
  }
  return selected;
}

function buildProfilesTableMock() {
  return {
    select(columns: string) {
      return {
        eq(field: keyof ProfileRow, value: string) {
          return {
            async maybeSingle() {
              const row = db.profiles.find(
                (profile) => String(profile[field]).toLowerCase() === String(value).toLowerCase(),
              );
              return { data: row ? pickColumns(row, columns) : null, error: null };
            },
          };
        },
        async order(field: keyof ProfileRow, opts: { ascending: boolean }) {
          const rows = [...db.profiles].sort((a, b) => {
            const left = String(a[field]);
            const right = String(b[field]);
            return opts.ascending ? left.localeCompare(right) : right.localeCompare(left);
          });
          return { data: rows.map((row) => pickColumns(row, columns)), error: null };
        },
      };
    },
    async insert(payload: {
      email: string;
      name?: string;
      password_hash?: string;
    }) {
      const exists = db.profiles.some(
        (profile) => profile.email.toLowerCase() === payload.email.toLowerCase(),
      );
      if (exists) {
        return {
          data: null,
          error: { message: "duplicate key value violates unique constraint profiles_email_key" },
        };
      }

      db.profiles.push({
        id: `profile-${db.nextId++}`,
        email: payload.email,
        name: payload.name ?? "",
        password_hash: payload.password_hash ?? "",
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      return { data: null, error: null };
    },
    update(values: Partial<ProfileRow>) {
      return {
        async eq(field: keyof ProfileRow, value: string) {
          db.profiles = db.profiles.map((profile) => {
            if (String(profile[field]).toLowerCase() !== String(value).toLowerCase()) return profile;
            return {
              ...profile,
              ...values,
              updated_at: nowIso(),
            };
          });
          return { data: null, error: null };
        },
      };
    },
    delete() {
      return {
        async eq(field: keyof ProfileRow, value: string) {
          db.profiles = db.profiles.filter(
            (profile) => String(profile[field]).toLowerCase() !== String(value).toLowerCase(),
          );
          return { data: null, error: null };
        },
      };
    },
  };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from(table: string) {
      if (table !== "profiles") {
        throw new Error(`Unsupported table in test mock: ${table}`);
      }
      return buildProfilesTableMock();
    },
  },
}));

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sseResponse(chunks: string[]): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("database setup and endpoint integration contracts", () => {
  beforeEach(() => {
    db.profiles = [];
    db.nextId = 1;
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("creates an account, validates DB-backed auth flow, and checks all edge endpoints", async () => {
    const email = "qa-user@example.com";
    const initialPassword = "pass1234";
    const updatedPassword = "newpass123";

    const signUpResult = await signUp(email, initialPassword, "QA User");
    expect(signUpResult.error).toBeNull();

    const duplicateSignUpResult = await signUp(email, initialPassword, "QA User");
    expect(duplicateSignUpResult.error).toContain("already exists");

    const wrongLogin = await signIn(email, "bad-password");
    expect(wrongLogin.error).toBe("Incorrect password.");

    const loginResult = await signIn(email, initialPassword);
    expect(loginResult.error).toBeNull();
    expect(loginResult.user?.email).toBe(email);
    expect(getSession()?.email).toBe(email);

    const listResult = await getAllUsers();
    expect(listResult).toHaveLength(1);
    expect(listResult[0].email).toBe(email);

    const passwordUpdate = await updatePassword(email, updatedPassword);
    expect(passwordUpdate.error).toBeNull();

    signOut();
    expect(getSession()).toBeNull();

    const oldPasswordLogin = await signIn(email, initialPassword);
    expect(oldPasswordLogin.error).toBe("Incorrect password.");

    const updatedPasswordLogin = await signIn(email, updatedPassword);
    expect(updatedPasswordLogin.error).toBeNull();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(
        sseResponse([
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
          "data: [DONE]\n",
        ]),
      );

    await sendResetEmail(email);
    await verifyResetOtp(email, "123456");
    await updatePasswordViaEdgeFunction(email, "edge-pass-123");
    const chatStream = await createChatCompletionStream([{ role: "user", content: "Hi" }]);

    const reader = chatStream.getReader();
    const decoder = new TextDecoder();
    let streamedText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamedText += decoder.decode(value, { stream: true });
    }
    expect(streamedText).toContain("data: [DONE]");

    expect(fetchMock).toHaveBeenCalledTimes(4);

    const sendResetCall = fetchMock.mock.calls[0];
    expect(String(sendResetCall[0])).toMatch(/\/functions\/v1\/send-reset-email$/);
    expect((sendResetCall[1] as RequestInit).method).toBe("POST");
    expect((sendResetCall[1] as RequestInit).headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: expect.stringMatching(/^Bearer\s.+/),
      }),
    );
    expect(JSON.parse(String((sendResetCall[1] as RequestInit).body))).toEqual({ email });

    const verifyCall = fetchMock.mock.calls[1];
    expect(String(verifyCall[0])).toMatch(/\/functions\/v1\/verify-reset-otp$/);
    expect(JSON.parse(String((verifyCall[1] as RequestInit).body))).toEqual({
      email,
      otp: "123456",
    });

    const updatePwCall = fetchMock.mock.calls[2];
    expect(String(updatePwCall[0])).toMatch(/\/functions\/v1\/update-password$/);
    expect(JSON.parse(String((updatePwCall[1] as RequestInit).body))).toEqual({
      email,
      newPassword: "edge-pass-123",
    });

    const chatCall = fetchMock.mock.calls[3];
    expect(String(chatCall[0])).toMatch(/\/functions\/v1\/chat$/);
    expect(JSON.parse(String((chatCall[1] as RequestInit).body))).toEqual({
      messages: [{ role: "user", content: "Hi" }],
    });

    const deleteResult = await deleteUser(email);
    expect(deleteResult.error).toBeNull();
    expect(getSession()).toBeNull();
    expect(await getAllUsers()).toHaveLength(0);
  });
});
