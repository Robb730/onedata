import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // bypasses RLS — required
);

const EXCEL_BUCKET_TYPES = new Set([
  "enrollment", "classrooms", "seats", "teachers_inventory",
  "textbook_inventory", "cespes", "performance_indicators",
  "aip_school", "aip_sdo", "qbedp", "accomplishment_report",
]);
const getBucket = (category: string) =>
  EXCEL_BUCKET_TYPES.has(category) ? "excel-files" : "repository-files";

Deno.serve(async () => {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expired, error } = await supabase
    .from("files")
    .select("id, file_path, data_category, verified_pdf_path")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  for (const file of expired ?? []) {
    if (file.file_path) {
      await supabase.storage.from(getBucket(file.data_category)).remove([file.file_path]);
    }
    if (file.verified_pdf_path) {
      await supabase.storage.from("verified-pdfs").remove([file.verified_pdf_path]);
    }
    await supabase.from("files").delete().eq("id", file.id);
  }

  return new Response(JSON.stringify({ purged: expired?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});