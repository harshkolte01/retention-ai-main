type ChatMessage = { role: string; content: string };

function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) throw new Error("VITE_SUPABASE_URL is not configured");
  return url;
}

function getAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!key) throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY is not configured");
  return key;
}

function getFunctionUrl(functionName: string): string {
  return `${getSupabaseUrl()}/functions/v1/${functionName}`;
}

function getFunctionHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAnonKey()}`,
  };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors and use fallback
  }
  return fallback;
}

export async function sendResetEmail(email: string): Promise<void> {
  const response = await fetch(getFunctionUrl("send-reset-email"), {
    method: "POST",
    headers: getFunctionHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to send reset email"));
  }
}

export async function verifyResetOtp(email: string, otp: string): Promise<void> {
  const response = await fetch(getFunctionUrl("verify-reset-otp"), {
    method: "POST",
    headers: getFunctionHeaders(),
    body: JSON.stringify({ email, otp }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Invalid code"));
  }
}

export async function updatePasswordViaEdgeFunction(email: string, newPassword: string): Promise<void> {
  const response = await fetch(getFunctionUrl("update-password"), {
    method: "POST",
    headers: getFunctionHeaders(),
    body: JSON.stringify({ email, newPassword }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to update password"));
  }
}

export async function createChatCompletionStream(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(getFunctionUrl("chat"), {
    method: "POST",
    headers: getFunctionHeaders(),
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `HTTP ${response.status}`));
  }
  if (!response.body) {
    throw new Error("No response body");
  }

  return response.body;
}
