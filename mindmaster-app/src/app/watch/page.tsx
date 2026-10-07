import { redirect } from "next/navigation";
import { MOCK_LESSONS } from "@/lib/mockData";

export default function WatchIndexPage() {
  const defaultLessonId = MOCK_LESSONS[0]?.id || "les-mm01-01";
  redirect(`/watch/${defaultLessonId}`);
}
