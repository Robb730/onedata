import { createClient } from "npm:@supabase/supabase-js@2";
import { convertExcelToPdf } from "./convertExcelToPdf.ts";
import { stampPdf } from "./stampPdf.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const EXCEL_EXTENSIONS = new Set(["xlsx", "xls", "csv"]);
const PDF_EXTENSIONS = new Set(["pdf"]);
const VERIFIED_BUCKET = "verified-pdfs";

// ── CORS ────────────────────────────────────────────────────────
// Adjust Access-Control-Allow-Origin to a specific origin (or a list you
// check against req.headers.get("origin")) if you want to lock this down
// beyond "*" for production.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBucket(dataCategory: string | null) {
  return dataCategory === "general" || !dataCategory
    ? "repository-files"
    : "excel-files";
}

function getExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

Deno.serve(async (req) => {
  // Preflight — must be answered before anything else, with no auth checks.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return jsonResponse({ error: "Missing file id" }, 400);
    }

    const { data: file, error: fileErr } = await supabaseAdmin
      .from("files")
      .select(
        "id, file_name, file_path, file_type, data_category, status, verified_by_name, verified_at",
      )
      .eq("id", id)
      .single();

    if (fileErr || !file) {
      return jsonResponse({ error: "File not found" }, 404);
    }
    if (file.status !== "Verified") {
      return jsonResponse({ error: "This file is not verified" }, 400);
    }

    const ext = getExtension(file.file_name);
    if (!EXCEL_EXTENSIONS.has(ext) && !PDF_EXTENSIONS.has(ext)) {
      return jsonResponse(
        {
          error:
            "Only Excel and PDF files are supported for verified PDFs right now",
        },
        400,
      );
    }

    const sourceBucket = getBucket(file.data_category);
    const { data: blob, error: dlErr } = await supabaseAdmin.storage
      .from(sourceBucket)
      .download(file.file_path);
    if (dlErr || !blob) {
      return jsonResponse({ error: dlErr?.message || "Download failed" }, 500);
    }

    const inputBuffer = new Uint8Array(await blob.arrayBuffer());

    const pdfBytes = PDF_EXTENSIONS.has(ext)
      ? inputBuffer
      : await convertExcelToPdf(inputBuffer);

    const stamped = await stampPdf(pdfBytes, {
      verifiedByName: file.verified_by_name,
      verifiedAt: file.verified_at,
    });

    const verifiedPath = `${file.id}.pdf`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(VERIFIED_BUCKET)
      .upload(verifiedPath, stamped, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) {
      return jsonResponse({ error: uploadErr.message }, 500);
    }

    const { error: updateErr } = await supabaseAdmin
      .from("files")
      .update({ verified_pdf_path: verifiedPath })
      .eq("id", file.id);
    if (updateErr) {
      return jsonResponse({ error: updateErr.message }, 500);
    }

    return jsonResponse({ success: true, path: verifiedPath }, 200);
  } catch (err) {
    console.error("generate-verified-pdf error:", err);
    return jsonResponse({ error: "Failed to generate verified PDF" }, 500);
  }
});