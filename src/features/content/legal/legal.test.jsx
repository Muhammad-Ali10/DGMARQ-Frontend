import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { collectAnchors, sectionAnchor } from './anchors';
import { DRAFTED_FIGURES, mergeFigures, resolveDocument, resolveText } from './figures';
import { parseInline } from './inline';
import { PUBLISHED_FIGURES } from './publishedFigures';

// The figures endpoint is exercised on its own below; document tests render against
// the drafted fallback so their assertions do not depend on a live platform value.
vi.mock('@services/api', () => ({
  legalAPI: { getFigures: vi.fn(() => Promise.reject(new Error('offline'))) },
}));
import {
  LegalDocument,
  PolicyFigureNotice,
  feeSchedule,
  privacyPolicy,
  refundPolicy,
  termsConditions,
  vendorTerms,
} from './index';

describe('parseInline', () => {
  it('returns plain text untouched', () => {
    expect(parseInline('dgmarq.com operates a marketplace.')).toEqual([
      { type: 'text', value: 'dgmarq.com operates a marketplace.' },
    ]);
  });

  it('marks bold lead-ins, emails and external links', () => {
    expect(parseInline('**Email:** privacy@dgmarq.com. See [ICO](https://ico.org.uk).')).toEqual([
      { type: 'strong', value: 'Email:' },
      { type: 'text', value: ' ' },
      // The sentence's full stop is not swallowed into the address.
      { type: 'email', value: 'privacy@dgmarq.com' },
      { type: 'text', value: '. See ' },
      { type: 'link', value: 'ICO', href: 'https://ico.org.uk' },
      { type: 'text', value: '.' },
    ]);
  });

  it('turns clause references into anchors, stopping at the sentence end', () => {
    expect(parseInline('set out in Section 9.2. See Section 10 for details.')).toEqual([
      { type: 'text', value: 'set out in ' },
      { type: 'section', value: 'Section 9.2', anchor: 'section-9-2' },
      { type: 'text', value: '. See ' },
      { type: 'section', value: 'Section 10', anchor: 'section-10' },
      { type: 'text', value: ' for details.' },
    ]);
  });
});

const DOCUMENTS = { refundPolicy, privacyPolicy, termsConditions, feeSchedule, vendorTerms };

// Every string a document renders, wherever it sits in the block tree.
const strings = (node) => {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(strings);
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
};

// The figures admin screens quote back must be the ones the cited clause states,
// or the drift warning would be policing the wrong number.
describe('published policy figures', () => {
  const DOC_BY_PATH = Object.fromEntries(Object.values(DOCUMENTS).map((d) => [d.path, d]));

  const clauseStrings = (doc, anchor) => {
    for (const section of doc.sections) {
      if (sectionAnchor(section.num) === anchor) return strings(section);
      for (const block of section.content) {
        if (block?.type === 'subsection' && sectionAnchor(block.num) === anchor) return strings(block);
      }
    }
    return null;
  };

  const STATED = {
    days: (v) => new RegExp(`\\b${v}[ -](calendar |business )?days?\\b`, 'i'),
    percent: (v) => new RegExp(`\\b${v}\\s?%`),
    aud: (v) => new RegExp(`AUD \\$${v.toFixed(2)}`),
  };

  it.each(Object.entries(PUBLISHED_FIGURES))('%s is the figure its clause states', (_, figure) => {
    const [path, anchor] = figure.path.split('#');
    const doc = DOC_BY_PATH[path];
    expect(doc, `no document is published at ${path}`).toBeDefined();

    // Resolved with the drafted values: the clause holds a token now, and this is
    // what a reader sees before the live figures arrive.
    const clause = clauseStrings(resolveDocument(doc, DRAFTED_FIGURES), anchor);
    expect(clause, `${doc.title} has no clause ${figure.clause}`).not.toBeNull();
    expect(clause.join(' ')).toMatch(STATED[figure.unit](figure.value));
  });

  it('cites the document each figure names', () => {
    for (const figure of Object.values(PUBLISHED_FIGURES)) {
      const doc = DOC_BY_PATH[figure.path.split('#')[0]];
      expect(doc.title).toBe(figure.document);
      expect(sectionAnchor(figure.clause)).toBe(figure.path.split('#')[1]);
    }
  });
});

describe('live figures', () => {
  const LIVE = {
    refundWindowDays: 30,
    payoutHoldDays: 16,
    buyerProtectionFeePercent: 20,
    buyerProcessingFeeFixed: 0.8,
    commissionRatePercent: 7,
    featuredCommissionPercent: 3,
    currency: 'USD',
  };

  it('leaves no token unresolved in any document', () => {
    for (const doc of Object.values(DOCUMENTS)) {
      for (const figures of [DRAFTED_FIGURES, LIVE]) {
        const text = strings(resolveDocument(doc, figures)).join(' ');
        expect(text, doc.title).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('rejects a token that does not exist', () => {
    expect(() => resolveText('within {refundWindowDaze} days', DRAFTED_FIGURES)).toThrow(/refundWindowDaze/);
  });

  // A live value is used only when it is usable, so a null or a non-numeric field
  // from the API cannot print "NaN%" inside a clause.
  it.each([null, undefined, 'soon'])('falls back to the drafted figure when the API sends %s', (broken) => {
    const figures = mergeFigures({ ...LIVE, refundWindowDays: broken });
    expect(resolveText('{refundWindowDays} days', figures)).toBe('7 days');
    // The fields that did arrive are still live.
    expect(resolveText('{buyerProtectionFeePercent}%', figures)).toBe('20%');
  });

  it('uses the drafted figures when the request fails outright', () => {
    expect(mergeFigures(undefined)).toBe(DRAFTED_FIGURES);
  });

  it('carries one live value into the tile, the clause and the section title', () => {
    const doc = resolveDocument(refundPolicy, LIVE);
    expect(doc.highlights[0].value).toBe('30 days');
    expect(doc.sections.find((s) => s.num === 3).title).toBe('The 30-Day Refund Window');
    expect(strings(doc.sections[0]).join(' ')).toContain('within 30 calendar days');
  });

  it('recalculates the worked example instead of inventing a 35th of the month', () => {
    const shortWindow = strings(resolveDocument(refundPolicy, { ...LIVE, refundWindowDays: 7 })).join(' ');
    expect(shortWindow).toContain('delivered on 1 June, the refund window closes at the end of 8 June');

    const longWindow = strings(resolveDocument(refundPolicy, LIVE)).join(' ');
    expect(longWindow).toContain('confirmed on 5 June, the refund window closes at the end of 5 July');
  });

  // The Vendor Terms carried "[currently +10%]" as placeholder copy while the
  // platform had long since moved to 3%.
  it('carries the featured surcharge into the Vendor Terms', () => {
    const live = strings(resolveDocument(vendorTerms, LIVE)).join(' ');
    expect(live).toContain('Featured-listing surcharge: +3%');
    expect(live).not.toContain('currently +10%');
  });

  it('labels a fee in the currency the platform actually charges', () => {
    const live = strings(resolveDocument(termsConditions, LIVE)).join(' ');
    expect(live).toContain('A flat fee of USD $0.80 per Transaction');

    const drafted = strings(resolveDocument(termsConditions, DRAFTED_FIGURES)).join(' ');
    expect(drafted).toContain('A flat fee of AUD $0.86 per Transaction');
  });
});

describe('PolicyFigureNotice', () => {
  // The live refund window really is 30 days against a policy that promises 7, so
  // this is the case the admin sees today, not a hypothetical.
  it('warns when the live setting has moved away from the drafted figure', () => {
    renderWithProviders(<PolicyFigureNotice figure="refundWindowDays" live="30" />);
    expect(
      screen.getByText(/Refund Policy 3: that page now reads 30 days, not the 7 days it was drafted with/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the clause/ })).toHaveAttribute('href', '/refund-policy#section-3');
  });

  it('stays quiet on a match, tolerating a converted rate', () => {
    // 0.07 * 100 is 7.000000000000001 in JS — the comparison must survive it.
    renderWithProviders(<PolicyFigureNotice figure="commissionRatePercent" live={0.07 * 100} />);
    expect(screen.getByText(/Published live in Terms and Conditions 6\.3, which was drafted as 7%/)).toBeInTheDocument();
  });

  it('states plainly when no setting corresponds to the clause', () => {
    renderWithProviders(<PolicyFigureNotice figure="withdrawalFeePercent" absent />);
    expect(screen.getByText(/states 3%, and no platform setting corresponds to it/)).toBeInTheDocument();
  });

  it('does not warn while a field is mid-edit', () => {
    renderWithProviders(<PolicyFigureNotice figure="payoutHoldDays" live="" />);
    expect(screen.getByText(/Published live in Terms and Conditions 9\.4, which was drafted as 10 days/)).toBeInTheDocument();
    expect(screen.queryByText(/not the 10 days it was drafted with/)).not.toBeInTheDocument();
  });
});

describe.each(Object.entries(DOCUMENTS))('%s', (_, doc) => {
  const anchors = collectAnchors(doc.sections);
  // What the page renders when the live figures are unavailable, which is the state
  // these tests run in (the API is mocked as offline above).
  const rendered = resolveDocument(doc, DRAFTED_FIGURES);

  it('gives every section and subsection a unique number', () => {
    const nums = doc.sections.flatMap((s) => [
      s.num,
      ...s.content.filter((b) => b?.type === 'subsection').map((b) => b.num),
    ]);
    expect(new Set(nums.map(sectionAnchor)).size).toBe(nums.length);
  });

  it('only cross-references clauses that exist', () => {
    const refs = strings([doc.summary, doc.sections])
      .flatMap(parseInline)
      .filter((t) => t.type === 'section');
    for (const ref of refs) expect(anchors, ref.value).toContain(ref.anchor);
  });

  it('points every highlight at a real clause', () => {
    for (const h of doc.highlights ?? []) expect(anchors, h.label).toContain(h.target);
  });

  it('renders the title, every section and a TOC entry for each', () => {
    renderWithProviders(<LegalDocument doc={doc} />, { route: doc.path });

    expect(screen.getByRole('heading', { level: 1, name: rendered.title })).toBeInTheDocument();
    for (const section of rendered.sections) {
      const id = sectionAnchor(section.num);
      expect(document.getElementById(id)).toHaveAttribute('aria-labelledby', `${id}-title`);
      // textContent, not getByRole's name: jsdom's name computation drops the
      // space at the sr-only span boundary that browsers keep.
      expect(document.getElementById(`${id}-title`)).toHaveTextContent(`Section ${section.num}: ${section.title}`);
    }
    // Both TOC variants render (CSS decides which shows); the desktop one is first.
    const [toc] = screen.getAllByRole('navigation', { name: 'On this page' });
    expect(within(toc).getAllByRole('link')).toHaveLength(doc.sections.length);
  });

  it('does not list itself under "More policies"', () => {
    renderWithProviders(<LegalDocument doc={doc} />, { route: doc.path });
    const related = screen.getByRole('navigation', { name: 'More policies' });
    const hrefs = within(related).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain(doc.path);
    expect(hrefs).toHaveLength(4);
  });
});
