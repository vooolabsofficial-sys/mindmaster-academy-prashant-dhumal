import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPlatformSettings } from "./staffStore";

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

// Common Marathi names, surnames, and words dictionary for natural English rendering
const MARATHI_DICT: Record<string, string> = {
  // Surnames
  "धुमाळ": "Dhumal",
  "शिंदे": "Shinde",
  "पाटील": "Patil",
  "पवार": "Pawar",
  "जाधव": "Jadhav",
  "देशमुख": "Deshmukh",
  "कांबळे": "Kamble",
  "गायकवाड": "Gaikwad",
  "कदम": "Kadam",
  "चव्हाण": "Chavan",
  "सावंत": "Sawant",
  "मोरे": "More",
  "भोसले": "Bhosale",
  "वाघमारे": "Waghmare",
  "शेलार": "Shelar",
  "माने": "Mane",
  "जगताप": "Jagtap",
  "साळुंखे": "Salunkhe",
  "निकम": "Nikam",
  "घाडगे": "Ghadge",
  "थोरात": "Thorat",
  "काळे": "Kale",
  "सूर्यवंशी": "Suryavanshi",
  "तांबोळी": "Tamboli",
  "कुंभार": "Kumbhar",
  "खराडे": "Kharade",
  "जोशी": "Joshi",
  "कुलकर्णी": "Kulkarni",
  "देशपांडे": "Deshpande",
  "सुतार": "Sutar",
  "लोहार": "Lohar",
  "सोनवणे": "Sonawane",
  "मोहिते": "Mohite",
  "गोरे": "Gore",
  "इंगळे": "Ingale",
  "खरात": "Kharat",
  "तांबे": "Tambe",
  "बंडगर": "Bandgar",
  "कोळी": "Koli",
  "माळी": "Mali",
  "बागल": "Bagal",
  "गोडसे": "Godse",
  "खोत": "Khot",
  "गाढवे": "Gadhve",
  "पडवळ": "Padwal",
  "नलावडे": "Nalawade",
  "फडतरे": "Phadtare",

  // First Names
  "प्रशांत": "Prashant",
  "राहुल": "Rahul",
  "सचिन": "Sachin",
  "अमोल": "Amol",
  "महेश": "Mahesh",
  "गणेश": "Ganesh",
  "अक्षय": "Akshay",
  "स्वप्नील": "Swapnil",
  "ओंकार": "Omkar",
  "सूरज": "Suraj",
  "विकास": "Vikas",
  "रोहन": "Rohan",
  "किरण": "Kiran",
  "अमित": "Amit",
  "निलेश": "Nilesh",
  "नितीन": "Nitin",
  "प्रविण": "Pravin",
  "सागर": "Sagar",
  "सुमित": "Sumit",
  "दिपक": "Deepak",
  "विशाल": "Vishal",
  "संकेत": "Sanket",
  "शुभम": "Shubham",
  "ऋषिकेश": "Rushikesh",
  "अनिकेत": "Aniket",
  "तेजस": "Tejas",
  "ऋतुराज": "Ruturaj",
  "आदित्य": "Aditya",
  "प्रथमेश": "Prathamesh",
  "मयुर": "Mayur",
  "योगेश": "Yogesh",
  "चेतन": "Chetan",
  "तुषार": "Tushar",
  "आकाश": "Akash",
  "अजय": "Ajay",
  "विजय": "Vijay",
  "मनोज": "Manoj",
  "संदीप": "Sandeep",
  "संतोष": "Santosh",
  "सुनील": "Sunil",
  "आनंद": "Anand",
  "समाधान": "Samadhan",
  "पूजा": "Pooja",
  "स्नेहल": "Snehal",
  "प्रियांका": "Priyanka",
  "अंकिता": "Ankita",
  "अश्विनी": "Ashwini",
  "प्राजक्ता": "Prajakta",
  "पल्लवी": "Pallavi",
  "सोनाली": "Sonali",
  "माधुरी": "Madhuri",
  "कविता": "Kavita",
  "श्वेता": "Shweta",
  "सुप्रिया": "Supriya",
  "कोमल": "Komal",
  "शीतल": "Sheetal",
  "मनिषा": "Manisha",
  "रूपाली": "Rupali",
  "दीपाली": "Deepali",
  "भाग्यश्री": "Bhagyashree",
  "तेजस्विनी": "Tejaswini",
  "वैशाली": "Vaishali",
  "सिद्धी": "Siddhi",
  "सानिका": "Sanika",
  "नेहा": "Neha",
  "गौरी": "Gauri",
  "दिव्या": "Divya",
  "आदिती": "Aditi",
  "ज्ञानेश्वर": "Dnyaneshwar",
  "विठ्ठल": "Vitthal",
  "श्री": "Shree",
  "सौ": "Sau",
  "कुमार": "Kumar",
  "कुमारी": "Kumari",

  // Course & Academy Words
  "महाराष्ट्र": "Maharashtra",
  "पोलीस": "Police",
  "भरती": "Bharti",
  "गणित": "Maths",
  "बुद्धिमत्ता": "Reasoning",
  "वैदिक": "Vedic",
  "मेमरी": "Memory",
  "अकॅडमी": "Academy",
  "फाऊंडेशन": "Foundation",
  "फाउंडेशन": "Foundation",
  "परीक्षा": "Exam",
  "विद्यार्थी": "Student",
};

const DEVANAGARI_VOWELS: Record<string, string> = {
  "\u0905": "a", "\u0906": "aa", "\u0907": "i", "\u0908": "ee", "\u0909": "u", "\u090A": "oo",
  "\u090B": "ru", "\u090F": "e", "\u0910": "ai", "\u0913": "o", "\u0914": "au",
  "\u0902": "n", "\u0903": "h", "\u0901": "m", "\u0972": "a", "\u0911": "o"
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  "\u093E": "a", "\u093F": "i", "\u0940": "ee", "\u0941": "u", "\u0942": "oo",
  "\u0943": "ru", "\u0947": "e", "\u0948": "ai", "\u094B": "o", "\u094C": "au",
  "\u0949": "o", "\u0945": "e", "\u093C": ""
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  "\u0915": "k", "\u0916": "kh", "\u0917": "g", "\u0918": "gh", "\u0919": "ng",
  "\u091A": "ch", "\u091B": "chh", "\u091C": "j", "\u091D": "jh", "\u091E": "ny",
  "\u091F": "t", "\u0920": "th", "\u0921": "d", "\u0922": "dh", "\u0923": "n",
  "\u0924": "t", "\u0925": "th", "\u0926": "d", "\u0927": "dh", "\u0928": "n",
  "\u092A": "p", "\u092B": "ph", "\u092C": "b", "\u092D": "bh", "\u092E": "m",
  "\u092F": "y", "\u0930": "r", "\u0932": "l", "\u0935": "v", "\u0936": "sh",
  "\u0937": "sh", "\u0938": "s", "\u0939": "h", "\u0933": "l"
};

const DEVANAGARI_NUMBERS: Record<string, string> = {
  "\u0966": "0", "\u0967": "1", "\u0968": "2", "\u0969": "3", "\u096A": "4",
  "\u096B": "5", "\u096C": "6", "\u096D": "7", "\u096E": "8", "\u096F": "9"
};

/**
 * Phonetically transliterates a Devanagari word into Roman/Latin characters.
 */
function transliterateDevanagariWord(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return "";
  if (MARATHI_DICT[trimmed]) return MARATHI_DICT[trimmed];

  let result = "";
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const next = trimmed[i + 1];

    if (DEVANAGARI_NUMBERS[ch]) {
      result += DEVANAGARI_NUMBERS[ch];
    } else if (DEVANAGARI_VOWELS[ch]) {
      result += DEVANAGARI_VOWELS[ch];
    } else if (DEVANAGARI_CONSONANTS[ch]) {
      const c = DEVANAGARI_CONSONANTS[ch];
      if (next === "\u094D") {
        // Halant (virama): suppress inherent vowel
        result += c;
        i++;
      } else if (DEVANAGARI_MATRAS[next] !== undefined) {
        // Dependent vowel sign (matra)
        result += c + DEVANAGARI_MATRAS[next];
        i++;
      } else if (next === "\u0902") {
        // Anusvara
        result += c + "an";
        i++;
      } else {
        // End of word (schwa deletion in Marathi) vs middle consonant
        if (i === trimmed.length - 1) {
          result += c;
        } else {
          result += c + "a";
        }
      }
    } else if (ch === "\u0902") {
      result += "n";
    } else if (ch === "\u0903") {
      result += "h";
    } else if (/[\x20-\x7E]/.test(ch)) {
      result += ch;
    }
  }

  return result ? result.charAt(0).toUpperCase() + result.slice(1) : "";
}

/**
 * Transliterates Devanagari text into clean Latin characters for standard jsPDF fonts.
 */
export function transliterateDevanagariToLatin(text: string): string {
  if (!text) return "";
  return text
    .split(/(\s+|[.,;:\-_/()]+)/)
    .map((token) => {
      if (/[\u0900-\u097F]/.test(token)) {
        return transliterateDevanagariWord(token);
      }
      return token;
    })
    .join("")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

/**
 * Normalizes text for standard PDF Latin fonts to prevent corrupted character glyphs (???)
 * Uses intelligent Marathi course mapping and phonetic Devanagari transliteration.
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

    const transliterated = transliterateDevanagariToLatin(str);
    if (transliterated) return transliterated;
    return "MindMaster Certified Syllabus Track";
  }
  return str.replace(/[^\x20-\x7E]/g, "").trim();
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

  const settings = getPlatformSettings();
  const academyName = (settings.academy_title || "MINDMASTER ACADEMY").toUpperCase();
  const founderSignatory = settings.founder_name || "Prashant Dhumal Sir";
  const sataraAddr = settings.centre_address || "Powai Naka, Satara (415001)";
  const puneAddr = settings.pune_address || "Zeal Chowk, Narhe, Pune";
  const supportNum = settings.whatsapp_number || settings.support_phone || "+91 84593 44077";
  const supportMail = settings.support_email || "mindmasterdhumal@gmail.com";

  // 2. Academy Branding
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(academyName, 15, 24);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayTextColor);
  doc.text(`Founder & Master Trainer: ${founderSignatory}`, 15, 30);
  doc.text(`Head Office: ${sataraAddr} | Pune Campus: ${puneAddr}`, 15, 35);
  doc.text(`Helpline / WhatsApp: ${supportNum} | Email: ${supportMail}`, 15, 40);

  // Top Right Receipt Badge
  doc.setFillColor(232, 241, 253); // Light Blue
  doc.roundedRect(135, 16, 60, 24, 3, 3, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OFFICIAL FEE RECEIPT", 138, 24);

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
      ["Registered Mobile", data.studentPhone ? `+91 ${data.studentPhone.replace(/\D/g, "").slice(-10)}` : "Registered Mobile Verified"],
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
      ["", "Taxes & Levies", "Exempt (Non-GST Academy)", "INR 0.00"],
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
  doc.text((founderSignatory.replace(/ Sir$/i, "")).toUpperCase(), 155, stampY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayTextColor);
  doc.text("Director & Founder", 155, stampY + 19);
  doc.text(settings.academy_title || "MindMaster Academy", 155, stampY + 23);

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

  const settings = getPlatformSettings();
  const certAcademy = (settings.academy_title || "MINDMASTER ACADEMY").toUpperCase();
  const certFounder = (settings.founder_name || "Prashant Dhumal Sir").replace(/ Sir$/i, "").toUpperCase();

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
  doc.text(certAcademy, 148.5, 34, { align: "center" });

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
  doc.text(certFounder, 67.5, sigY + 6, { align: "center" });
  doc.text("EXAMINATIONS HEAD", 227.5, sigY + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & Master Trainer", 67.5, sigY + 11, { align: "center" });
  doc.text("MindMaster Evaluation Board", 227.5, sigY + 11, { align: "center" });

  // Save PDF
  doc.save(`MindMaster_Certificate_${data.certificateNo}.pdf`);
}
