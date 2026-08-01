import { Link, useLocation } from "react-router-dom";
import { Home, LifeBuoy, Search } from "lucide-react";
import { Button } from "@components/ui/button";
import { useSEO } from "@components/common/SEOProvider";

/**
 * Catch-all for unmatched URLs. Without this the router matched nothing and
 * rendered an empty document — a typo'd link, a stale bookmark or a renamed
 * route all produced a blank page with no way back.
 *
 * noindex: a 404 must never enter the search index.
 */
const NotFound = () => {
  const { pathname } = useLocation();

  useSEO({
    title: "Page not found | DGMARQ",
    description: "The page you were looking for does not exist or has moved.",
    noindex: true,
  });

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-fg-subtle text-sm font-semibold tracking-[0.2em] uppercase">
        Error 404
      </p>

      <h1 className="text-fg mt-3 text-4xl font-bold sm:text-5xl">
        This page doesn&apos;t exist
      </h1>

      <p className="text-fg-muted mt-4 text-base">
        The link may be out of date, or the page may have moved. Nothing is wrong
        with your account and no order was affected.
      </p>

      {/* The attempted path, so a mistyped URL is self-evident. */}
      <p className="text-fg-subtle bg-surface-1 border-border mt-6 max-w-full truncate rounded-md border px-3 py-2 font-mono text-sm">
        {pathname}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/">
            <Home aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/marketplace">
            <Search aria-hidden="true" />
            Browse the marketplace
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/buyer-support">
            <LifeBuoy aria-hidden="true" />
            Get support
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
