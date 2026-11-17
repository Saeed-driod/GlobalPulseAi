import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryView, getCategoryMetadata, CATEGORY_MAP } from "../../../../../components/CategoryView";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; n: string }> | { slug: string; n: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const pageNumber = parseInt(resolvedParams.n, 10);
  if (isNaN(pageNumber) || pageNumber < 1) {
    return {
      title: { absolute: "Not Found | GlobalPulse AI" },
      robots: { index: false, follow: false },
    };
  }
  return getCategoryMetadata(resolvedParams.slug, pageNumber);
}

export default async function CategoryPaginatedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const pageNumber = parseInt(resolvedParams.n, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    notFound();
  }

  // Page 1 canonical destination is /category/[slug]
  if (pageNumber === 1) {
    redirect(`/category/${resolvedParams.slug}`);
  }

  return <CategoryView slug={resolvedParams.slug} pageNumber={pageNumber} />;
}
