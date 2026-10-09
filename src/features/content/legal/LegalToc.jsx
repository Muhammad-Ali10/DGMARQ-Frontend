import { ChevronDown, ListOrdered } from 'lucide-react';
import { cn } from '@lib/utils';
import { HUD_LABEL } from '@lib/surface';
import { padNum, sectionAnchor } from './anchors';
import { PANEL } from './styles';
import { useActiveSection } from './useActiveSection';

const TocLinks = ({ sections, activeId }) => (
  <ol className="space-y-0.5">
    {sections.map((section) => {
      const id = sectionAnchor(section.num);
      const active = id === activeId;
      return (
        <li key={id}>
          <a
            href={`#${id}`}
            aria-current={active ? 'location' : undefined}
            className={cn(
              'relative flex gap-3 rounded-lg px-3 py-2 text-sm leading-snug transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-accent/15 text-fg before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-info before:shadow-[0_0_8px_var(--color-brand-cyan)]'
                : 'text-fg-muted hover:bg-white/5 hover:text-fg',
            )}
          >
            <span
              className={cn(
                'w-5 shrink-0 text-xs font-semibold leading-5 tabular-nums',
                active ? 'text-info' : 'text-fg-subtle',
              )}
            >
              {padNum(section.num)}
            </span>
            <span>{section.title}</span>
          </a>
        </li>
      );
    })}
  </ol>
);

export const LegalTocDesktop = ({ sections }) => {
  const activeId = useActiveSection(sections);
  return (
    <nav
      aria-label="On this page"
      className={cn(PANEL, 'sticky top-24 max-h-[calc(100dvh-7.5rem)] overflow-y-auto p-3 [scrollbar-width:thin]')}
    >
      <p className={cn(HUD_LABEL, 'px-3 pt-1 pb-2')}>On this page</p>
      <TocLinks sections={sections} activeId={activeId} />
    </nav>
  );
};

export const LegalTocMobile = ({ sections, className }) => (
  <details className={cn(PANEL, 'group', className)}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-2.5 text-sm font-semibold text-fg">
        <ListOrdered className="size-4 text-info" aria-hidden="true" />
        On this page
        <span className="font-normal text-fg-subtle">· {sections.length} sections</span>
      </span>
      <ChevronDown className="size-4 text-fg-muted transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <nav aria-label="On this page" className="border-t border-white/8 p-2">
      <TocLinks sections={sections} />
    </nav>
  </details>
);
