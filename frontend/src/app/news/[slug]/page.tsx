import React, { Suspense, cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchArticleBySlug } from "../../../lib/api";
import { getHdImageUrl } from "../../../lib/imageOptimizer";
import { ArticleDetailClient } from "./ArticleDetailClient";

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

// Request-scoped memoization
const getCachedArticleBySlug = cache(async (slug: string) => {
  return await fetchArticleBySlug(slug);
});

// Ensures dates are compliant with Google Structured Data ISO 8601 with explicit timezone
function formatIsoWithTimezone(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {}

  let clean = String(dateStr).trim().replace(" ", "T");
  if (!clean.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(clean)) {
    clean += "Z";
  }
  return clean;
}

// Formats a complete grammatical sentence between 140-155 characters for meta description
function buildCompleteMetaDescription(title: string, summary: string, content?: string, existingMeta?: string | null): string {
  if (existingMeta && existingMeta.length >= 135 && existingMeta.length <= 160) {
    return existingMeta.trim();
  }

  // Extract first fact sentence from summary or content
  const rawText = (summary || "") + " " + (content || "");
  const clean = rawText
    .replace(/^[•▸*-\s]+/gm, "")
    .replace(/[#*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Find the first complete sentence
  const sentenceMatch = clean.match(/^([^.!?]+[.!?])/);
  let firstFact = sentenceMatch ? sentenceMatch[1].trim() : clean;

  if (firstFact.length > 155) {
    firstFact = firstFact.slice(0, 154).replace(/\s+\S*$/, "").trim() + ".";
  }

  if (firstFact.length >= 140 && firstFact.length <= 155) {
    return firstFact;
  }

  if (firstFact.length < 140) {
    const withoutPeriod = firstFact.replace(/\.+$/, "").trim();
    const extensions = [
      ", according to primary dispatch reporting and corroborated facts.",
      ", based on confirmed details reported from official sources.",
      ", according to direct statements and published documentation.",
      ", corroborated by confirmed dispatches and primary records."
    ];
    for (const ext of extensions) {
      const candidate = `${withoutPeriod}${ext}`;
      if (candidate.length >= 140 && candidate.length <= 155) {
        return candidate;
      }
    }
    const filler = ", according to confirmed reporting and primary source documentation.";
    const candidate = `${withoutPeriod}${filler}`;
    if (candidate.length > 155) {
      return candidate.slice(0, 154).replace(/\s+\S*$/, "").trim() + ".";
    }
    return candidate;
  }

  return firstFact;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getCachedArticleBySlug(resolvedParams.slug);

  if (!article) {
    return {
      title: { absolute: "Article Not Found | GlobalPulse AI" },
      description: "The requested article could not be retrieved from the wire.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app").replace(/\/$/, "");
  const metaDescription = buildCompleteMetaDescription(article.title, article.summary, article.content, article.meta_description);
  const articleUrl = `${siteUrl}/news/${article.slug}`;
  const imageUrl = article.image_url ? getHdImageUrl(article.image_url) : `${siteUrl}/default-thumbnail.jpg`;
  const authorName = "GlobalPulse AI Desk";

  // Single brand mention in title format: "{headline} | GlobalPulse AI"
  const cleanHeadline = article.title.replace(/\s*\|\s*GlobalPulse AI/gi, "").trim();
  const pageTitle = `${cleanHeadline} | GlobalPulse AI`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: metaDescription,
    robots: {
      index: !article.is_noindex,
      follow: true,
      nocache: false,
      googleBot: {
        index: !article.is_noindex,
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
      title: pageTitle,
      description: metaDescription,
      siteName: "GlobalPulse AI",
      publishedTime: formatIsoWithTimezone(article.published_at || article.created_at),
      modifiedTime: formatIsoWithTimezone(article.published_at || article.created_at),
      authors: [authorName],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: cleanHeadline,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: metaDescription,
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

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://globalpulseai.vercel.app").replace(/\/$/, "");
  const articleUrl = `${siteUrl}/news/${resolvedParams.slug}`;
  const metaDescription = buildCompleteMetaDescription(article.title, article.summary, article.content, article.meta_description);

  // NewsArticle JSON-LD Schema (author: GlobalPulse AI Desk)
  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.title.replace(/\s*\|\s*GlobalPulse AI/gi, "").trim(),
    description: metaDescription,
    image: [article.image_url || `${siteUrl}/default-thumbnail.jpg`],
    datePublished: formatIsoWithTimezone(article.published_at || article.created_at),
    dateModified: formatIsoWithTimezone(article.published_at || article.created_at),
    author: {
      "@type": "Organization",
      name: "GlobalPulse AI Desk",
      url: siteUrl,
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
  };

  // VideoObject Schema (when youtube_video_id is present)
  const videoObjectSchema = article.youtube_video_id
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: article.title,
        description: metaDescription,
        thumbnailUrl: [
          `https://img.youtube.com/vi/${article.youtube_video_id}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`,
          article.image_url || `${siteUrl}/default-thumbnail.jpg`,
        ],
        uploadDate: formatIsoWithTimezone(article.published_at || article.created_at),
        contentUrl: `https://www.youtube.com/watch?v=${article.youtube_video_id}`,
        embedUrl: `https://www.youtube.com/embed/${article.youtube_video_id}`,
        publisher: {
          "@type": "NewsMediaOrganization",
          name: "GlobalPulse AI",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/logo.png`,
          },
        },
      }
    : null;

  return (
    <>
      <link rel="canonical" href={articleUrl} />
      <meta
        name="robots"
        content={
          article.is_noindex
            ? "noindex, follow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      {videoObjectSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectSchema) }}
        />
      )}
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 text-neutral-100 flex items-center justify-center font-mono text-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-neutral-400">Loading article...</span>
            </div>
          </div>
        }
      >
        <ArticleDetailClient initialArticle={article} slug={resolvedParams.slug} />
      </Suspense>
    </>
  );
}
