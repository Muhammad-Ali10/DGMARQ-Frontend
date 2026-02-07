import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a URL to HTTPS
 * Converts HTTP URLs to HTTPS to prevent mixed content warnings
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized HTTPS URL
 */
export function normalizeToHttps(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}
