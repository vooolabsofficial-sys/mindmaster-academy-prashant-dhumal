import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LessonWatchStat } from "@/lib/types";
import { authenticateStaffRequest } from "@/lib/serverAuthGuard";
import {
  watchStatsGetQuerySchema,
  watchStatsPostBodySchema,
  formatZodError,
} from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = watchStatsGetQuerySchema.safeParse({
      lesson_id: searchParams.get("lesson_id") || undefined,
      user_id: searchParams.get("user_id") || undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: formatZodError(parsedQuery.error) }, { status: 400 });
    }
    const lessonId = parsedQuery.data.lesson_id;
    const requestedUserId = parsedQuery.data.user_id;

    // Case 1: Student querying their own progress for a lesson (auto-resume sync)
    if (lessonId) {
      let studentId = requestedUserId;
      if (!studentId) {
        const studentCookie = req.cookies.get("mma_student_session")?.value;
        if (studentCookie) {
          try {
            const session = JSON.parse(studentCookie);
            studentId = session.userId || session.id || session.user_id;
          } catch {}
        }
      }

      if (!studentId) {
        try {
          const supabase = createAdminClient();
          const authHeader = req.headers.get("authorization");
          if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) studentId = user.id;
          }
        } catch {}
      }

      if (!studentId) {
        return NextResponse.json(
          { error: "Unauthorized: student session or user_id required" },
          { status: 401 }
        );
      }

      const supabase = createAdminClient();
      const { data: prog, error: progErr } = await supabase
        .from("progress")
        .select("position_sec, completed, updated_at")
        .eq("user_id", studentId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (progErr) {
        return NextResponse.json({ error: progErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        lesson_id: lessonId,
        progress: prog || null,
      });
    }

    // Case 2: Staff / Admin viewing aggregated analytics
    const { session: staffSession, errorResponse } = authenticateStaffRequest(req, {
      requiredRole: "main_admin",
    });
    if (errorResponse || !staffSession) {
      return (
        errorResponse ||
        NextResponse.json({ error: "Forbidden: Watch statistics require main_admin authority" }, { status: 403 })
      );
    }

    let stats: LessonWatchStat[] = [];
    try {
      const supabase = createAdminClient();
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, course_id, duration_sec, courses(id, title)");

      if (lessons && lessons.length > 0) {
        const { data: progressRows } = await supabase
          .from("progress")
          .select("user_id, lesson_id, position_sec, completed, updated_at, profiles(full_name, phone)");

        stats = lessons.map((les: any) => {
          const relatedProgress = (progressRows || []).filter((p: any) => p.lesson_id === les.id);
          const totalViews = relatedProgress.length;
          const uniqueStudents = new Set(relatedProgress.map((p: any) => p.user_id)).size;
          const completedCount = relatedProgress.filter((p: any) => p.completed).length;
          const totalWatchedSec = relatedProgress.reduce((sum: number, p: any) => sum + (p.position_sec || 0), 0);
          const duration = les.duration_sec || 1;
          const avgPct = totalViews > 0 ? Math.min(100, Math.round((totalWatchedSec / (totalViews * duration)) * 100)) : 0;
          const completionRate = totalViews > 0 ? Math.round((completedCount / totalViews) * 100) : 0;

          return {
            lessonId: les.id,
            lessonTitle: les.title,
            courseId: les.course_id,
            courseTitle: les.courses?.title || "Course",
            durationSec: les.duration_sec || 0,
            totalViews,
            uniqueStudents,
            avgWatchPercentage: avgPct,
            completionRate,
            totalWatchHours: Number((totalWatchedSec / 3600).toFixed(1)),
            recentWatches: relatedProgress.slice(-5).map((p: any) => ({
              studentName: p.profiles?.full_name || "Student",
              studentPhone: p.profiles?.phone || "",
              watchedSec: p.position_sec || 0,
              completionPct: Math.min(100, Math.round(((p.position_sec || 0) / duration) * 100)),
              lastWatchedAt: p.updated_at || new Date().toISOString(),
            })),
          };
        });
      }
    } catch (dbErr) {
      console.warn("Error querying watch stats from DB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      watchStats: stats,
      count: stats.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load watch statistics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = watchStatsPostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid payload: ${formatZodError(parsed.error)}` },
        { status: 400 }
      );
    }
    const user_id = body.user_id;

    // Determine student ID: from cookie, request body, or auth token
    let studentId = user_id;
    if (!studentId) {
      const studentCookie = req.cookies.get("mma_student_session")?.value;
      if (studentCookie) {
        try {
          const session = JSON.parse(studentCookie);
          studentId = session.userId || session.id || session.user_id;
        } catch {}
      }
    }

    if (!studentId) {
      try {
        const supabaseAuth = createAdminClient();
        const authHeader = req.headers.get("authorization");
        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          const { data: { user } } = await supabaseAuth.auth.getUser(token);
          if (user) studentId = user.id;
        }
      } catch {}
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Unauthorized: student session required to save progress" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    if ("batch" in parsed.data) {
      const { batch } = parsed.data;
      const rows = batch.map((item) => ({
        user_id: item.user_id || studentId,
        lesson_id: item.lesson_id,
        position_sec: Math.max(0, Math.floor(item.position_sec)),
        completed: Boolean(item.completed),
        updated_at: new Date().toISOString(),
      }));

      const { error: batchErr } = await supabase
        .from("progress")
        .upsert(rows, { onConflict: "user_id,lesson_id" });

      if (batchErr) {
        console.warn("Error batch saving watch progress to Supabase:", batchErr);
        return NextResponse.json({ error: batchErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        count: rows.length,
        synced: true,
      });
    }

    const { lesson_id, position_sec, completed } = parsed.data;

    const { error: upsertErr } = await supabase.from("progress").upsert(
      {
        user_id: studentId,
        lesson_id,
        position_sec: Math.max(0, Math.floor(position_sec)),
        completed: Boolean(completed),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

    if (upsertErr) {
      console.warn("Error saving watch progress to Supabase:", upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lesson_id,
      position_sec: Math.floor(position_sec),
      completed: Boolean(completed),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save watch progress" },
      { status: 500 }
    );
  }
}
