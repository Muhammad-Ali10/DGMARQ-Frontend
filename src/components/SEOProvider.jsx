import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { buildCanonicalUrl, truncateMetaDescription } from '../utils/meta';

export const DEFAULT_SEO = {
  title: 'DGMARQ Digital Marketplace For Gaming Products Keys/Accounts',
  description:
    'DG Marq is a digital marketplace for games, software, and digital accounts with instant delivery, secure payments, and 24/7 support.',
};

const SEOContext = createContext(null);

function resolveSeo(pageSeo) {
  const useDefaults = pageSeo?.useDefaults !== false;
  const title =
    (typeof pageSeo?.title === 'string' && pageSeo.title.trim()) ||
    (useDefaults ? DEFAULT_SEO.title : DEFAULT_SEO.title);

  const rawDescription =
    (typeof pageSeo?.description === 'string' && pageSeo.description.trim()) ||
    (useDefaults ? DEFAULT_SEO.description : DEFAULT_SEO.description);

  return {
    title: title.trim(),
    description: truncateMetaDescription(rawDescription),
    image: typeof pageSeo?.image === 'string' ? pageSeo.image.trim() : '',
    canonical: pageSeo?.canonical ? buildCanonicalUrl(pageSeo.canonical) : null,
    noindex: Boolean(pageSeo?.noindex),
  };
}

export function SEOProvider({ children }) {
  const [pageSeo, setPageSeo] = useState(null);
  const location = useLocation();

  const seo = useMemo(() => resolveSeo(pageSeo), [pageSeo]);
  const canonical =
    seo.canonical || buildCanonicalUrl(`${location.pathname}${location.search}`);

  return (
    <SEOContext.Provider value={setPageSeo}>
      <Helmet prioritizeSeoTags>
        <html lang="en" />
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        {seo.noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow" />
        )}
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DGMARQ" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={canonical} />
        {seo.image ? <meta property="og:image" content={seo.image} /> : null}
        <meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        {seo.image ? <meta name="twitter:image" content={seo.image} /> : null}
      </Helmet>
      {children}
    </SEOContext.Provider>
  );
}

/**
 * Sets document title + meta description (via SEOProvider + Helmet).
 * Prefer this over per-page Helmet blocks to avoid duplicate/conflicting tags.
 */
export function useSEO({
  title,
  description,
  image,
  canonical,
  noindex = false,
  useDefaults = true,
} = {}) {
  const setPageSeo = useContext(SEOContext);
  const location = useLocation();

  useEffect(() => {
    if (!setPageSeo) return undefined;

    setPageSeo({
      title,
      description,
      image,
      canonical,
      noindex,
      useDefaults,
    });

    return () => setPageSeo(null);
  }, [
    setPageSeo,
    title,
    description,
    image,
    canonical,
    noindex,
    useDefaults,
    location.pathname,
    location.search,
  ]);
}
