/**
 * Fire-and-forget deactivation email via the `send-deactivation-email`
 * edge function. Never throws — a failed email must not block or roll
 * back the deactivation itself.
 */
export async function notifyDeactivation({ email, full_name, reason, detail }) {
  if (!email) return;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-deactivation-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, full_name, reason, detail }),
      },
    );
    if (!res.ok) {
      console.error("Deactivation email failed:", await res.text());
    }
  } catch (err) {
    console.error("Deactivation email failed:", err);
  }
}
