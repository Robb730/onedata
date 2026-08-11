import { supabase } from "../lib/supabaseClient";

/**
 * Resolves recipient user IDs for a given section/division scope.
 *
 * - section_id present  -> section_focal + section_personnel in that section,
 *                           PLUS division_focal(s) for that section's division.
 * - section_id absent, division_id present -> division_focal(s) for that division only.
 */
export async function resolveRecipients({ sectionId, divisionId, excludeUserId }) {
  const recipientIds = new Set();

  if (sectionId) {
    const { data: sectionUsers, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("section_id", sectionId)
      .in("role", ["section_focal", "section_personnel"]);
    if (error) console.error("resolveRecipients (section) failed:", error);
    (sectionUsers || []).forEach((u) => recipientIds.add(u.id));
  }

  if (divisionId) {
    const { data: divisionFocals, error } = await supabase
      .from("users")
      .select("id")
      .eq("division_id", divisionId)
      .eq("role", "division_focal");
    if (error) console.error("resolveRecipients (division) failed:", error);
    (divisionFocals || []).forEach((u) => recipientIds.add(u.id));
  }

  if (excludeUserId) recipientIds.delete(excludeUserId);
  return [...recipientIds];
}

/**
 * Inserts one notification row per recipient. Silently no-ops if
 * recipientIds is empty so callers don't need to guard for that.
 */
export async function pushNotification({
  recipientIds,
  type,
  title,
  content,
  meta = {},
}) {
  if (!recipientIds || recipientIds.length === 0) return;

  const rows = recipientIds.map((recipient_id) => ({
    recipient_id,
    type,
    title,
    content,
    is_read: false,
    ...meta, // e.g. { related_file_id, section_id, division_id, uploaded_by }
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) {
  console.error("pushNotification failed:", error.message, error.code, error.details, error.hint);
}
}

/** Convenience wrapper: resolve + push in one call. */
export async function notifyScope({
  sectionId,
  divisionId,
  excludeUserId,
  type,
  title,
  content,
  meta,
}) {
  const recipientIds = await resolveRecipients({
    sectionId,
    divisionId,
    excludeUserId,
  });
  await pushNotification({ recipientIds, type, title, content, meta });
}