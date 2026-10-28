"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Book, StudentRecord } from "@/lib/types";
import { normalizePhone } from "@/lib/phoneUtils";
import {
  grantCashAdmission,
  getStudentActiveGrants,
  StudentActiveAccessItem,
} from "@/lib/grantStore";
import { StaffCourse, getCurrentStaff, logStaffAction } from "@/lib/staffStore";

export interface BulkStudentRow {
  id: string;
  phone: string;
  name: string;
  courseId: string;
  months: number;
  paymentMode: "cash" | "upi" | "scholarship";
  upiRef?: string;
  amount: number;
  remarks?: string;
  existingCourses?: StudentActiveAccessItem[];
  error?: string;
}

interface BulkGrantCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: StaffCourse[];
  books: Book[];
  initialStudents?: StudentRecord[];
  onSuccess?: (message: string) => void;
}

export default function BulkGrantCustomizerModal({
  isOpen,
  onClose,
  courses,
  books,
  initialStudents = [],
  onSuccess,
}: BulkGrantCustomizerModalProps) {
  const currentStaff = getCurrentStaff();
  const isMainAdmin = currentStaff.role === "main_admin";

  const defaultCourse = courses[0];
  const defaultPrice = defaultCourse ? Math.round(defaultCourse.pricePaise / 100) : 199;

  // Active Tab: "table" | "csv" | "paste"
  const [activeTab, setActiveTab] = useState<"table" | "csv" | "paste">(
    initialStudents.length > 0 ? "table" : "paste"
  );

  const [rows, setRows] = useState<BulkStudentRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    totalSuccess: number;
    totalCash: number;
    totalUpi: number;
    failedRows: { phone: string; error: string }[];
  } | null>(null);

  // Bulk Apply Bar Controls
  const [bulkCourseId, setBulkCourseId] = useState(defaultCourse?.id || "all");
  const [bulkMonths, setBulkMonths] = useState(6);
  const [bulkPaymentMode, setBulkPaymentMode] = useState<"cash" | "upi" | "scholarship">("cash");
  const [bulkAmount, setBulkAmount] = useState(defaultPrice);

  // Initialize rows from initialStudents when modal opens
  useEffect(() => {
    if (initialStudents && initialStudents.length > 0) {
      const initialRows: BulkStudentRow[] = initialStudents.map((st, idx) => {
        const clean = normalizePhone(st.phone);
        const existing = getStudentActiveGrants(clean);
        return {
          id: `row-${Date.now()}-${idx}-${clean}`,
          phone: clean,
          name: st.name || "Student",
          courseId: defaultCourse?.id || "all",
          months: 6,
          paymentMode: "cash",
          amount: defaultPrice,
          remarks: "Multi-Student Batch Admission",
          existingCourses: existing,
        };
      });
      setRows(initialRows);
      setSelectedRowIds(new Set(initialRows.map((r) => r.id)));
      setActiveTab("table");
    }
  }, [initialStudents, defaultPrice, defaultCourse?.id]);

  if (!isOpen) return null;

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseLinesIntoRows(text);
      setActiveTab("table");
    };
    reader.readAsText(file);
  };

  // Paste Text Parser
  const parseLinesIntoRows = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const newRows: BulkStudentRow[] = [];

    lines.forEach((line, index) => {
      // Support comma, tab, or pipe separation
      const parts = line.split(/[,\t|]/).map((p) => p.trim());
      if (parts.length === 0) return;

      const rawPhone = parts[0] || "";
      const cleanPhone = normalizePhone(rawPhone);
      if (!cleanPhone || cleanPhone.length !== 10) return; // skip header or invalid phone

      const name = parts[1] || `Student ${cleanPhone.slice(-4)}`;
      const rawCourse = (parts[2] || "").toLowerCase();
      let matchedCourseId = defaultCourse?.id || "all";

      if (rawCourse.includes("all") || rawCourse.includes("bundle")) {
        matchedCourseId = "all";
      } else {
        const foundC = courses.find(
          (c) =>
            c.id.toLowerCase() === rawCourse ||
            c.code.toLowerCase() === rawCourse ||
            c.title.toLowerCase().includes(rawCourse)
        );
        if (foundC) {
          matchedCourseId = foundC.id;
        } else {
          const foundB = books.find(
            (b) =>
              b.id.toLowerCase() === rawCourse ||
              (b.code && b.code.toLowerCase() === rawCourse) ||
              b.title.toLowerCase().includes(rawCourse)
          );
          if (foundB) matchedCourseId = foundB.id;
        }
      }

      const months = Number(parts[3]) || 6;
      const amount = Number(parts[4]) || defaultPrice;
      const mode = (parts[5] || "").toLowerCase();
      const paymentMode: "cash" | "upi" | "scholarship" =
        mode.includes("upi") ? "upi" : mode.includes("free") && isMainAdmin ? "scholarship" : "cash";
      const remarks = parts[6] || "Excel Batch Admission";

      const existing = getStudentActiveGrants(cleanPhone);

      newRows.push({
        id: `row-${Date.now()}-${index}-${cleanPhone}`,
        phone: cleanPhone,
        name,
        courseId: matchedCourseId,
        months,
        paymentMode,
        amount,
        remarks,
        existingCourses: existing,
      });
    });

    if (newRows.length > 0) {
      setRows((prev) => [...prev, ...newRows]);
      setSelectedRowIds((prev) => new Set([...Array.from(prev), ...newRows.map((r) => r.id)]));
      setActiveTab("table");
    }
  };

  // Row Manipulation
  const updateRow = (id: string, updates: Partial<BulkStudentRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === rows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(rows.map((r) => r.id)));
    }
  };

  // Bulk Apply to Selected Rows
  const handleBulkApply = () => {
    if (selectedRowIds.size === 0) return;
    setRows((prev) =>
      prev.map((r) => {
        if (!selectedRowIds.has(r.id)) return r;
        return {
          ...r,
          courseId: bulkCourseId,
          months: bulkMonths,
          paymentMode: bulkPaymentMode,
          amount: bulkPaymentMode === "scholarship" ? 0 : bulkAmount,
        };
      })
    );
  };

  // Financial Summary of Rows
  const summary = useMemo(() => {
    let totalCash = 0;
    let totalUpi = 0;
    rows.forEach((r) => {
      if (r.paymentMode === "cash") totalCash += Number(r.amount) || 0;
      if (r.paymentMode === "upi") totalUpi += Number(r.amount) || 0;
    });
    return {
      rowCount: rows.length,
      totalCash,
      totalUpi,
      totalFee: totalCash + totalUpi,
    };
  }, [rows]);

  // Execute Batch Activation
  const handleConfirmBatchActivate = async () => {
    if (rows.length === 0) return;
    setIsProcessing(true);

    let successCount = 0;
    let cashSum = 0;
    let upiSum = 0;
    const failedList: { phone: string; error: string }[] = [];

    for (const row of rows) {
      try {
        const res = grantCashAdmission({
          studentPhone: row.phone,
          studentName: row.name,
          courseId: row.courseId,
          accessMonths: row.months,
          paymentMode: row.paymentMode,
          upiRef: row.upiRef || (row.paymentMode === "upi" ? "BATCH_UPI" : undefined),
          amountPaid: row.amount,
          remarks: row.remarks,
          allowExtension: true,
        });

        if (res.success) {
          successCount++;
          if (row.paymentMode === "cash") cashSum += row.amount;
          if (row.paymentMode === "upi") upiSum += row.amount;
        } else {
          failedList.push({ phone: row.phone, error: res.error || "Grant failed" });
        }
      } catch (e: any) {
        failedList.push({ phone: row.phone, error: e?.message || "Execution exception" });
      }
    }

    logStaffAction(
      "BULK_BATCH_ADMISSION",
      "grant",
      "BATCH",
      "Bulk Admission Customizer",
      `Staff (${currentStaff.role} - ${currentStaff.name}) executed batch admission for ${successCount}/${rows.length} students. Cash: ₹${cashSum}, UPI: ₹${upiSum}.`
    );

    setIsProcessing(false);
    setProcessResult({
      totalSuccess: successCount,
      totalCash: cashSum,
      totalUpi: upiSum,
      failedRows: failedList,
    });

    if (onSuccess) {
      onSuccess(`Successfully activated admissions for ${successCount} student(s)!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-5xl p-5 md:p-7 shadow-2xl space-y-4 my-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl border border-amber-200">
              📋
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0E1B3D]">
                Bulk Excel / CSV &amp; Multi-Student Customizer
              </h2>
              <p className="text-xs text-slate-500">
                Preview, customize courses, validity, fees, and activate multiple students in one batch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Success Completion View */}
        {processResult ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 text-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              ✅
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Batch Activation Complete!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Admissions have been recorded in Supabase, courses unlocked in student portals, and financial tallies logged.
            </p>

            {/* Financial Tally Box */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Activated</span>
                <div className="text-lg font-extrabold text-blue-700">
                  {processResult.totalSuccess} Students
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Cash Collected</span>
                <div className="text-lg font-extrabold text-emerald-700">
                  ₹{processResult.totalCash.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">UPI Collected</span>
                <div className="text-lg font-extrabold text-purple-700">
                  ₹{processResult.totalUpi.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {processResult.failedRows.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto text-left text-xs text-rose-800">
                <span className="font-bold">⚠️ {processResult.failedRows.length} Rows Skipped:</span>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {processResult.failedRows.map((f, i) => (
                    <li key={i}>
                      {f.phone}: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setProcessResult(null);
                onClose();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow transition"
            >
              Done &amp; Return
            </button>
          </div>
        ) : (
          <>
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "table"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>Interactive Table</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
                  {rows.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "paste"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>📝 Paste Lines</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("csv")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "csv"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>📁 Upload CSV</span>
              </button>
            </div>

            {/* TAB 1: PASTE LINES */}
            {activeTab === "paste" && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900">
                  <span className="font-bold">Format:</span> One student per line:{" "}
                  <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    Phone, Name, CourseCode, Months, AmountPaid, PaymentMode (Cash/UPI), Remarks
                  </code>
                </div>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`9876543210, Snehal More, MM, 6, 299, Cash, Satara Seminar\n9823000000, Amit Kulkarni, VEDIC, 12, 499, UPI, Offline Admission`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    parseLinesIntoRows(pasteText);
                    setPasteText("");
                  }}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition"
                >
                  Parse &amp; Populate Table →
                </button>
              </div>
            )}

            {/* TAB 2: UPLOAD CSV */}
            {activeTab === "csv" && (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3">
                <div className="text-3xl">📂</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Upload CSV or Excel Export</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a .csv file containing Mobile Numbers, Names, and Course Codes
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-extrabold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            )}

            {/* TAB 3: INTERACTIVE TABLE & BULK ACTION BAR */}
            {activeTab === "table" && (
              <div className="space-y-3">
                {/* Bulk Apply Bar */}
                {rows.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0E1B3D]">
                        Bulk Apply ({selectedRowIds.size} Selected):
                      </span>
                      <select
                        value={bulkCourseId}
                        onChange={(e) => setBulkCourseId(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      >
                        <option value="all">🌟 All Courses Bundle</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            🎓 {c.title}
                          </option>
                        ))}
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>
                            📚 {b.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={bulkMonths}
                        onChange={(e) => setBulkMonths(Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      >
                        <option value={1}>1 Month</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>1 Year</option>
                        <option value={120}>Lifetime</option>
                      </select>

                      <select
                        value={bulkPaymentMode}
                        onChange={(e) => setBulkPaymentMode(e.target.value as any)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="upi">📱 UPI</option>
                        {isMainAdmin && <option value="scholarship">🎓 Free (₹0)</option>}
                      </select>

                      <input
                        type="number"
                        min={0}
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(Number(e.target.value))}
                        placeholder="₹ Amount"
                        className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                      />

                      <button
                        type="button"
                        onClick={handleBulkApply}
                        disabled={selectedRowIds.size === 0}
                        className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-extrabold text-xs hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        Apply to Selected
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRows([]);
                        setSelectedRowIds(new Set());
                      }}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Clear All Rows
                    </button>
                  </div>
                )}

                {/* Table Container */}
                <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-[380px] scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-extrabold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={rows.length > 0 && selectedRowIds.size === rows.length}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="p-3 min-w-[140px]">Student Mobile &amp; Name</th>
                        <th className="p-3 min-w-[110px]">Already Owned</th>
                        <th className="p-3 min-w-[180px]">Course / Book to Grant</th>
                        <th className="p-3 min-w-[110px]">Validity</th>
                        <th className="p-3 min-w-[90px]">Payment</th>
                        <th className="p-3 min-w-[90px]">Fee (₹)</th>
                        <th className="p-3 min-w-[140px]">Remark / Notes</th>
                        <th className="p-3 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No students loaded yet. Paste lines or upload CSV above to get started.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => {
                          const isSelected = selectedRowIds.has(row.id);
                          return (
                            <tr
                              key={row.id}
                              className={`hover:bg-slate-50/80 transition ${
                                isSelected ? "bg-blue-50/30" : ""
                              }`}
                            >
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectRow(row.id)}
                                  className="rounded"
                                />
                              </td>

                              {/* Student Info */}
                              <td className="p-3">
                                <div className="font-mono font-bold text-slate-900">
                                  +91 {row.phone}
                                </div>
                                <input
                                  type="text"
                                  value={row.name}
                                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                                  className="text-[11px] text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full"
                                />
                              </td>

                              {/* Already Owned Badge */}
                              <td className="p-3">
                                {row.existingCourses && row.existingCourses.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {row.existingCourses.slice(0, 2).map((ec, i) => (
                                      <span
                                        key={i}
                                        className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold truncate max-w-[110px]"
                                        title={`${ec.itemTitle} (${ec.daysLeft}d left)`}
                                      >
                                        {ec.itemTitle} ({ec.daysLeft}d)
                                      </span>
                                    ))}
                                    {row.existingCourses.length > 2 && (
                                      <span className="text-[10px] text-slate-400">
                                        +{row.existingCourses.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400">New Learner</span>
                                )}
                              </td>

                              {/* Course Dropdown */}
                              <td className="p-3">
                                <select
                                  value={row.courseId}
                                  onChange={(e) => updateRow(row.id, { courseId: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-[#0E1B3D]"
                                >
                                  <option value="all">🌟 All Courses Bundle</option>
                                  <optgroup label="🎓 Courses">
                                    {courses.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.code}: {c.title}
                                      </option>
                                    ))}
                                  </optgroup>
                                  {books.length > 0 && (
                                    <optgroup label="📚 Books">
                                      {books.map((b) => (
                                        <option key={b.id} value={b.id}>
                                          {b.code || "BK"}: {b.title}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </td>

                              {/* Validity Dropdown */}
                              <td className="p-3">
                                <select
                                  value={row.months}
                                  onChange={(e) =>
                                    updateRow(row.id, { months: Number(e.target.value) })
                                  }
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                >
                                  <option value={1}>1 Month</option>
                                  <option value={3}>3 Months</option>
                                  <option value={6}>6 Months</option>
                                  <option value={12}>1 Year</option>
                                  <option value={120}>Lifetime</option>
                                </select>
                              </td>

                              {/* Payment Mode */}
                              <td className="p-3">
                                <select
                                  value={row.paymentMode}
                                  onChange={(e) => {
                                    const mode = e.target.value as any;
                                    updateRow(row.id, {
                                      paymentMode: mode,
                                      amount: mode === "scholarship" ? 0 : row.amount || defaultPrice,
                                    });
                                  }}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                >
                                  <option value="cash">💵 Cash</option>
                                  <option value="upi">📱 UPI</option>
                                  {isMainAdmin && <option value="scholarship">🎓 Free</option>}
                                </select>
                              </td>

                              {/* Amount Paid (₹) */}
                              <td className="p-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1 text-slate-400 font-bold">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={row.amount}
                                    onChange={(e) =>
                                      updateRow(row.id, { amount: Number(e.target.value) })
                                    }
                                    className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                  />
                                </div>
                              </td>

                              {/* Remarks */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={row.remarks || ""}
                                  onChange={(e) => updateRow(row.id, { remarks: e.target.value })}
                                  placeholder="e.g. Paid ₹500, bal next month"
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                                />
                              </td>

                              {/* Delete Row */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeRow(row.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 font-bold text-sm"
                                  title="Remove row"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Summary & Confirm Action */}
                {rows.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold">Total Students:</span>{" "}
                        <span className="font-extrabold text-slate-900">{summary.rowCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Total Cash:</span>{" "}
                        <span className="font-extrabold text-emerald-700">
                          ₹{summary.totalCash.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Total UPI:</span>{" "}
                        <span className="font-extrabold text-purple-700">
                          ₹{summary.totalUpi.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmBatchActivate}
                        disabled={isProcessing || rows.length === 0}
                        className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span>
                          {isProcessing
                            ? "Activating..."
                            : `✅ Confirm & Activate All (${rows.length} Students)`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
