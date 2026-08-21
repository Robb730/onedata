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
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Generate the recovery link (does NOT send anything)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${Deno.env.get("SITE_URL")}/change-password`,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const actionLink = data.properties.action_link;

    // 2. Send it via Brevo with your branded template
    try {
      await sendBrevoEmail({
        to: email,
        toName: data.user?.user_metadata?.full_name ?? "there",
        subject: "Reset your OneData password",
        htmlContent: `
         <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset your OneData password</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Reset your OneData password — this link expires shortly and can only be used once.
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
                    <img src="https://img.icons8.com/ios-filled/50/4B86EC/lock--v1.png" alt="" width="26" height="26" style="display:block;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 40px 0 40px;">
              <h1 style="margin:0; font-size:24px; line-height:30px; color:#1c3d5a; font-weight:700; letter-spacing:-0.3px;">
                Reset your password
              </h1>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td align="center" style="padding:16px 48px 0 48px; font-size:15px; line-height:24px; color:#5b6b85;">
              <p style="margin:0 0 16px 0;">Hello,</p>
              <p style="margin:0;">
                We received a request to reset the password for your OneData account.
                Click the button below to choose a new one. For your security, this link
                expires shortly and can only be used once.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:32px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:10px; background:linear-gradient(135deg,#4B86EC 0%,#3EBA8F 100%); box-shadow:0 4px 14px rgba(75,134,236,0.35);">
                    <a href="${actionLink}"
                       target="_blank"
                       style="display:inline-block; padding:15px 40px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td align="center" style="padding:12px 40px 0 40px; font-size:13px; color:#9aa5b8;">
              This link will expire soon.
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
                <a href="${actionLink}" style="color:#4B86EC; text-decoration:underline;">${actionLink}</a>
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:20px 40px 40px 40px; font-size:13px; line-height:20px; color:#9aa5b8;">
              If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
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