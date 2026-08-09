import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

/**
 * Converts an Excel file buffer to PDF using LibreOffice headless.
 * LibreOffice actually renders the sheet (columns, merges, formatting),
 * so nothing gets lost the way a "dump cells into a table" approach would.
 */
export async function convertExcelToPdf(inputBuffer, extension = "xlsx") {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "xlsx2pdf-"));
  const inputPath = path.join(workDir, `input.${extension}`);
  const outputPath = path.join(workDir, "input.pdf");

  try {
    await fs.writeFile(inputPath, inputBuffer);

    const profileDir = path.join(workDir, `profile-${randomUUID()}`);

    await execFileAsync(
      "soffice",
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=file://${profileDir}`,
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        inputPath,
      ],
      { timeout: 60_000 },
    );

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
