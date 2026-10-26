"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/books");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Redirecting to Books...</p>
      </div>
    </div>
  );
}
