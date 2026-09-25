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
    const { email, full_name, reason, detail } = await req.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const isSecurity = reason === "security";
    const name = full_name ?? "there";
    const subject = isSecurity
      ? "Your OneData account has been locked"
      : "Your OneData account has been deactivated";
    const heading = isSecurity
      ? "Your account has been locked for your protection"
      : "Your OneData account has been deactivated";
    const preheader = isSecurity
      ? "Your OneData account was locked after too many failed login attempts."
      : "Your OneData account has been deactivated by your administrator.";
    const intro = isSecurity
      ? "We detected too many failed login attempts on your account, so it has been temporarily locked as a security precaution. No further sign-ins are possible until an administrator reactivates it."
      : "Your administrator has deactivated your account. You will not be able to sign in until it is reactivated.";
    const closing = isSecurity
      ? "If this wasn't you, please tell your administrator immediately so they can secure your account."
      : "If you believe this was done in error, please contact your administrator for clarification.";
    const reasonRow = !isSecurity && detail?.trim()
      ? `
          <tr>
            <td style="font-size:11px; color:#9aa5b8; text-transform:uppercase; letter-spacing:0.6px; padding-bottom:5px; padding-top:12px;">Reason given</td>
          </tr>
          <tr>
            <td style="font-size:14px; color:#1c3d5a; font-weight:600;">${escapeHtml(detail.trim())}</td>
          </tr>`
      : "";

    try {
      await sendBrevoEmail({
        to: email,
        toName: name,
        subject,
        htmlContent: `
          <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${preheader}
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
                    <img src="https://img.icons8.com/ios-filled/50/4B86EC/shield.png" alt="" width="26" height="26" style="display:block;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 40px 0 40px;">
              <h1 style="margin:0; font-size:24px; line-height:30px; color:#1c3d5a; font-weight:700; letter-spacing:-0.3px;">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td align="center" style="padding:16px 48px 0 48px; font-size:15px; line-height:24px; color:#5b6b85;">
              <p style="margin:0 0 16px 0;">Hello <strong style="color:#1c3d5a;">${escapeHtml(name)}</strong>,</p>
              <p style="margin:0 0 20px 0;">
                ${intro}
              </p>
            </td>
          </tr>

          <!-- Account summary -->
          <tr>
            <td style="padding:0 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f7f9fc 0%,#f2f6fb 100%); border-radius:14px; border:1px solid #eef1f6;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:11px; color:#9aa5b8; text-transform:uppercase; letter-spacing:0.6px; padding-bottom:5px;">Account</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px; color:#1c3d5a; font-weight:600; padding-bottom:12px;">${escapeHtml(email)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:11px; color:#9aa5b8; text-transform:uppercase; letter-spacing:0.6px; padding-bottom:5px;">Status</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px; color:#1c3d5a; font-weight:600;">Deactivated</td>
                      </tr>${reasonRow}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What to do next -->
          <tr>
            <td align="center" style="padding:20px 48px 0 48px; font-size:15px; line-height:24px; color:#5b6b85;">
              <p style="margin:0;">
                <strong style="color:#1c3d5a;">What to do next:</strong> please contact your administrator
                to verify your identity and request reactivation of your account.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <div style="border-top:1px solid #eef1f6;"></div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:20px 40px 40px 40px; font-size:13px; line-height:20px; color:#9aa5b8;">
              ${closing}
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

    // Best-effort audit trail (never blocks the response)
    try {
      await supabaseAdmin.from("audit_logs").insert({
        action: "Other",
        file_name: name,
        details: `Sent account-deactivation email to ${email} (${isSecurity ? "security lockout" : "administrator action"}).`,
        performed_by: "System",
        role: "System",
        status: "Success",
      });
    } catch (auditError) {
      console.error("Audit log insert failed:", auditError);
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
