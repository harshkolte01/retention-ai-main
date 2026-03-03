import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Supabase DB (we'll use a simple KV via supabase-js)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Upsert OTP into a temporary table
    const storeRes = await fetch(`${supabaseUrl}/rest/v1/password_reset_otps`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        email,
        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      }),
    });

    if (!storeRes.ok) {
      const err = await storeRes.text();
      throw new Error(`Failed to store OTP: ${err}`);
    }

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FoodRetainAI <onboarding@resend.dev>",
        to: [email],
        subject: "Your Password Reset Code – FoodRetainAI",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 40px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; color: #111;">Reset your password</h2>
            <p style="color: #6b7280; margin: 0 0 28px;">Use the verification code below to reset your FoodRetainAI password. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; background: #fff7ed; border: 2px dashed #f97316; border-radius: 10px; padding: 24px; margin: 0 0 28px;">
              <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #ea580c;">${otp}</span>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
