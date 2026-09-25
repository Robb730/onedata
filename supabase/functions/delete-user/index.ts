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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const fail = (step, message) =>
      new Response(JSON.stringify({ error: message, blockedBy: step }), {
        status: 500, headers: corsHeaders,
      });

    // ── 1. Null out reviewer/audit id-links (history kept) ──────────
    // These FKs are NO ACTION, so they block `users.delete()`. Display
    // names are snapshotted (`reviewed_by_name`, `deleted_by_name`,
    // `created_by_name`), so only the id link is cleared. Files the user
    // uploaded are NEVER deleted here.
    const nullOuts = [
      { table: "division_access_request", column: "reviewed_by" },
      { table: "file_access_request", column: "reviewed_by" },
      { table: "file_access_request", column: "revoked_by" },
      { table: "files", column: "deleted_by" },
      { table: "section_deletion_requests", column: "resolved_by" },
      // `file_feedback.created_by` is nullable: messages survive showing
      // the stored `created_by_name`.
      { table: "file_feedback", column: "created_by" },
    ];
    for (const { table, column } of nullOuts) {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ [column]: null })
        .eq(column, userId);
      if (error) return fail(`${table}.${column}`, error.message);
    }

    // ── 2. Delete regenerable + requester-side rows ─────────────────
    // Read receipts regenerate on next open. Requester-side section
    // deletion rows (any status — decided ones block identically) go
    // with the user; the event history survives in `audit_logs`.
    // (Requester rows on both access-request tables CASCADE in the DB;
    // the pending-pruning below is kept as harmless safety.)
    const { error: readsError } = await supabaseAdmin
      .from("file_feedback_reads")
      .delete()
      .eq("user_id", userId);
    if (readsError) return fail("file_feedback_reads.user_id", readsError.message);

    const { error: sectionReqError } = await supabaseAdmin
      .from("section_deletion_requests")
      .delete()
      .eq("requested_by", userId);
    if (sectionReqError) return fail("section_deletion_requests.requested_by", sectionReqError.message);

    const { error: delDivisionPendingError } = await supabaseAdmin
      .from("division_access_request")
      .delete()
      .eq("requester_id", userId)
      .eq("status", "pending");
    if (delDivisionPendingError) {
      return fail("division_access_request.requester_id", delDivisionPendingError.message);
    }

    const { error: delFilePendingError } = await supabaseAdmin
      .from("file_access_request")
      .delete()
      .eq("requested_by", userId)
      .eq("status", "pending");
    if (delFilePendingError) {
      return fail("file_access_request.requested_by", delFilePendingError.message);
    }

    const { error: dbError } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (dbError) {
      return fail("users", dbError.message);
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unexpected error deleting user:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500, headers: corsHeaders,
    });
  }
});