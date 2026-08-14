import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify the caller's session token server-side
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2. Validate the requested new email
    const { newEmail } = await req.json();
    if (!newEmail || !newEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "A valid new email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const normalizedNewEmail = newEmail.trim().toLowerCase();

    if (normalizedNewEmail === (user.email ?? "").toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "That is already your current email" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // 3. Generate the email-change link (does NOT send anything)
    // Since "Secure email change" is OFF, Supabase only requires confirmation
    // from the NEW email address to finalize the change.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "email_change_new",
      email: user.email,
      newEmail: normalizedNewEmail,
      options: {
        redirectTo: `${Deno.env.get("SITE_URL")}/settings`,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const actionLink = data.properties.action_link;

    // 4. Send it via Brevo with your branded template, to the NEW email
    try {
      await sendBrevoEmail({
        to: normalizedNewEmail,
        toName: user.user_metadata?.full_name ?? "there",
        subject: "Confirm your OneData email change",
        htmlContent: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2986e8;">Confirm your email change</h2>
            <p>Hello,</p>
            <p>We received a request to change the email on your OneData account from <strong>${user.email}</strong> to <strong>${normalizedNewEmail}</strong>.</p>
            <p>Click the button below to confirm this is your new email address and finalize the change. This link expires shortly and can only be used once.</p>
            <a href="${actionLink}"
               style="background: #2986e8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0;">
              Confirm Email Change
            </a>
            <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email and your address will not be changed.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function sendBrevoEmail({ to, toName, subject, htmlContent }) {
  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": Deno.env.get("BREVO_API_KEY"),
    },
    body: JSON.stringify({
      sender: { name: "OneData", email: Deno.env.get("BREVO_SENDER_EMAIL") },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent,
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}