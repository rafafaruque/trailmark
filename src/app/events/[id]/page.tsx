import { notFound } from "next/navigation";
import { EventDetail } from "@/components/event-detail";
import { events, getProject } from "@/lib/fixtures";

export function generateStaticParams() {
  return events.map((event) => ({ id: event.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = events.find((event) => event.id === id);
  return {
    title: event
      ? `${getProject(event.projectId).name} — ${event.title}`
      : "Change not found",
  };
}
export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = events.find((event) => event.id === id);
  if (!event) notFound();
  return <EventDetail event={event} />;
}
