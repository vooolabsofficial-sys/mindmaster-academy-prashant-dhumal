import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function WatchIndexPage() {
  let targetLessonId: string | null = null;
  try {
    const supabase = createAdminClient();
    const { data: firstLesson } = await supabase
      .from("lessons")
      .select("id")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstLesson?.id) {
      targetLessonId = firstLesson.id;
    }
  } catch (e) {
    console.error("WatchIndexPage lookup error:", e);
  }

  if (targetLessonId) {
    redirect(`/watch/${targetLessonId}`);
  }

  redirect("/courses");
}
