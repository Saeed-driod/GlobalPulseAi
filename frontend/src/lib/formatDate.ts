/**
 * Date and Time Formatting Helpers for GlobalPulse AI
 * Built on Intl.DateTimeFormat with zero external libraries.
 */

export function parseIsoUtc(iso?: string | null | Date): Date | null {
  if (!iso) return null;
  if (iso instanceof Date) {
    return isNaN(iso.getTime()) ? null : iso;
  }
  let str = String(iso).trim();
  if (!str) return null;

  // Normalize space separator to ISO 'T'
  str = str.replace(" ", "T");

  // If no timezone suffix (no 'Z' or +/-hh:mm), treat as UTC (backend stores UTC)
  if (!str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Public website formatter:
 * Returns e.g. "18 Nov 2026, 05:15 UTC"
 * Fixed UTC so server and browser render the exact same text with zero hydration mismatch.
 */
export function formatPublishedUtc(iso?: string | null | Date): string {
  const d = parseIsoUtc(iso);
  if (!d) return "";

  try {
    const dtf = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(dtf.formatToParts(d).map((p) => [p.type, p.value]));
    if (!parts.day || !parts.month || !parts.year || parts.hour === undefined || parts.minute === undefined) {
      return "";
    }
    return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} UTC`;
  } catch {
    return "";
  }
}

/**
 * Admin panel formatter:
 * Returns e.g. "18 Nov 2026, 10:15 AM PKT"
 * Uses timeZone "Asia/Karachi".
 */
export function formatAdminPkt(iso?: string | null | Date): string {
  const d = parseIsoUtc(iso);
  if (!d) return "";

  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const parts = Object.fromEntries(dtf.formatToParts(d).map((p) => [p.type, p.value]));
    if (!parts.day || !parts.month || !parts.year || parts.hour === undefined || parts.minute === undefined) {
      return "";
    }
    const period = (parts.dayPeriod || "").toUpperCase();
    return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}${period ? " " + period : ""} PKT`;
  } catch {
    return "";
  }
}
