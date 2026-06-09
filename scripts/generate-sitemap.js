// ISSUE #50: Refresh the static public/sitemap.xml from the backend's DYNAMIC
// sitemap so the deployed file reflects the live catalog instead of going stale.
//
// The backend serves the authoritative, dynamically-generated sitemap at
// `<backend-origin>/sitemap.xml` (see DGMARQ-Backend/src/routes/sitemap.route.js).
// This script pulls it at deploy/build time and writes it into public/.
//
// Usage:  SITEMAP_SOURCE_URL=https://api.dgmarq.com/sitemap.xml node scripts/generate-sitemap.js
// Default source: VITE_API_BASE_URL origin (strip /api/v1) + /sitemap.xml.
//
// Best-effort: if the backend is unreachable (e.g. CI without a live API), it
// logs a warning and leaves the existing file in place — it never fails the build.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'sitemap.xml');

const apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const origin = apiBase.replace(/\/api\/v1\/?$/, '');
const source = process.env.SITEMAP_SOURCE_URL || `${origin}/sitemap.xml`;

try {
  const res = await fetch(source, { headers: { accept: 'application/xml' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) {
    throw new Error('Response did not look like a sitemap');
  }
  await writeFile(OUT, xml, 'utf8');
  console.log(`[sitemap] Wrote ${OUT} from ${source}`);
} catch (err) {
  console.warn(`[sitemap] Could not refresh from ${source}: ${err.message}. Keeping existing public/sitemap.xml.`);
  // Exit 0 — never block the build on sitemap freshness.
  process.exit(0);
}
