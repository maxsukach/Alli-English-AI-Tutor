import { LessonPlayground } from "@/components/lesson/LessonPlayground";

export const dynamic = "force-dynamic";

export default function LessonPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-6">
      <LessonPlayground />
    </main>
  );
}
