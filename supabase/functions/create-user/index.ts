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
          <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to OneData</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your OneData account is ready — here are your login credentials.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f8; padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(22,55,110,0.10);">

          <!-- Header / Logo band -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#4B86EC 0%,#3EBA8F 100%); padding:36px 24px 32px 24px;">
              <img src="https://res.cloudinary.com/i69ovpaw/image/upload/v1787056891/Frame_26.svg"
                   alt="OneData"
                   width="96"
                   style="display:block; max-width:96px; height:auto; border:0;" />
            </td>
          </tr>

          <!-- Icon + Heading -->
          <tr>
            <td align="center" style="padding:44px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="64" height="64" style="background:linear-gradient(135deg,#eaf1fd 0%,#e8f6f1 100%); border-radius:50%;">
                <tr>
                  <td align="center" valign="middle" style="width:64px; height:64px;">
                    <img src="https://img.icons8.com/ios-filled/50/4B86EC/user-male-circle.png" alt="" width="26" height="26" style="display:block;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 40px 0 40px;">
              <h1 style="margin:0; font-size:24px; line-height:30px; color:#1c3d5a; font-weight:700; letter-spacing:-0.3px;">
                Welcome to OneData!
              </h1>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td align="center" style="padding:16px 48px 0 48px; font-size:15px; line-height:24px; color:#5b6b85;">
              <p style="margin:0 0 16px 0;">Hello <strong style="color:#1c3d5a;">${full_name}</strong>,</p>
              <p style="margin:0 0 20px 0;">
                Your account has been created by the administrator. Here are your login credentials:
              </p>
            </td>
          </tr>

          <!-- Credentials card -->
          <tr>
            <td style="padding:0 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f7f9fc 0%,#f2f6fb 100%); border-radius:14px; border:1px solid #eef1f6;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:11px; color:#9aa5b8; text-transform:uppercase; letter-spacing:0.6px; padding-bottom:5px;">Email</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px; color:#1c3d5a; font-weight:600; padding-bottom:14px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="font-size:11px; color:#9aa5b8; text-transform:uppercase; letter-spacing:0.6px; padding-bottom:5px;">Temporary Password</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px; color:#1c3d5a; font-weight:600; font-family: 'Courier New', monospace;">${tempPassword}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body copy continued -->
          <tr>
            <td align="center" style="padding:20px 48px 0 48px; font-size:15px; line-height:24px; color:#5b6b85;">
              <p style="margin:0;">
                For your security, please log in and change your password immediately.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:32px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:10px; background:linear-gradient(135deg,#4B86EC 0%,#3EBA8F 100%); box-shadow:0 4px 14px rgba(75,134,236,0.35);">
                    <a href="${Deno.env.get("SITE_URL")}/login"
                       target="_blank"
                       style="display:inline-block; padding:15px 40px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                      Log In Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td align="center" style="padding:12px 40px 0 40px; font-size:13px; color:#9aa5b8;">
              Keep your temporary password confidential.
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <div style="border-top:1px solid #eef1f6;"></div>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:24px 40px 0 40px; font-size:13px; line-height:20px; color:#9aa5b8;">
              <p style="margin:0 0 8px 0;">Button not working? Copy and paste this link into your browser:</p>
              <p style="margin:0; word-break:break-all;">
                <a href="${Deno.env.get("SITE_URL")}/login" style="color:#4B86EC; text-decoration:underline;">${Deno.env.get("SITE_URL")}/login</a>
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:20px 40px 40px 40px; font-size:13px; line-height:20px; color:#9aa5b8;">
              If you weren't expecting this account, please contact your administrator.
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f7f9fc; padding:22px 40px; border-top:1px solid #eef1f6;">
              <p style="margin:0; font-size:12px; line-height:18px; color:#b3bccb;">
                &copy; 2026 OneData. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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