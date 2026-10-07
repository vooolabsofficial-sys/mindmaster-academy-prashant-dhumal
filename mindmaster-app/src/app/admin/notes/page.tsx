"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { StaffUser, Book } from "@/lib/types";
import { getCurrentStaff, logStaffAction } from "@/lib/staffStore";
import { MOCK_BOOKS } from "@/lib/mockData";

export default function NotesAndBooksManagerPage() {
  const [staff, setStaff] = useState<StaffUser>(getCurrentStaff());
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("Vedic Maths Speed Foundation");
  const [newPages, setNewPages] = useState(45);

  useEffect(() => {
    setStaff(getCurrentStaff());
  }, []);

  const isMainAdmin = staff.role === "main_admin";

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete book "${title}"? (Admin only)`)) return;
    setBooks((prev) => prev.filter((b) => b.id !== id));
    logStaffAction(
      "BOOK_DELETE",
      "course",
      id,
      title,
      "Main admin deleted study book resource"
    );
    alert(`Book "${title}" deleted.`);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newBook: Book = {
      id: `bk-${Date.now()}`,
      courseId: "c1",
      courseTitle: newCourseTitle,
      title: newTitle.trim(),
      filePath: `/books/download-${Date.now()}.pdf`,
      pages: Number(newPages) || 50,
      fileSizeMb: 4.5,
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    };

    setBooks((prev) => [newBook, ...prev]);
    logStaffAction(
      "BOOK_CREATE",
      "course",
      newBook.id,
      newBook.title,
      `Added digital book "${newBook.title}" (${newBook.pages} pages)`
    );

    setIsModalOpen(false);
    setNewTitle("");
    alert("New Study Book published successfully!");
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PermissionGuard permission="notes.books.manage">
      <AdminShell>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E4E8F8] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#0E1B3D] font-heading">
                  Notes & Digital Books Manager
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  notes.books.manage
                </span>
              </div>
              <p className="text-xs text-[#5A6478] mt-1">
                Upload course PDF study materials, formula booklets, and manage official digital notes.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B57D0] text-white text-xs font-bold rounded-xl shadow hover:bg-[#095ABA] transition-all"
            >
              <span>➕</span> Add Digital Book / Notes
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4E8F8] shadow-sm">
            <input
              type="text"
              placeholder="Search books by title, course, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-4 py-2.5 rounded-xl border border-[#E4E8F8] focus:outline-none focus:border-[#0B57D0]"
            />
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white border border-[#E4E8F8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#0B57D0] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#8A94A6] mb-2">
                    <span className="font-semibold text-[#0B57D0]">{book.courseTitle}</span>
                    <span>{book.pages} Pages</span>
                  </div>
                  <h3 className="font-bold text-[#0E1B3D] text-base mb-1">{book.title}</h3>
                  <p className="text-xs text-[#5A6478]">PDF File Size: {book.fileSizeMb} MB</p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E4E8F8] flex items-center justify-between">
                  <a
                    href={book.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#0B57D0] hover:underline"
                  >
                    View Resource ↗
                  </a>

                  {/* Delete button hidden for Sub-Admin */}
                  {isMainAdmin && (
                    <button
                      onClick={() => handleDelete(book.id, book.title)}
                      className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Only Main Admin can delete"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Book Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E4E8F8]">
                <h3 className="text-lg font-bold text-[#0E1B3D] mb-4">Add New Digital Book / Note</h3>
                <form onSubmit={handleAddBook} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#0E1B3D] mb-1">Book Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Speed Maths Formula Handbook"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-2.5 border border-[#E4E8F8] rounded-xl focus:outline-none focus:border-[#0B57D0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0E1B3D] mb-1">Associated Course</label>
                    <input
                      type="text"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full p-2.5 border border-[#E4E8F8] rounded-xl focus:outline-none focus:border-[#0B57D0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0E1B3D] mb-1">Total Pages</label>
                    <input
                      type="number"
                      value={newPages}
                      onChange={(e) => setNewPages(Number(e.target.value))}
                      className="w-full p-2.5 border border-[#E4E8F8] rounded-xl focus:outline-none focus:border-[#0B57D0]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-[#E4E8F8] rounded-xl text-[#5A6478]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0B57D0] text-white font-bold rounded-xl shadow"
                    >
                      Publish Book
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </PermissionGuard>
  );
}
