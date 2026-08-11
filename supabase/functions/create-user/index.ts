import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const roleMap = {
  "Division Focal Person": "division_focal",
  "Section Officer": "section_focal",
  "Section Personnel": "section_personnel",
  "Administrator": "administrator",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, division_id, section_id, role, idNumber } = await req.json();
    const mappedRole = roleMap[role] ?? role;
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role: mappedRole, id_number: idNumber },
    });
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: corsHeaders,
      });
    }

    // 2. Insert into users table
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      full_name,
      email,
      id_number: idNumber,
      role: mappedRole,
      division_id,
      section_id,
      is_active: true,
      must_change_password: true,
    });
    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 400, headers: corsHeaders,
      });
    }

    // 3. Send email via Brevo REST API
    try {
      await sendBrevoEmail({
        to: email,
        toName: full_name,
        subject: "Your OneData Account Has Been Created",
        htmlContent: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2986e8;">Welcome to OneData!</h2>
            <p>Hello <strong>${full_name}</strong>,</p>
            <p>Your account has been created by the administrator. Here are your login credentials:</p>
            <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p>Please log in and change your password immediately.</p>
            <a href="${Deno.env.get("SITE_URL")}/login"
               style="background: #2986e8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Log In Now
            </a>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, email }), {
      status: 200, headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500, headers: corsHeaders,
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};