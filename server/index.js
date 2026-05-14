/* eslint-disable no-undef */
import express from "express";
import { createClient } from "@supabase/supabase-js";
import SibApiV3Sdk from "sib-api-v3-sdk";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const brevoApiKey = SibApiV3Sdk.ApiClient.instance.authentications["api-key"];
brevoApiKey.apiKey = process.env.BREVO_API_KEY;
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

app.post("/api/create-user", async (req, res) => {
  const { email, full_name, division_id, section_id, role, idNumber } = req.body;

  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";

  const roleMap = {
    "Division Focal Person": "division_focal",
    "Section Officer":       "section_focal",
    "Section Personnel":     "section_personnel",
    "Administrator":         "administrator",
  }
  const mappedRole = roleMap[role] ?? role

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, role: mappedRole, id_number: idNumber },
  });

  if (authError) return res.status(400).json({ error: authError.message });

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
  });

  if (dbError) return res.status(400).json({ error: dbError.message });

  // 3. Send email
  try {
    await brevoClient.sendTransacEmail({
      subject: "Your OneData Account Has Been Created",
      to: [{ email, name: full_name }],
      sender: { name: "OneData", email: process.env.BREVO_SENDER_EMAIL },
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2986e8;">Welcome to OneData!</h2>
          <p>Hello <strong>${full_name}</strong>,</p>
          <p>Your account has been created by the administrator. Here are your login credentials:</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p>Please log in and change your password immediately.</p>
          <a href="${process.env.SITE_URL}/login"
             style="background: #2986e8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Log In Now
          </a>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            If you did not expect this email, please contact your administrator.
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Email error:", emailError);
    return res.status(500).json({ error: "Failed to send email" });
  }

  // 4. Respond
  res.json({ success: true, email });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));