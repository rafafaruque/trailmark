import { notFound } from "next/navigation";
import { projects } from "@/lib/fixtures";
import { ProjectDetail } from "@/components/library-pages";
export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title:
      projects.find((project) => project.id === id)?.name ||
      "Project not found",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((project) => project.id === id);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
