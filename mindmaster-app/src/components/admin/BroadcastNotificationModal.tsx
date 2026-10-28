"use client";

import React, { useState } from "react";
import { StudentRecord } from "@/lib/types";
import { addStudentNotification } from "@/lib/studentNotificationStore";
import { StaffCourse, getStaffStudents, logStaffAction, getCurrentStaff } from "@/lib/staffStore";
import { normalizePhone } from "@/lib/phoneUtils";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: StaffCourse[];
  defaultTarget?: "all" | "course" | "expiring_7d";
  defaultCourseId?: string;
  onSuccess?: (message: string) => void;
}

export default function BroadcastNotificationModal({
  isOpen,
  onClose,
  courses,
  defaultTarget = "all",
  defaultCourseId = "",
  onSuccess,
}: BroadcastModalProps) {
  const [targetAudience, setTargetAudience] = useState<"all" | "course" | "expiring_7d">(defaultTarget);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourseId || (courses[0]?.id || ""));
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("/courses");
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStaff = getCurrentStaff();

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMessage("Please provide both a notification title and message.");
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const allStudents = getStaffStudents();
      let targetUserIds: string[] = [];
      let recipientCount = 0;

      if (targetAudience === "all") {
        // Broadcast to "all" keyword
        addStudentNotification({
          userId: "all",
          title: title.trim(),
          body: message.trim(),
          type: "announcement",
          actionUrl: actionUrl.trim() || undefined,
        });
        recipientCount = allStudents.length;
      } else if (targetAudience === "course") {
        const selCourse = courses.find((c) => c.id === selectedCourseId || c.code === selectedCourseId);
        const code = selCourse?.code || "";
        const titleMatch = selCourse?.title || "";

        const matchedStudents = allStudents.filter((s) => {
          return (
            s.enrolledCourseCodes?.includes(code) ||
            s.enrolledCourseTitles?.some((t) => t.includes(titleMatch)) ||
            (s.coursesTaken && s.coursesTaken.some((ct) => ct.courseId === selectedCourseId))
          );
        });

        matchedStudents.forEach((st) => {
          addStudentNotification({
            userId: st.id,
            title: title.trim(),
            body: message.trim(),
            type: "course",
            courseCode: code,
            courseTitle: titleMatch,
            actionUrl: actionUrl.trim() || `/watch/${selectedCourseId}`,
          });
        });
        recipientCount = matchedStudents.length;
      } else if (targetAudience === "expiring_7d") {
        const expiringStudents = allStudents.filter((s) => {
          const hasExpCourse = (s.coursesTaken || []).some(
            (c) => !c.isExpired && c.daysLeft !== undefined && c.daysLeft <= 7 && c.daysLeft > 0
          );
          const hasExpBook = (s.enrolledBooks || []).some(
            (b) => !b.isExpired && b.daysLeft !== undefined && b.daysLeft <= 7 && b.daysLeft > 0
          );
          return hasExpCourse || hasExpBook;
        });

        expiringStudents.forEach((st) => {
          addStudentNotification({
            userId: st.id,
            title: title.trim(),
            body: message.trim(),
            type: "renewal",
            actionUrl: actionUrl.trim() || "/courses",
          });
        });
        recipientCount = expiringStudents.length;
      }

      logStaffAction(
        "BROADCAST_NOTIFICATION_SENT",
        "message",
        targetAudience,
        title.trim(),
        `Staff (${currentStaff.role} - ${currentStaff.name}) sent broadcast alert to ${recipientCount} student(s) [Target: ${targetAudience}]`
      );

      const successNotice = `Broadcast sent successfully to ${recipientCount} student(s)!`;
      if (onSuccess) onSuccess(successNotice);
      onClose();
    } catch (err: any) {
      setStatusMessage(err?.message || "Failed to dispatch broadcast notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-blue-200 max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-4 my-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-200">
              📢
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0E1B3D]">
                Send In-App Broadcast Alert
              </h3>
              <p className="text-[11px] text-slate-500">
                Pushes instant alert directly to student notification bell &amp; portal
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

        {statusMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
          {/* Target Audience Tabs */}
          <div>
            <label className="block font-bold text-[#0E1B3D] mb-1.5">
              Select Target Audience *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience("all")}
                className={`p-2.5 rounded-xl border text-left font-bold transition ${
                  targetAudience === "all"
                    ? "bg-blue-50 text-blue-800 border-blue-400 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="text-sm">🌐 All Students</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Whole academy</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("course")}
                className={`p-2.5 rounded-xl border text-left font-bold transition ${
                  targetAudience === "course"
                    ? "bg-blue-50 text-blue-800 border-blue-400 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="text-sm">🎓 Specific Course</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Enrolled batch only</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("expiring_7d")}
                className={`p-2.5 rounded-xl border text-left font-bold transition ${
                  targetAudience === "expiring_7d"
                    ? "bg-amber-50 text-amber-900 border-amber-400 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="text-sm">⚠️ Expiring Soon</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">In next 7 days</div>
              </button>
            </div>
          </div>

          {/* If Course Selected: Course Dropdown */}
          {targetAudience === "course" && (
            <div>
              <label className="block font-bold text-[#0E1B3D] mb-1">
                Select Course Batch *
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-bold text-[#0E1B3D] mb-1">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Live Chapter Uploaded | Revision Drill"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block font-bold text-[#0E1B3D] mb-1">
              Notification Message *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message for students..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0E1B3D] focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Action Link */}
          <div>
            <label className="block font-bold text-[#0E1B3D] mb-1">
              1-Click Button Action Link (Optional)
            </label>
            <input
              type="text"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="e.g. /courses or /books or /watch"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#0E1B3D] focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSending ? "Dispatching..." : "📢 Send Broadcast Alert"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
