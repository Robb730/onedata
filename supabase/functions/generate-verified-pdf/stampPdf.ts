import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

export async function stampPdf(
  pdfBytes: Uint8Array,
  { verifiedByName, verifiedAt }: { verifiedByName: string | null; verifiedAt: string | null },
) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const dateStr = new Date(verifiedAt ?? Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize();
    const boxWidth = 190;
    const boxHeight = 42;
    const margin = 18;
    const x = width - boxWidth - margin;
    const y = margin;

    page.drawRectangle({
      x, y, width: boxWidth, height: boxHeight,
      borderColor: rgb(0.06, 0.55, 0.32),
      borderWidth: 1.5,
      color: rgb(0.93, 0.98, 0.95),
      opacity: 0.9,
      borderOpacity: 0.9,
    });

    page.drawText("VERIFIED", {
      x: x + 10, y: y + boxHeight - 16, size: 10, font,
      color: rgb(0.06, 0.45, 0.27),
    });
    page.drawText(`By: ${verifiedByName || "Unknown"}`, {
      x: x + 10, y: y + boxHeight - 29, size: 8, font: smallFont,
      color: rgb(0.15, 0.15, 0.15),
    });
    page.drawText(`On: ${dateStr}`, {
      x: x + 10, y: y + boxHeight - 39, size: 8, font: smallFont,
      color: rgb(0.15, 0.15, 0.15),
    });
  }

  return pdfDoc.save();
}