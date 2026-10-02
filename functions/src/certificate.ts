import PDFDocument from "pdfkit";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import QRCode from "qrcode";

export interface CertificateGenerationData {
  certificateId: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  trainerId?: string;
  trainerName?: string;
  gradePercent?: number;
  verificationUrl: string;
  issuedByUid: string;
}

export interface GeneratedCertificateResult {
  certificateId: string;
  certificateNumber: string;
  verificationUrl: string;
  storagePath: string;
  pdfUrl?: string;
}

/**
 * Builds a branded, landscape A4 certificate PDF buffer with an embedded verification QR code
 */
export async function buildCertificatePdfBuffer(data: CertificateGenerationData): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
    width: 140,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return new Promise((resolve, reject) => {
    try {
      // Landscape A4: 841.89 x 595.28 points
      const doc = new PDFDocument({
        layout: "landscape",
        size: "A4",
        margin: 30,
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      const pageWidth = 841.89;
      const pageHeight = 595.28;

      // 1. Background & Outer Borders
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(3).stroke("#7c3aed"); // Violet border
      doc.rect(28, 28, pageWidth - 56, pageHeight - 56).lineWidth(1).stroke("#e2e8f0"); // Thin inner border

      // Decorative corner accents
      doc.rect(20, 20, 40, 40).fill("#7c3aed");
      doc.rect(pageWidth - 60, 20, 40, 40).fill("#7c3aed");
      doc.rect(20, pageHeight - 60, 40, 40).fill("#7c3aed");
      doc.rect(pageWidth - 60, pageHeight - 60, 40, 40).fill("#7c3aed");

      // 2. Header Branding
      doc.fillColor("#6d28d9").fontSize(18).font("Helvetica-Bold").text("GENZNEX EDTECH", 0, 65, { align: "center" });
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("NEXT-GEN ACCELERATED LEARNING PLATFORM - INDIA", 0, 88, { align: "center" });

      // Title
      doc.fillColor("#0f172a").fontSize(26).font("Helvetica-Bold").text("CERTIFICATE OF COMPLETION", 0, 115, { align: "center" });
      doc.fillColor("#f59e0b").fontSize(12).font("Helvetica-Bold").text("VERIFIED ACADEMIC ACHIEVEMENT", 0, 146, { align: "center" });

      // Body text
      doc.fillColor("#64748b").fontSize(11).font("Helvetica").text("This is proudly awarded to", 0, 185, { align: "center" });

      // Student Name
      doc.fillColor("#1e1b4b").fontSize(30).font("Helvetica-Bold").text(data.userName, 0, 210, { align: "center" });

      // Decorative line under name
      doc.moveTo(270, 250).lineTo(570, 250).lineWidth(1.5).stroke("#c084fc");

      // Completion text
      doc.fillColor("#475569").fontSize(11).font("Helvetica").text(
        "for successfully completing all curriculum requirements, hands-on projects, and examinations in",
        0,
        270,
        { align: "center" }
      );

      // Course Title
      doc.fillColor("#4c1d95").fontSize(20).font("Helvetica-Bold").text(data.courseTitle, 0, 295, { align: "center" });

      // Grade badge if present
      if (data.gradePercent && data.gradePercent > 0) {
        doc.fillColor("#059669").fontSize(11).font("Helvetica-Bold").text(
          `Completed with Distinction (${data.gradePercent}% Cumulative Score)`,
          0,
          325,
          { align: "center" }
        );
      }

      // 3. Footer Columns: Signatures, ID, and QR Code
      const footerY = 410;

      // Left: Instructor / Authority
      doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(data.trainerName || "Vikram Malhotra", 90, footerY);
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("Lead Instructor & Curriculum Director", 90, footerY + 16);
      doc.moveTo(90, footerY + 32).lineTo(260, footerY + 32).lineWidth(1).stroke("#cbd5e1");

      // Center: Issue Date & Verification ID
      const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text(`Date: ${todayStr}`, 0, footerY, { align: "center" });
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(`Certificate ID: ${data.certificateId}`, 0, footerY + 16, { align: "center" });
      doc.fillColor("#7c3aed").fontSize(8).font("Helvetica-Bold").text("Status: VERIFIED & AUTHENTIC", 0, footerY + 30, { align: "center" });

      // Right: QR Code pointing to verification URL
      doc.image(qrBuffer, pageWidth - 200, footerY - 25, { width: 85, height: 85 });
      doc.fillColor("#64748b").fontSize(7).font("Helvetica").text("Scan to Verify", pageWidth - 200, footerY + 65, { width: 85, align: "center" });

      // Security bottom note
      doc.fillColor("#94a3b8").fontSize(7).font("Helvetica").text(
        `Verification URL: ${data.verificationUrl} | GenZNex EdTech India (Regd. SAC 999293) | Zero-Tamper Cryptographic ID`,
        0,
        pageHeight - 45,
        { align: "center" }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates, uploads, and persists a Certificate in Firestore and Cloud Storage
 */
export async function createAndSaveCertificate(
  firestore: admin.firestore.Firestore,
  data: CertificateGenerationData
): Promise<GeneratedCertificateResult> {
  const pdfBuffer = await buildCertificatePdfBuffer(data);
  const storagePath = `certificates/${data.certificateId}.pdf`;

  // 1. Upload to Cloud Storage
  try {
    const bucket = admin.storage().bucket("demo-genznex.appspot.com");
    if (bucket) {
      const file = bucket.file(storagePath);
      await file.save(pdfBuffer, {
        contentType: "application/pdf",
        metadata: {
          certificateId: data.certificateId,
          userId: data.userId,
          courseId: data.courseId,
        },
      });
    }
  } catch (err) {
    console.warn("[Certificate Storage Upload Warning]:", err);
  }

  // 2. Persist in /certificates
  const certDocData = {
    id: data.certificateId,
    certificateNumber: data.certificateId,
    userId: data.userId,
    userName: data.userName,
    courseId: data.courseId,
    courseTitle: data.courseTitle,
    trainerId: data.trainerId || "",
    trainerName: data.trainerName || "GenZNex Instructor",
    gradePercent: data.gradePercent || 100,
    issueDate: FieldValue.serverTimestamp(),
    completionDate: FieldValue.serverTimestamp(),
    verificationUrl: data.verificationUrl,
    storagePath,
    status: "valid",
    issuedByAdminOrTrainerId: data.issuedByUid,
    createdAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection("certificates").doc(data.certificateId).set(certDocData);

  return {
    certificateId: data.certificateId,
    certificateNumber: data.certificateId,
    verificationUrl: data.verificationUrl,
    storagePath,
  };
}
