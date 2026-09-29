import type { Metadata } from "next";
import { EventQueue } from "@/components/event-queue";
export const metadata: Metadata = { title: "Change events" };
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  return (
    <>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">FROM THE FIELD, WITH CONTEXT</span>
          <h1>Change events</h1>
          <p>
            Follow the evidence. Protect the work that’s outside your scope.
          </p>
        </div>
        <span className="page-count">5 tracked events</span>
      </div>
      <EventQueue
        key={view || "all"}
        fullPage
        initialDeadlineOnly={view === "deadlines"}
      />
    </>
  );
}
