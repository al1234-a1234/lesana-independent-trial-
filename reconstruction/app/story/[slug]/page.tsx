import { notFound } from "next/navigation";
import { stories } from "@/lib/catalog";
import { Study } from "@/components/study";
export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}
export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!stories.some((s) => s.slug === slug)) notFound();
  return <Study slug={slug} />;
}
