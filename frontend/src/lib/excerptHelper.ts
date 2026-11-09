/**
 * Strips reporting attribution tags like "... Reported by Reuters." from text.
 */
function cleanReportedByPattern(text: string): string {
  return text
    .replace(/(?:\.\.\.|\.\.|\.)?\s*Reported by\s+[^.!?]+(?:\.|$)/gi, "")
    .replace(/\s*--\s*Reported by\s+[^.!?]+(?:\.|$)/gi, "")
    .replace(/\s*\|\s*Reported by\s+[^.!?]+(?:\.|$)/gi, "")
    .trim();
}

/**
 * Checks if a candidate snippet essentially repeats the headline.
 */
function repeatsHeadline(candidate: string, title?: string | null): boolean {
  if (!title) return false;
  const cNorm = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tNorm = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cNorm || !tNorm) return false;
  if (cNorm === tNorm) return true;
  if (cNorm.length > 20 && tNorm.includes(cNorm.slice(0, 30))) return true;
  if (tNorm.length > 20 && cNorm.includes(tNorm.slice(0, 30))) return true;
  return false;
}

/**
 * Extracts a clean key point or first body sentence (110-140 chars) for news cards.
 * Never repeats the headline. Strips "... Reported by X." patterns and generic filler.
 * Returns empty string if no valid unique excerpt is available (allowing cards to hide the line).
 */
export function getCleanExcerpt(article: {
  summary?: string | null;
  content?: string | null;
  title?: string | null;
}): string {
  if (!article) return "";

  // 1. Try summary lines (key points)
  if (article.summary) {
    const lines = article.summary
      .split("\n")
      .map((l) => l.replace(/^[•▸*-\s]+/, "").replace(/\*\*/g, "").trim())
      .filter((l) => l.length > 15);

    for (const rawLine of lines) {
      const line = cleanReportedByPattern(rawLine);
      const lower = line.toLowerCase();

      // Skip generic boilerplate filler
      if (
        lower.startsWith("verified dispatches from") ||
        lower.startsWith("high-stakes sports dispatch from") ||
        lower.startsWith("breaking intelligence confirmed by") ||
        lower.startsWith("according to verified sources") ||
        lower.includes("accelerating operational transition") ||
        lower.includes("decisive tactical adjustments") ||
        repeatsHeadline(line, article.title)
      ) {
        continue;
      }

      if (line.length >= 25) {
        return line.length > 140 ? line.slice(0, 137).replace(/\s+\S*$/, "").trim() + "..." : line;
      }
    }
  }

  // 2. Try narrative content first sentence
  if (article.content) {
    const paras = article.content
      .split(/\n\s*\n/)
      .map((p) => p.replace(/[#*`_]/g, "").trim())
      .filter((p) => p.length > 25 && !p.startsWith("###") && !p.startsWith("|"));

    for (const rawPara of paras) {
      const para = cleanReportedByPattern(rawPara.replace(/\s+/g, " "));
      const lower = para.toLowerCase();

      if (
        lower.startsWith("what happened") ||
        lower.startsWith("key points") ||
        lower.startsWith("why it matters") ||
        lower.includes("accelerating operational transition") ||
        repeatsHeadline(para, article.title)
      ) {
        continue;
      }

      // Extract first complete sentence
      const sentenceMatch = para.match(/^([^.!?]+[.!?])/);
      const firstSentence = sentenceMatch ? sentenceMatch[1].trim() : para;

      if (!repeatsHeadline(firstSentence, article.title) && firstSentence.length >= 25) {
        return firstSentence.length > 140
          ? firstSentence.slice(0, 137).replace(/\s+\S*$/, "").trim() + "..."
          : firstSentence;
      }
    }
  }

  // Never repeat the headline; return empty string so UI cleanly omits the line
  return "";
}

