export const SITE_URL = 'https://www.dgmarq.com';

/** Strip HTML tags and collapse whitespace for meta tags. */
export function stripHtml(value) {
  if (value == null || typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trim to recommended meta description length (Google ~155–160 chars). */
export function truncateMetaDescription(text, maxLength = 160) {
  const cleaned = stripHtml(text);
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.substring(0, maxLength - 3).trim()}...`;
}

export function buildCanonicalUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}
