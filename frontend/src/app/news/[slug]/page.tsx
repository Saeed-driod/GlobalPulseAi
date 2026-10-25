import React, { Suspense, cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchArticleBySlug } from "../../../lib/api";
import { ArticleDetailClient } from "./ArticleDetailClient";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

// Request-scoped memoization to ensure GET /api/articles/{slug} view count increments exactly once per user page view
const getCachedArticleBySlug = cache(async (slug: string) => {
  return await fetchArticleBySlug(slug);
});

// Robust helper to extract FAQ items from article markdown content for JSON-LD FAQPage schema
function extractFaqItems(content: string): Array<{ question: string; answer: string }> {
  if (!content) return [];
  const faqs: Array<{ question: string; answer: string }> = [];

  // Match: **Q: ...?** or Q1: ...? followed by **A:** or A:
  const regex = /(?:(?:\*\*Q(?:\d+)?:\s*|\bQ(?:\d+)?:\s*|\*\*Question(?:\d+)?:\s*)([^\n*?]+(?:\?|\.|\:))\**)\s*\n+(?:(?:\*\*A:\s*|\bA:\s*|\*\*Answer:\s*)([\s\S]*?))(?=\n+(?:\*\*Q|\bQ\d*:|\*\*Question|###|$))/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const q = match[1].replace(/[*#_]/g, "").trim();
    const a = match[2].replace(/[*#_]/g, "").trim();
    if (q && a) {
      faqs.push({ question: q, answer: a });
    }
  }

  // Fallback: Check section under "Frequently Asked Questions"
  if (faqs.length === 0 && /Frequently Asked Questions/i.test(content)) {
    const faqSection = content.split(/###\s*Frequently Asked Questions/i)[1] || "";
    const blocks = faqSection.split(/\n(?=\*\*Q|\bQ\d*:|\bQuestion)/i);
    for (const b of blocks) {
      const parts = b.split(/\n(?:\*\*A:|\bA:|\*\*Answer:)/i);
      if (parts.length >= 2) {
        const q = parts[0].replace(/[*#_]|(?:\*\*Q\d*:|\bQ\d*:)/gi, "").trim();
        const a = parts[1].replace(/[*#_]/g, "").trim();
        if (q && a) {
          faqs.push({ question: q, answer: a });
        }
      }
    }
  }

  return faqs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getCachedArticleBySlug(resolvedParams.slug);

  if (!article) {
    return {
      title: "Dossier Not Found | GlobalPulse AI",
      description: "The requested intelligence dispatch could not be retrieved from the wire.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globlepulseai.onrender.com").replace(/\/$/, "");
  const cleanSummary = article.summary.replace(/^[•▸*-\s]+/gm, " ").trim().slice(0, 160);
  const articleUrl = `${siteUrl}/news/${article.slug}`;
  const imageUrl = article.image_url || `${siteUrl}/default-thumbnail.jpg`;
  const authorName = article.author_name || "Muhammad Saeed (Chief Editor, GlobalPulse AI)";

  return {
    title: `${article.title} | GlobalPulse AI`,
    description: cleanSummary,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      locale: "en_US",
      url: articleUrl,
      title: article.title,
      description: cleanSummary,
      siteName: "GlobalPulse AI",
      publishedTime: article.published_at || article.created_at,
      authors: [authorName, "https://www.youtube.com/@GloblePulseAi"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: cleanSummary,
      creator: "@GloblePulseAi",
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const article = await getCachedArticleBySlug(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globlepulseai.onrender.com").replace(/\/$/, "");
  const articleUrl = `${siteUrl}/news/${resolvedParams.slug}`;
  const cleanSummary = article.summary.replace(/^[•▸*-\s]+/gm, " ").trim() || "";

  // 1. NewsArticle Schema with Muhammad Saeed Person author
  const newsArticleSchema = article
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
        headline: article.title,
        description: cleanSummary,
        image: [article.image_url || `${siteUrl}/default-thumbnail.jpg`],
        datePublished: article.published_at || article.created_at,
        dateModified: article.published_at || article.created_at,
        author: {
          "@type": "Person",
          name: "Muhammad Saeed",
          jobTitle: "Chief Editor, GlobalPulse AI",
          url: "https://www.youtube.com/@GloblePulseAi",
          sameAs: ["https://www.youtube.com/@GloblePulseAi"],
        },
        publisher: {
          "@type": "NewsMediaOrganization",
          name: "GlobalPulse AI",
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/logo.png`,
          },
        },
      }
    : null;

  // 2. VideoObject Schema (when youtube_video_id is present)
  const videoObjectSchema =
    article && article.youtube_video_id
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: article.title,
          description: cleanSummary,
          thumbnailUrl: [
            `https://img.youtube.com/vi/${article.youtube_video_id}/maxresdefault.jpg`,
            `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`,
            article.image_url || `${siteUrl}/default-thumbnail.jpg`,
          ],
          uploadDate: article.published_at || article.created_at,
          contentUrl: `https://www.youtube.com/watch?v=${article.youtube_video_id}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${article.youtube_video_id}`,
          publisher: {
            "@type": "Organization",
            name: "GlobalPulse AI",
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/logo.png`,
            },
          },
        }
      : null;

  // 3. FAQPage Schema extracted from article FAQ section
  const faqItems = article ? extractFaqItems(article.content) : [];
  const faqPageSchema =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      {newsArticleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
        />
      )}
      {videoObjectSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectSchema) }}
        />
      )}
      {faqPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      )}
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 text-neutral-100 flex items-center justify-center font-mono text-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-neutral-400">Loading Intelligence Dossier...</span>
            </div>
          </div>
        }
      >
        <ArticleDetailClient initialArticle={article} slug={resolvedParams.slug} />
      </Suspense>
    </>
  );
}
