import { AlertTriangle, BadgeCheck, CircleHelp, Info, PieChart, Sparkles, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { cn } from '@lib/utils';
import { HUD_LABEL, HUD_VALUE } from '@lib/surface';
import { sectionAnchor } from './anchors';
import LegalText from './LegalText';
import { BODY, ICONS, LINK } from './styles';

/*
 * A document's `content` is a list of blocks:
 *   "string"                         paragraph
 *   ["a", "b"]                       bullet list
 *   { type: "subsection", num, title, content }
 *   { type: "steps", items }         an ordered procedure
 *   { type: "callout", tone, title?, content }
 *   { type: "cards", items: [{ tone, icon?, title, value?, text }] }
 *   { type: "table", caption, columns, rows }
 *   { type: "definitions", items: [{ term, text }] }
 *   { type: "contacts", items: [{ icon, label, value, href?, links? }] }
 */

const Paragraph = ({ text }) => (
  <p className={BODY}>
    <LegalText text={text} />
  </p>
);

// Hanging indent with a drawn bullet: `list-inside` wraps continuation lines
// under the marker, which is unreadable on multi-line clauses.
const BulletList = ({ items }) => (
  <ul className="space-y-2.5">
    {items.map((item, i) => (
      <li
        key={i}
        className={cn(
          BODY,
          'relative pl-6 before:absolute before:top-[11px] before:left-1.5 before:size-1.5 before:rounded-full before:bg-info before:shadow-[0_0_6px_var(--color-brand-cyan)]',
        )}
      >
        <LegalText text={item} />
      </li>
    ))}
  </ul>
);

const Subsection = ({ num, title, content }) => (
  <div id={sectionAnchor(num)} className="scroll-mt-24 border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
    <h3 className="flex items-baseline gap-3 text-base font-semibold leading-snug text-fg sm:text-[1.0625rem]">
      <span className={cn(HUD_LABEL, 'shrink-0 tabular-nums')}>{num}</span>
      <span>{title}</span>
    </h3>
    <div className="mt-3 space-y-4">
      <LegalBlocks blocks={content} />
    </div>
  </div>
);

// The rail between numbers is the li's ::after, so it spans exactly the gap to
// the next step and stops at the last one.
const Steps = ({ items }) => (
  <ol className="space-y-4">
    {items.map((item, i) => (
      <li
        key={i}
        className="relative flex gap-4 not-last:after:absolute not-last:after:top-9 not-last:after:-bottom-4 not-last:after:left-4 not-last:after:w-px not-last:after:bg-brand-cyan/25"
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-brand-cyan/35 bg-info-soft text-sm font-bold tabular-nums text-info"
        >
          {i + 1}
        </span>
        <p className={cn(BODY, 'pt-0.5')}>
          <LegalText text={item} />
        </p>
      </li>
    ))}
  </ol>
);

// Opaque `-soft` fills: they are measured under -fg text and stay put whatever
// the panel behind them does. `highlight` is the one rule a document leads with.
const TONES = {
  highlight: {
    box: 'border-brand-cyan/35 bg-linear-135 from-accent-deep/45 to-info-soft',
    icon: 'text-info',
    Icon: Sparkles,
  },
  info: { box: 'border-info/25 bg-info-soft', icon: 'text-info', Icon: Info },
  success: { box: 'border-success/30 bg-success-soft', icon: 'text-success', Icon: BadgeCheck },
  warning: { box: 'border-warning/30 bg-warning-soft', icon: 'text-warning', Icon: AlertTriangle },
  danger: { box: 'border-danger/30 bg-danger-soft', icon: 'text-danger', Icon: XCircle },
  partial: { box: 'border-info/25 bg-info-soft', icon: 'text-info', Icon: PieChart },
  pending: { box: 'border-warning/30 bg-warning-soft', icon: 'text-warning', Icon: CircleHelp },
  neutral: { box: 'border-white/10 bg-surface-sunken/60', icon: 'text-info', Icon: Info },
};

const Callout = ({ tone = 'info', title, content }) => {
  const t = TONES[tone];
  return (
    <div role="note" className={cn('flex gap-3 rounded-xl border p-4 sm:gap-4 sm:p-5', t.box)}>
      <t.Icon className={cn('mt-1 size-5 shrink-0', t.icon)} aria-hidden="true" />
      <div className="min-w-0 space-y-2">
        {title && (
          <p className={cn('font-semibold text-fg', tone === 'highlight' ? 'text-base' : 'text-sm')}>{title}</p>
        )}
        <LegalBlocks blocks={content} />
      </div>
    </div>
  );
};

const Cards = ({ items }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map((item) => {
      const t = TONES[item.tone ?? 'neutral'];
      const Icon = item.icon ? ICONS[item.icon] : t.Icon;
      return (
        <div key={item.title} className={cn('rounded-xl border p-4 sm:p-5', t.box)}>
          <p className="flex items-center gap-2.5 text-sm font-semibold text-fg">
            <Icon className={cn('size-5 shrink-0', t.icon)} aria-hidden="true" />
            {item.title}
          </p>
          {item.value && <p className={cn(HUD_VALUE, 'mt-3 text-2xl font-bold tabular-nums')}>{item.value}</p>}
          <p className={cn(BODY, 'mt-2')}>
            <LegalText text={item.text} />
          </p>
        </div>
      );
    })}
  </div>
);

// A real table from `sm` up; below that, three columns of prose would be
// ~100px each, so each row becomes its own labelled card instead.
const DataTable = ({ caption, columns, rows }) => (
  <>
    <Table containerClassName="hidden rounded-xl border border-white/10 bg-surface-sunken/40 sm:block">
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col} className="px-4">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell, j) => (
              <TableCell
                key={columns[j]}
                className={cn(
                  'whitespace-normal px-4 py-3.5 align-top leading-6',
                  j === 0 ? 'font-semibold text-fg' : 'text-fg-muted',
                )}
              >
                <LegalText text={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <div className="space-y-3 sm:hidden">
      {rows.map((row) => (
        <div key={row[0]} className="rounded-xl border border-white/10 bg-surface-sunken/50 p-4">
          <p className="font-semibold text-fg">{row[0]}</p>
          <dl className="mt-3 space-y-3">
            {columns.slice(1).map((col, j) => (
              <div key={col}>
                <dt className={HUD_LABEL}>{col}</dt>
                <dd className="mt-1 text-sm leading-6 text-fg-muted">
                  <LegalText text={row[j + 1]} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  </>
);

const Definitions = ({ items }) => (
  <dl className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/10 bg-surface-sunken/40">
    {items.map(({ term, text }) => (
      <div key={term} className="grid gap-1 px-4 py-3.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-6 sm:px-5">
        <dt className="text-sm font-semibold leading-7 text-fg">{term}</dt>
        <dd className={BODY}>
          <LegalText text={text} />
        </dd>
      </div>
    ))}
  </dl>
);

const isExternal = (href) => href.startsWith('http');

const ContactLink = ({ href, children }) => (
  <a
    href={href}
    className={LINK}
    {...(isExternal(href) && { target: '_blank', rel: 'noopener noreferrer' })}
  >
    {children}
  </a>
);

const Contacts = ({ items }) => (
  <ul className="grid gap-3 sm:grid-cols-2">
    {items.map((item) => {
      const Icon = ICONS[item.icon];
      return (
        <li key={item.label} className="flex gap-3 rounded-xl border border-white/10 bg-surface-sunken/50 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand-cyan/25 bg-info-soft text-info">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={HUD_LABEL}>{item.label}</p>
            <p className="mt-1 text-sm font-medium leading-6 break-words text-fg">
              {item.href ? <ContactLink href={item.href}>{item.value}</ContactLink> : item.value}
            </p>
            {item.links && (
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {item.links.map((link) => (
                  <ContactLink key={link.href} href={link.href}>
                    {link.label}
                  </ContactLink>
                ))}
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ul>
);

const BLOCKS = {
  subsection: Subsection,
  steps: Steps,
  callout: Callout,
  cards: Cards,
  table: DataTable,
  definitions: Definitions,
  contacts: Contacts,
};

const Block = ({ block }) => {
  if (typeof block === 'string') return <Paragraph text={block} />;
  if (Array.isArray(block)) return <BulletList items={block} />;
  const Component = BLOCKS[block.type];
  // Documents are static data; an unknown type is an authoring mistake, and the
  // document test renders every page, so it fails there rather than in prod.
  if (!Component) throw new Error(`Unknown legal block type "${block.type}"`);
  return <Component {...block} />;
};

// Static content never reorders, so the index is a stable key here.
const LegalBlocks = ({ blocks }) => blocks.map((block, i) => <Block key={i} block={block} />);

export default LegalBlocks;
