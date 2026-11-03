"use client";

import React, { ReactNode, useEffect, useState } from "react";
import AdminTopbar from "./AdminTopbar";
import AdminSidebar from "./AdminSidebar";
import StudentDrawer from "./StudentDrawer";
import { StudentRecord } from "@/lib/types";
import { getStaffStudents } from "@/lib/staffStore";
import { triggerSupabaseKeepAlive } from "@/lib/keepAliveTrigger";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [drawerStudent, setDrawerStudent] = useState<StudentRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    triggerSupabaseKeepAlive();

    const handleOpenDrawer = (e: any) => {
      const detail = e.detail;
      if (!detail) return;

      if (detail.student) {
        setDrawerStudent(detail.student);
        setIsDrawerOpen(true);
        return;
      }

      if (detail.phone) {
        const cleanPhone = detail.phone.replace(/[^0-9]/g, "");
        const all = getStaffStudents();
        const found = all.find(
          (s) =>
            s.phone.replace(/[^0-9]/g, "").endsWith(cleanPhone.slice(-10)) ||
            Boolean((s as any).studentPhone && (s as any).studentPhone.replace(/[^0-9]/g, "").endsWith(cleanPhone.slice(-10)))
        );

        if (found) {
          setDrawerStudent(found);
        } else {
          // Synthetic student record to enable DRM reset and grant access
          const synthetic: StudentRecord = {
            id: `std-quick-${cleanPhone.slice(-10)}`,
            name: detail.name || `Student (${cleanPhone.slice(-10)})`,
            email: `${cleanPhone.slice(-10)}@student.mindmaster.academy`,
            phone: cleanPhone.slice(-10),
            district: "Maharashtra",
            enrolledCourseCodes: [],
            enrolledCourseTitles: [],
            totalWatchSec: 0,
            completedLessonsCount: 0,
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            status: "active",
          };
          setDrawerStudent(synthetic);
        }
        setIsDrawerOpen(true);
      }
    };

    window.addEventListener("mma_open_student_drawer", handleOpenDrawer);
    return () => window.removeEventListener("mma_open_student_drawer", handleOpenDrawer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] flex flex-col font-sans transition-colors duration-200">
      <AdminTopbar />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Student 360° Slide-Over Drawer */}
      <StudentDrawer
        student={drawerStudent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStudentUpdated={() => {
          // refresh triggers across window
          window.dispatchEvent(new CustomEvent("mma_students_changed"));
        }}
      />

      {/* Universal Enterprise Staff Footer */}
      <footer className="py-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#1E293B]/80 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        MindMaster Academy Staff Console • Satara Centre Hub • DRM &amp; Role Access Protected
      </footer>
    </div>
  );
}
