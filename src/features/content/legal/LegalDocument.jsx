import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, CircleAlert, Clock3, FileText, Link2, Mail, RefreshCw, Scale } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { cn } from '@lib/utils';
import { HUD_LABEL, HUD_VALUE } from '@lib/surface';
import { collectAnchors, estimateReadingMinutes, padNum, sectionAnchor } from './anchors';
import { LegalAnchorsContext } from './context';
import { resolveDocument } from './figures';
import { useLegalFigures } from './useLegalFigures';
import LegalBlocks from './LegalBlocks';
import LegalText from './LegalText';
import { LegalTocDesktop, LegalTocMobile } from './LegalToc';
import { LEGAL_NAV } from './nav';
import { BODY, ICONS, PANEL, TILE } from './styles';

const META_ICONS = { Effective: CalendarDays, 'Last updated': RefreshCw, Contact: Mail };

const MetaItem = ({ icon: Icon, label, children }) => (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-surface-sunken/60 px-3.5 py-2.5">
    <Icon className="size-4 shrink-0 text-info" aria-hidden="true" />
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-semibold tracking-[0.1em] text-fg-subtle uppercase">{label}</dt>
      <dd className="truncate text-sm font-medium text-fg">{children}</dd>
    </div>
  </div>
);

const LegalHero = ({ doc }) => (
  <header
    className={cn(
      PANEL,
      'hud-corners hud-corners-lit panel-scan overflow-hidden px-5 py-8 [--hud-inset:10px] sm:px-10 sm:py-12',
    )}
  >
    <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-accent/20 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 size-72 rounded-full bg-accent-2/10 blur-3xl" />

    <div className="relative">
      <p className={cn(HUD_LABEL, 'flex items-center gap-2')}>
        <Scale className="size-3.5" aria-hidden="true" />
        Legal · {doc.kicker}
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">{doc.title}</h1>

      <div className="mt-5 max-w-3xl space-y-3">
        {doc.summary.map((text) => (
          <p key={text} className={cn(BODY, 'sm:text-base sm:leading-7')}>
            <LegalText text={text} />
          </p>
        ))}
      </div>

      <dl className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
        {doc.meta.map((item) => (
          <MetaItem key={item.label} icon={META_ICONS[item.label]} label={item.label}>
            {item.href ? (
              <a href={item.href} className="hover:text-accent-on-dark hover:underline">
                {item.value}
              </a>
            ) : (
              item.value
            )}
          </MetaItem>
        ))}
        <MetaItem icon={Clock3} label="Reading time">
          {estimateReadingMinutes(doc)} min
        </MetaItem>
      </dl>

      {doc.operator && (
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-fg-subtle">
          <Building2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {doc.operator}
        </p>
      )}
    </div>
  </header>
);

const Highlights = ({ items }) => (
  <section aria-label="At a glance" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {items.map((item) => {
      const Icon = ICONS[item.icon];
      return (
        <a key={item.target} href={`#${item.target}`} className={cn(TILE, 'flex flex-col p-4 sm:p-5')}>
          <Icon className="size-5 text-info drop-shadow-[0_0_6px_var(--color-brand-cyan)]" aria-hidden="true" />
          <span className={cn(HUD_VALUE, 'mt-3 text-xl font-bold sm:text-2xl')}>{item.value}</span>
          <span className="mt-1 text-sm leading-snug text-fg-muted">{item.label}</span>
        </a>
      );
    })}
  </section>
);

const LegalSection = ({ section }) => {
  const id = sectionAnchor(section.num);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn(PANEL, 'group/section scroll-mt-24 p-5 sm:p-8')}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-brand-cyan/25 bg-info-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
        >
          <span className={cn(HUD_VALUE, 'text-base font-bold tabular-nums')}>{padNum(section.num)}</span>
        </span>
        <h2 id={`${id}-title`} className="min-w-0 flex-1 self-center text-lg font-semibold leading-snug text-fg sm:text-xl">
          <span className="sr-only">Section {section.num}: </span>
          {section.title}
        </h2>
        <a
          href={`#${id}`}
          aria-label={`Link to section ${section.num}`}
          className="grid size-8 shrink-0 place-items-center self-center rounded-lg text-fg-subtle opacity-0 transition hover:bg-white/5 hover:text-info focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/section:opacity-100 pointer-coarse:hidden"
        >
          <Link2 className="size-4" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-6 space-y-4 border-t border-white/8 pt-6">
        <LegalBlocks blocks={section.content} />
      </div>
    </section>
  );
};

const LegalFooter = ({ doc }) => {
  const { cta } = doc;
  const related = LEGAL_NAV.filter((item) => item.path !== doc.path);
  const ctaLabel = (
    <>
      {cta.label}
      <ArrowRight aria-hidden="true" />
    </>
  );

  return (
    <footer className="mt-10 space-y-8">
      <div
        className={cn(
          PANEL,
          'hud-corners hud-corners-lit flex flex-col items-start gap-5 overflow-hidden px-5 py-8 [--hud-inset:10px] sm:flex-row sm:items-center sm:justify-between sm:px-10',
        )}
      >
        <div>
          <p className={HUD_LABEL}>Need a hand?</p>
          <h2 className="mt-2 text-xl font-semibold text-fg sm:text-2xl">{cta.title}</h2>
        </div>
        <Button asChild size="lg" className="shrink-0">
          {cta.href.startsWith('/') ? <Link to={cta.href}>{ctaLabel}</Link> : <a href={cta.href}>{ctaLabel}</a>}
        </Button>
      </div>

      <nav aria-labelledby="legal-related-title">
        <h2 id="legal-related-title" className={cn(HUD_LABEL, 'mb-3')}>
          More policies
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <li key={item.path}>
              <Link to={item.path} className={cn(TILE, 'flex h-full items-start gap-3 p-4')}>
                <FileText className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-fg-muted">{item.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
};

const LegalDocumentSkeleton = () => (
  <article aria-busy="true" className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <span className="sr-only">Loading the current figures</span>
    <Skeleton className="h-72 rounded-2xl" />
    <Skeleton className="h-24 rounded-2xl" />
    <Skeleton className="h-96 rounded-2xl" />
  </article>
);

const FiguresUnavailableNotice = () => (
  <p
    role="status"
    className="mt-6 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-fg"
  >
    <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
    <span>
      We could not load the current fees and time periods, so this page shows the figures it was drafted with. The
      fees that apply to your purchase are always shown at checkout before you pay.
    </span>
  </p>
);

const LegalDocument = ({ doc: source }) => {
  const { figures, status } = useLegalFigures();
  const doc = useMemo(() => resolveDocument(source, figures), [source, figures]);
  const ready = status !== 'loading';

  useSEO({ ...doc.seo, canonical: doc.path });

  useEffect(() => {
    if (!ready) return;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [ready]);

  if (!ready) return <LegalDocumentSkeleton />;

  return (
    <LegalAnchorsContext.Provider value={collectAnchors(doc.sections)}>
      <article className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <LegalHero doc={doc} />
        {status === 'fallback' && <FiguresUnavailableNotice />}
        {doc.highlights && <Highlights items={doc.highlights} />}

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <LegalTocDesktop sections={doc.sections} />
          </aside>
          <div className="min-w-0 space-y-6">
            <LegalTocMobile sections={doc.sections} className="lg:hidden" />
            {doc.sections.map((section) => (
              <LegalSection key={section.num} section={section} />
            ))}
          </div>
        </div>

        <LegalFooter doc={doc} />
      </article>
    </LegalAnchorsContext.Provider>
  );
};

export default LegalDocument;
