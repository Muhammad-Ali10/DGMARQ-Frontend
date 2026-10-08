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
  process.exit(0);
}
