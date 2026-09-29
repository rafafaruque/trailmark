import { notFound } from "next/navigation";
import { events, notices } from "@/lib/fixtures";
import { NoticeReview } from "@/components/notice-review";

export function generateStaticParams() {
  return notices.map((notice) => ({ id: notice.eventId }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = events.find((event) => event.id === id);
  return {
    title: event ? `Review notice — ${event.title}` : "Notice not found",
  };
}
export default async function NoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = events.find((event) => event.id === id);
  const draft = notices.find((notice) => notice.eventId === id);
  if (!event || !draft) notFound();
  return <NoticeReview event={event} draft={draft} />;
}
