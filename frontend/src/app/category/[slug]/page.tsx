import { Metadata } from "next";
import { CategoryView, getCategoryMetadata, CATEGORY_MAP } from "../../../components/CategoryView";

export const revalidate = 60;

export function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return getCategoryMetadata(resolvedParams.slug, 1);
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <CategoryView slug={resolvedParams.slug} pageNumber={1} />;
}
