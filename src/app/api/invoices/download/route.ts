import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import PDFDocument from "pdfkit";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const db = getFirestore(app);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("id");

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  try {
    const docSnap = await db.collection("invoices").doc(invoiceId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data = docSnap.data()!;

    // Generate PDF buffer on the fly
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      const primaryColor = "#6d28d9";
      const textColor = "#1f2937";
      const lightGray = "#f3f4f6";

      // 1. Header
      doc.fillColor(primaryColor).fontSize(22).font("Helvetica-Bold").text("GenZNex EdTech", 40, 40);
      doc.fillColor("#6b7280").fontSize(9).font("Helvetica").text("Next-Gen Indian EdTech Platform", 40, 68);

      // Business Details
      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text("GenZNex EdTech Private Limited", 300, 40, { align: "right" });
      doc.font("Helvetica").fontSize(8).fillColor("#4b5563");
      doc.text("GSTIN: 27AABCU9603R1ZM", 300, 55, { align: "right" });
      doc.text("Level 4, Cyber City, Gurugram, Haryana 122002", 300, 68, { align: "right" });
      doc.text("Support: payments@genznex.in | www.genznex.in", 300, 81, { align: "right" });

      doc.moveTo(40, 105).lineTo(555, 105).strokeColor("#e5e7eb").lineWidth(1).stroke();

      // 2. Tax Invoice Title & Metadata
      doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("TAX INVOICE / RECEIPT", 40, 120);

      const invoiceDate = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

      // Left column: Bill To
      doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold").text("BILLED TO (LEARNER):", 40, 145);
      doc.font("Helvetica").fontSize(9).fillColor("#111827");
      doc.text(`Name: ${data.userName || "Student"}`, 40, 160);
      doc.text(`Email: ${data.userEmail || "N/A"}`, 40, 175);
      doc.text(`Student UID: ${data.userId}`, 40, 190);
      doc.text("Place of Supply: India (B2C)", 40, 205);

      // Right column: Invoice Metadata
      doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold").text("INVOICE DETAILS:", 340, 145);
      doc.font("Helvetica").fontSize(9).fillColor("#111827");
      doc.text(`Invoice No: ${data.invoiceNumber}`, 340, 160);
      doc.text(`Date of Issue: ${invoiceDate}`, 340, 175);
      doc.text(`Order ID: ${data.orderId}`, 340, 190);
      doc.text(`Payment ID: ${data.paymentId || "N/A"}`, 340, 205);

      // 3. Line Items Table Header
      const tableTop = 235;
      doc.rect(40, tableTop, 515, 24).fill(lightGray);
      doc.fillColor("#111827").fontSize(8).font("Helvetica-Bold");
      doc.text("#", 48, tableTop + 7);
      doc.text("Description", 70, tableTop + 7);
      doc.text("SAC Code", 260, tableTop + 7);
      doc.text("Base Fee", 340, tableTop + 7, { width: 55, align: "right" });
      doc.text("Discount", 405, tableTop + 7, { width: 50, align: "right" });
      doc.text("Taxable", 465, tableTop + 7, { width: 45, align: "right" });
      doc.text("Total", 515, tableTop + 7, { width: 40, align: "right" });

      // Table Row
      const rowY = tableTop + 30;
      const b = data.amountBreakdown || {};
      doc.font("Helvetica").fontSize(8).fillColor("#1f2937");
      doc.text("1", 48, rowY);
      doc.text(`${data.courseTitle} (Online Training)`, 70, rowY, { width: 180 });
      doc.text(data.hsnSacCode || "999293", 260, rowY);
      doc.text(`Rs. ${((b.basePriceInPaise || 0) / 100).toFixed(2)}`, 340, rowY, { width: 55, align: "right" });
      doc.text(`-Rs. ${((b.discountInPaise || 0) / 100).toFixed(2)}`, 405, rowY, { width: 50, align: "right" });
      doc.text(`Rs. ${((b.taxableAmountInPaise || 0) / 100).toFixed(2)}`, 465, rowY, { width: 45, align: "right" });
      doc.text(`Rs. ${((b.totalInPaise || 0) / 100).toFixed(2)}`, 515, rowY, { width: 40, align: "right" });

      doc.moveTo(40, rowY + 30).lineTo(555, rowY + 30).strokeColor("#e5e7eb").lineWidth(1).stroke();

      // 4. Tax Breakdown Summary
      const summaryTop = rowY + 45;
      const gstPaise = b.gstInPaise || 0;
      const halfGstPaise = Math.round(gstPaise / 2);

      doc.fontSize(8).font("Helvetica").fillColor("#4b5563");
      doc.text("Taxable Value:", 340, summaryTop, { width: 120, align: "right" });
      doc.text(`Rs. ${((b.taxableAmountInPaise || 0) / 100).toFixed(2)}`, 470, summaryTop, { width: 85, align: "right" });

      doc.text("CGST (9%):", 340, summaryTop + 15, { width: 120, align: "right" });
      doc.text(`Rs. ${(halfGstPaise / 100).toFixed(2)}`, 470, summaryTop + 15, { width: 85, align: "right" });

      doc.text("SGST (9%):", 340, summaryTop + 30, { width: 120, align: "right" });
      doc.text(`Rs. ${((gstPaise - halfGstPaise) / 100).toFixed(2)}`, 470, summaryTop + 30, { width: 85, align: "right" });

      doc.rect(340, summaryTop + 48, 215, 24).fill(primaryColor);
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("TOTAL PAID (INR):", 348, summaryTop + 55);
      doc.text(`Rs. ${((b.totalInPaise || 0) / 100).toFixed(2)}`, 465, summaryTop + 55, { width: 85, align: "right" });

      // 5. Notes & Footer
      const footerY = 560;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor("#e5e7eb").lineWidth(1).stroke();
      doc.fontSize(7).font("Helvetica").fillColor("#6b7280");
      doc.text("Terms & Conditions:", 40, footerY + 10);
      doc.text("1. This is a computer-generated electronic tax invoice and does not require a physical signature.", 40, footerY + 22);
      doc.text("2. Commercial training and coaching services are classified under SAC 999293.", 40, footerY + 34);
      doc.text("3. Refunds are governed by GenZNex's 7-day satisfaction policy as outlined in our Terms of Service.", 40, footerY + 46);
      doc.text("4. Note: Please consult a certified Chartered Accountant to verify GST treatment and ITC eligibility.", 40, footerY + 58);

      doc.end();
    });

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="GenZNex-Invoice-${data.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Failed to generate invoice stream:", err);
    return NextResponse.json({ error: "Failed to generate invoice PDF" }, { status: 500 });
  }
}
