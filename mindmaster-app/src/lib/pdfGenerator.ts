import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface FeeReceiptData {
  receiptNo: string;
  date: string;
  studentName: string;
  studentPhone: string;
  district?: string;
  courseCode: string;
  courseTitle: string;
  amountPaise: number;
  paymentId: string;
  accessMonths: number;
  expiryDate: string;
}

export interface CertificateData {
  certificateNo: string;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  grade?: string;
}

/**
 * Normalizes text for standard PDF Latin fonts to prevent corrupted character glyphs (???)
 */
function toSafePdfText(str?: string): string {
  if (!str) return "";
  if (/[\u0900-\u097F]/.test(str)) {
    if (str.includes("पोलीस भरती") || str.toLowerCase().includes("police")) {
      return "Maharashtra Police Bharti 2026 - Maths & Reasoning Superfast";
    }
    if (str.includes("वैदिक") || str.toLowerCase().includes("vedic")) {
      return "Vedic Maths & Speed Memory Mastery";
    }
    if (str.includes("१०वी") || str.includes("10th")) {
      return "10th SSC Board Maths Special Foundation";
    }
    if (str.includes("कॅलेंडर") || str.toLowerCase().includes("calendar")) {
      return "500-Year Calendar Super Memory Technique";
    }
    if (str.includes("ट्रेनर") || str.toLowerCase().includes("trainer")) {
      return "Train the Trainer Memory Mastery Professional";
    }
    return str.replace(/[^\x20-\x7E]/g, "").trim() || "MindMaster Certified Syllabus Track";
  }
  return str;
}

/**
 * Generates and triggers download of an official MindMaster Academy Fee Receipt
 */
export function generateFeeReceiptPdf(data: FeeReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [11, 87, 208]; // #0B57D0 (MindMaster Royal Blue)
  const darkTextColor: [number, number, number] = [14, 27, 61]; // #0E1B3D
  const grayTextColor: [number, number, number] = [90, 100, 120];

  // 1. Top Decorative Header Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 8, "F");

  // 2. Academy Branding
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MINDMASTER ACADEMY", 15, 24);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayTextColor);
  doc.text("Founder & Master Trainer: Prashant Dhumal Sir", 15, 30);
  doc.text("Head Office: Powai Naka, Satara (415001) | Pune Campus: Zeal Chowk, Narhe, Pune", 15, 35);
  doc.text("Helpline: +91 84593 44077 | Email: contact@mindmasteracademy.in", 15, 40);

  // Top Right Receipt Badge
  doc.setFillColor(232, 241, 253); // Light Blue
  doc.roundedRect(135, 16, 60, 24, 3, 3, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FEE RECEIPT / PAVATI", 140, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkTextColor);
  doc.text(`Receipt No: ${data.receiptNo}`, 140, 31);
  doc.text(`Date: ${data.date}`, 140, 36);

  // Horizontal separator line
  doc.setDrawColor(228, 232, 248);
  doc.setLineWidth(0.5);
  doc.line(15, 46, 195, 46);

  // 3. Student & Enrollment Information Table
  const safeCourseTitle = toSafePdfText(data.courseTitle);
  const safeStudentName = toSafePdfText(data.studentName) || "Verified MindMaster Student";

  autoTable(doc, {
    startY: 52,
    head: [["STUDENT & ENROLLMENT PARTICULARS", "DETAILS"]],
    body: [
      ["Student Full Name", safeStudentName],
      ["Registered Mobile", data.studentPhone || "+91 98XXXXXXXX"],
      ["District / Region", data.district || "Maharashtra"],
      ["Course Code & Title", `[${data.courseCode}] ${safeCourseTitle}`],
      ["Access Duration", `${data.accessMonths} Months (Valid through ${data.expiryDate})`],
      ["Payment Mode", "Online Razorpay / Card / UPI"],
      ["Transaction / Payment Ref ID", data.paymentId || "pay_verified_gateway"],
      ["Enrollment Status", "CONFIRMED & ACTIVE (OFFICIALLY ENROLLED)"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: darkTextColor,
      fontSize: 9,
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  // 4. Financial Fee Summary Table
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const feeInRupees = (data.amountPaise / 100).toFixed(2);

  autoTable(doc, {
    startY: finalY,
    head: [["SR.", "PARTICULARS", "DURATION", "TOTAL AMOUNT (INR)"]],
    body: [
      ["1", `${safeCourseTitle} - Complete Video Course & Syllabus Access`, `${data.accessMonths} Months`, `INR ${feeInRupees}`],
      ["", "GST / Taxes", "Inclusive", "INR 0.00"],
      ["", "Total Fee Received in Full (INR)", "", `INR ${feeInRupees}`],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: darkTextColor,
      fontSize: 9,
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 105 },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
  });

  // 5. Payment Stamp & Director Seal
  const stampY = (doc as any).lastAutoTable.finalY + 12;

  // Paid Stamp Box
  doc.setDrawColor(10, 133, 84); // Emerald Green
  doc.setLineWidth(1);
  doc.roundedRect(15, stampY, 50, 24, 2, 2, "D");
  doc.setTextColor(10, 133, 84);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PAID", 28, stampY + 11);
  doc.setFontSize(7.5);
  doc.text("FEES RECEIVED IN FULL", 17, stampY + 18);

  // Authority Signature
  doc.setTextColor(...darkTextColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PRASHANT DHUMAL", 155, stampY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayTextColor);
  doc.text("Director & Founder", 155, stampY + 19);
  doc.text("MindMaster Academy", 155, stampY + 23);

  // 6. Security & Verification Footer
  doc.setDrawColor(228, 232, 248);
  doc.line(15, 275, 195, 275);
  doc.setFontSize(7.5);
  doc.setTextColor(140, 150, 170);
  doc.text(
    "Note: This is an authentic computer-generated receipt issued by MindMaster Academy. Retain this receipt for certificate issuance.",
    15,
    281
  );
  doc.text("Website: mindmasteracademy.in | Student Support: +91 84593 44077", 15, 286);

  // Trigger browser download
  doc.save(`MindMaster_Receipt_${data.receiptNo}.pdf`);
}

/**
 * Generates an official Certificate of Completion
 */
export function generateCourseCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [11, 87, 208]; // #0B57D0
  const goldColor: [number, number, number] = [202, 138, 4]; // #CA8A04
  const darkTextColor: [number, number, number] = [14, 27, 61];

  // Decorative border
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(2);
  doc.rect(8, 8, 281, 194);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, 273, 186);

  // Title
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("MINDMASTER ACADEMY", 148.5, 34, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("ISO CERTIFIED PREMIER MEMORY & VEDIC MATHS INSTITUTE OF MAHARASHTRA", 148.5, 42, { align: "center" });

  // Main Heading
  doc.setTextColor(...goldColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CERTIFICATE OF COMPLETION", 148.5, 62, { align: "center" });

  // Body
  const safeStudentName = toSafePdfText(data.studentName) || "VERIFIED LEARNER";
  const safeCourseTitle = toSafePdfText(data.courseTitle);

  doc.setTextColor(...darkTextColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("This is proudly presented to", 148.5, 78, { align: "center" });

  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(safeStudentName.toUpperCase(), 148.5, 94, { align: "center" });

  // Underline student name
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(70, 97, 227, 97);

  doc.setTextColor(...darkTextColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("for successfully mastering all modules, speed drills, and practical techniques in", 148.5, 110, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`"${safeCourseTitle}"`, 148.5, 122, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Awarded on: ${data.completionDate}  |  Certificate ID: ${data.certificateNo}`, 148.5, 134, { align: "center" });

  // Signature lines
  const sigY = 165;
  doc.setDrawColor(148, 163, 184);
  doc.line(40, sigY, 95, sigY);
  doc.line(200, sigY, 255, sigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text("PRASHANT DHUMAL", 67.5, sigY + 6, { align: "center" });
  doc.text("EXAMINATIONS HEAD", 227.5, sigY + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & Master Trainer", 67.5, sigY + 11, { align: "center" });
  doc.text("MindMaster Evaluation Board", 227.5, sigY + 11, { align: "center" });

  // Save PDF
  doc.save(`MindMaster_Certificate_${data.certificateNo}.pdf`);
}
