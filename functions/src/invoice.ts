import PDFDocument from "pdfkit";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface InvoiceGenerationData {
  orderId: string;
  paymentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  basePriceInPaise: number;
  discountInPaise: number;
  taxableAmountInPaise: number;
  gstInPaise: number;
  totalInPaise: number;
  gstRatePercent?: number;
  businessName?: string;
  gstin?: string;
  businessAddress?: string;
  invoicePrefix?: string;
  hsnSacCode?: string;
}

export interface GeneratedInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  storagePath: string;
  pdfUrl?: string;
}

/**
 * Generates a GST-compliant PDF buffer using PDFKit.
 */
export async function buildInvoicePdfBuffer(data: InvoiceGenerationData & { invoiceNumber: string }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      const primaryColor = "#6d28d9"; // Violet Gen Z accent
      const textColor = "#1f2937";
      const lightGray = "#f3f4f6";

      // 1. Header & Branding
      doc.fillColor(primaryColor).fontSize(22).font("Helvetica-Bold").text("GenZNex EdTech", 40, 40);
      doc.fillColor("#6b7280").fontSize(9).font("Helvetica").text("Next-Gen Indian EdTech Platform", 40, 68);

      // Business Details (Right Aligned)
      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text(data.businessName || "GenZNex EdTech Private Limited", 300, 40, { align: "right" });
      doc.font("Helvetica").fontSize(8).fillColor("#4b5563");
      doc.text(`GSTIN: ${data.gstin || "27AABCU9603R1ZM"}`, 300, 55, { align: "right" });
      doc.text(data.businessAddress || "241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007", 300, 68, { align: "right" });
      doc.text("Support: payments@genznex.in | www.genznex.in", 300, 81, { align: "right" });

      doc.moveTo(40, 105).lineTo(555, 105).strokeColor("#e5e7eb").lineWidth(1).stroke();

      // 2. Tax Invoice Title & Metadata
      doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("TAX INVOICE / RECEIPT", 40, 120);
      
      const invoiceDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // Left column: Bill To
      doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold").text("BILLED TO (LEARNER):", 40, 145);
      doc.font("Helvetica").fontSize(9).fillColor("#111827");
      doc.text(`Name: ${data.userName || "Student"}`, 40, 160);
      doc.text(`Email: ${data.userEmail}`, 40, 175);
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
      doc.font("Helvetica").fontSize(8).fillColor("#1f2937");
      doc.text("1", 48, rowY);
      doc.text(`${data.courseTitle} (Online Training)`, 70, rowY, { width: 180 });
      doc.text(data.hsnSacCode || "999293", 260, rowY);
      doc.text(`Rs. ${(data.basePriceInPaise / 100).toFixed(2)}`, 340, rowY, { width: 55, align: "right" });
      doc.text(`-Rs. ${(data.discountInPaise / 100).toFixed(2)}`, 405, rowY, { width: 50, align: "right" });
      doc.text(`Rs. ${(data.taxableAmountInPaise / 100).toFixed(2)}`, 465, rowY, { width: 45, align: "right" });
      doc.text(`Rs. ${(data.totalInPaise / 100).toFixed(2)}`, 515, rowY, { width: 40, align: "right" });

      doc.moveTo(40, rowY + 30).lineTo(555, rowY + 30).strokeColor("#e5e7eb").lineWidth(1).stroke();

      // 4. Tax Breakdown Summary
      const summaryTop = rowY + 45;
      const gstRate = data.gstRatePercent || 18;
      const halfGstRate = gstRate / 2;
      const halfGstPaise = Math.round(data.gstInPaise / 2);

      doc.fontSize(8).font("Helvetica").fillColor("#4b5563");
      doc.text("Taxable Value:", 340, summaryTop, { width: 120, align: "right" });
      doc.text(`Rs. ${(data.taxableAmountInPaise / 100).toFixed(2)}`, 470, summaryTop, { width: 85, align: "right" });

      doc.text(`CGST (${halfGstRate}%):`, 340, summaryTop + 15, { width: 120, align: "right" });
      doc.text(`Rs. ${(halfGstPaise / 100).toFixed(2)}`, 470, summaryTop + 15, { width: 85, align: "right" });

      doc.text(`SGST (${halfGstRate}%):`, 340, summaryTop + 30, { width: 120, align: "right" });
      doc.text(`Rs. ${((data.gstInPaise - halfGstPaise) / 100).toFixed(2)}`, 470, summaryTop + 30, { width: 85, align: "right" });

      doc.rect(340, summaryTop + 48, 215, 24).fill(primaryColor);
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("TOTAL PAID (INR):", 348, summaryTop + 55);
      doc.text(`Rs. ${(data.totalInPaise / 100).toFixed(2)}`, 465, summaryTop + 55, { width: 85, align: "right" });

      // 5. Notes & CA Disclaimer
      const footerY = 560;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor("#e5e7eb").lineWidth(1).stroke();
      doc.fontSize(7).font("Helvetica").fillColor("#6b7280");
      doc.text("Terms & Conditions:", 40, footerY + 10);
      doc.text("1. This is a computer-generated electronic tax invoice and does not require a physical signature.", 40, footerY + 22);
      doc.text("2. Commercial training and coaching services are classified under SAC 999293.", 40, footerY + 34);
      doc.text("3. Refunds are governed by GenZNex's 7-day satisfaction policy as outlined in our Terms of Service.", 40, footerY + 46);
      doc.text("4. Note: Please consult a certified Chartered Accountant to verify GST treatment and ITC eligibility.", 40, footerY + 58);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates the sequential invoice, writes PDF to Firebase Storage, saves Firestore doc, and dispatches receipt email.
 */
export async function createAndSaveInvoice(
  db: admin.firestore.Firestore,
  data: InvoiceGenerationData
): Promise<GeneratedInvoiceResult> {
  // 1. Transactional sequential invoice number generation
  const configRef = db.collection("config").doc("payments");
  const invoiceId = `inv_${data.orderId}`;

  // Check if invoice already exists
  const existingDoc = await db.collection("invoices").doc(invoiceId).get();
  if (existingDoc.exists) {
    const existing = existingDoc.data()!;
    return {
      invoiceId,
      invoiceNumber: existing.invoiceNumber,
      storagePath: existing.storagePath,
    };
  }

  let invoiceNumber = "";
  await db.runTransaction(async (transaction) => {
    const configSnap = await transaction.get(configRef);
    const prefix = configSnap.exists ? configSnap.data()?.invoicePrefix || "GZN-INV-2026-" : "GZN-INV-2026-";
    const currentSeq = configSnap.exists ? configSnap.data()?.currentInvoiceSequence || 1000 : 1000;
    const nextSeq = currentSeq + 1;

    invoiceNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;
    transaction.set(configRef, { currentInvoiceSequence: nextSeq }, { merge: true });
  });

  // 2. Build PDF buffer
  const pdfBuffer = await buildInvoicePdfBuffer({
    ...data,
    invoiceNumber,
  });

  // 3. Upload to Cloud Storage
  const storagePath = `invoices/${data.userId}/${invoiceNumber}.pdf`;
  try {
    const bucket = admin.storage().bucket("demo-genznex.appspot.com");
    if (bucket) {
      const file = bucket.file(storagePath);
      await file.save(pdfBuffer, {
        contentType: "application/pdf",
        metadata: {
          invoiceNumber,
          orderId: data.orderId,
          userId: data.userId,
        },
      });
    }
  } catch (err) {
    console.warn("Storage upload warning (expected in emulator without local storage bucket setup):", err);
  }

  // 4. Save to /invoices
  const invoiceDocData = {
    id: invoiceId,
    invoiceNumber,
    paymentId: data.paymentId,
    orderId: data.orderId,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    courseId: data.courseId,
    courseTitle: data.courseTitle,
    amountBreakdown: {
      basePriceInPaise: data.basePriceInPaise,
      discountInPaise: data.discountInPaise,
      taxableAmountInPaise: data.taxableAmountInPaise,
      gstInPaise: data.gstInPaise,
      totalInPaise: data.totalInPaise,
    },
    gstRatePercent: data.gstRatePercent || 18,
    hsnSacCode: data.hsnSacCode || "999293",
    storagePath,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection("invoices").doc(invoiceId).set(invoiceDocData);

  // 5. Pluggable Email Receipt Logger
  console.log(`\n============================================================`);
  console.log(`📧 [EMAIL RECEIPT SIMULATOR] Receipt Dispatched to ${data.userEmail}`);
  console.log(`   Subject: Your GenZNex Tax Invoice & Enrollment Receipt [${invoiceNumber}]`);
  console.log(`   Course: ${data.courseTitle}`);
  console.log(`   Amount Paid: ₹${(data.totalInPaise / 100).toFixed(2)} (Inclusive of 18% GST)`);
  console.log(`   Attachment: ${storagePath} (${pdfBuffer.length} bytes)`);
  console.log(`============================================================\n`);

  return {
    invoiceId,
    invoiceNumber,
    storagePath,
  };
}
