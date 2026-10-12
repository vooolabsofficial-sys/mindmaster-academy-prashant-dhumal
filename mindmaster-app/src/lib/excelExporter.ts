import * as XLSX from "xlsx";

export interface StudentExportRecord {
  id: string;
  name: string;
  phone: string;
  district: string;
  school: string;
  enrolledCourses: string;
  totalPaid: string;
  joinedDate: string;
  status: string;
}

export interface RevenueExportRecord {
  orderId: string;
  studentName: string;
  phone: string;
  courseTitle: string;
  amount: number;
  paymentMode: string;
  status: string;
  date: string;
}

/**
 * Exports students data to an official Microsoft Excel (.xlsx) file
 */
export function exportStudentsToExcel(students: StudentExportRecord[], filename = "MindMaster_Students_Master_Report") {
  const worksheet = XLSX.utils.json_to_sheet(
    students.map((s, idx) => ({
      "Sr.": idx + 1,
      "Student ID": s.id,
      "Full Name": s.name,
      "Mobile Number": s.phone,
      "District": s.district,
      "School / College": s.school,
      "Enrolled Courses": s.enrolledCourses,
      "Total Fees (INR)": s.totalPaid,
      "Admission Date": s.joinedDate,
      "Status": s.status,
    }))
  );

  // Set column widths
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 },
    { wch: 30 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students Master");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
}

/**
 * Exports financial revenue & fee collection data to an official Excel file
 */
export function exportRevenueToExcel(records: RevenueExportRecord[], filename = "MindMaster_Fee_Collection_Report") {
  const worksheet = XLSX.utils.json_to_sheet(
    records.map((r, idx) => ({
      "Sr.": idx + 1,
      "Transaction / Order ID": r.orderId,
      "Student Name": r.studentName,
      "Mobile Number": r.phone,
      "Course Enrolled": r.courseTitle,
      "Amount Paid (INR)": r.amount,
      "Payment Mode": r.paymentMode,
      "Status": r.status,
      "Date & Time": r.date,
    }))
  );

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 32 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fee Collections");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
}

export interface CouponRedemptionExportRow {
  couponCode: string;
  studentName: string;
  studentMobile: string;
  courseTitle: string;
  originalPrice: number;
  discountReceived: number;
  finalPaid: number;
  redeemedAt: string;
}

/**
 * Exports coupon redemptions to an official Microsoft Excel (.xlsx) file
 */
export function exportCouponRedemptionsToExcel(
  records: CouponRedemptionExportRow[],
  couponCode: string
) {
  const worksheet = XLSX.utils.json_to_sheet(
    records.map((r, idx) => ({
      "Sr.": idx + 1,
      "Coupon Code": r.couponCode,
      "Student Name": r.studentName,
      "Mobile Number": r.studentMobile,
      "Course Enrolled": r.courseTitle,
      "Original Fee (₹)": r.originalPrice,
      "Discount Given (₹)": r.discountReceived,
      "Final Paid (₹)": r.finalPaid,
      "Redeemed Date & Time": r.redeemedAt,
    }))
  );

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Redemptions_${couponCode}`);

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `MindMaster_Coupon_${couponCode}_Redemptions_${today}.xlsx`);
}

export interface CouponMasterExportRow {
  code: string;
  description: string;
  school: string;
  discount: string;
  scope: string;
  validity: string;
  quotaLimit: number;
  usedCount: number;
  remainingQuota: number;
  status: string;
}

export function exportCouponsMasterToExcel(
  coupons: CouponMasterExportRow[],
  filename = "MindMaster_Coupons_Master_Report"
) {
  const worksheet = XLSX.utils.json_to_sheet(
    coupons.map((c, idx) => ({
      "Sr.": idx + 1,
      "Coupon Code": c.code,
      "Campaign / Description": c.description,
      "School Restriction": c.school || "Open for All",
      "Discount Value": c.discount,
      "Course Scope": c.scope,
      "Validity Window": c.validity,
      "Total Quota Limit": c.quotaLimit,
      "Used Count": c.usedCount,
      "Remaining Quota": c.remainingQuota,
      "Current Status": c.status,
    }))
  );

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 32 },
    { wch: 26 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Coupons Summary");

  const today = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
}

