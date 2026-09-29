import { EvidencePage } from "@/components/library-pages";
export const metadata = { title: "Evidence library" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  return <EvidencePage initialItem={item} />;
}
