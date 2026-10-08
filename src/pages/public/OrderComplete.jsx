import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Check, Copy, Eye, EyeOff, KeyRound, ShieldCheck, LifeBuoy,
  X, Package, CreditCard, Sparkles, CircleCheck, Lock,
} from 'lucide-react';
import { userAPI } from '@services/api';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { SellerAvatar } from '@features/cart-checkout';
import useCurrency from '@hooks/useCurrency';
import { describeAccountCredentials } from '@lib/accountCredentials';
import { deliveryWords, isActivationLink, isHttpUrl } from '@lib/deliveryType';
import { formatReleaseDate } from '@components/common/PreorderBadge';

const MASK = '•'.repeat(12);

const parseDeliverable = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const SECURE_PILL =
  'inline-flex items-center gap-[7px] rounded-full border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.08)] px-[12px] py-[6px] text-[11.5px] font-medium tracking-[0.01em] text-[#7ef0ab]';
const KEY_BOX =
  'relative mb-[13px] flex items-center gap-[13px] rounded-[14px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] px-[18px] py-[16px]';
const KEY_FLABEL = 'mb-[4px] text-[9.5px] uppercase tracking-[0.12em] text-[#6a80a8]';
const KEY_CODE =
  'overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-semibold tracking-[0.08em] text-white [font-variant-numeric:tabular-nums]';
const ICON_BTN =
  'flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] text-[#0e9fe2] [transition:all_0.15s] hover:border-[rgba(14,159,226,0.45)] hover:bg-[rgba(14,159,226,0.13)] hover:text-white';
const ICON_BTN_GHOST = 'text-[#6a80a8] hover:bg-white/[0.07] hover:text-white';
const ICON_BTN_COPIED =
  'border-[rgba(34,197,94,0.45)] bg-[rgba(34,197,94,0.16)] text-[#7ef0ab] hover:border-[rgba(34,197,94,0.45)] hover:bg-[rgba(34,197,94,0.16)] hover:text-[#7ef0ab]';
const INFO_BOX =
  'mb-[13px] rounded-[13px] border border-white/[0.065] bg-white/[0.03] px-[16px] py-[14px]';
const INFO_TEXT = 'whitespace-pre-wrap text-[12.5px] leading-[1.6] text-[#9fb4d8]';

const KeyBox = ({ label, value, secret = false, href, onCopied }) => {
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopied(`${label} copied to clipboard`);
  };

  return (
    <div className={KEY_BOX}>
      {secret
        ? <Lock className="h-[18px] w-[18px] shrink-0 text-[#0e9fe2] opacity-90" />
        : <KeyRound className="h-[18px] w-[18px] shrink-0 text-[#0e9fe2] opacity-90" />}
      <div className="min-w-0 flex-1">
        <div className={KEY_FLABEL}>{label}</div>
        <div className={`${KEY_CODE} ${shown ? '' : 'tracking-[0.3em]'}`}>
          {!shown ? MASK : href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
              {value}
            </a>
          ) : value}
        </div>
      </div>
      {secret && (
        <button
          type="button"
          className={`${ICON_BTN} ${ICON_BTN_GHOST}`}
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? `Hide ${label}` : `Show ${label}`}
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
      <button
        type="button"
        className={`${ICON_BTN} ${copied ? ICON_BTN_COPIED : ''}`}
        onClick={copy}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
};

const ItemModal = ({ item, onClose, onToast }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isAccount = item.productType === 'ACCOUNT_BASED';

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-[20px] bg-[rgba(4,9,20,0.7)] backdrop-blur-[7px] animate-oc-fade">
      <button type="button" className="absolute inset-0 cursor-default border-0 bg-transparent p-0" onClick={onClose} aria-label="Close dialog" />
      <div
        className="relative z-[1] max-h-[92vh] w-full max-w-[600px] overflow-y-auto rounded-[22px] border border-[rgba(14,159,226,0.18)] bg-[linear-gradient(180deg,rgba(12,22,44,0.98),rgba(8,15,32,0.98))] shadow-[0_50px_110px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] animate-oc-rise before:absolute before:left-[24px] before:right-[24px] before:top-0 before:h-px before:content-[''] before:bg-[linear-gradient(90deg,transparent,rgba(14,159,226,0.55),transparent)]"
        role="dialog"
        aria-modal="true"
        aria-label="Your product"
      >
        <div className="relative px-[26px] pb-[8px] pt-[24px] text-center">
          <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0e9fe2]">
            {isAccount ? 'View your account' : 'View your product'}
          </h3>
          <button
            type="button"
            className="absolute right-[18px] top-[18px] z-[3] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[9px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] text-[#6a80a8] [transition:all_0.15s] hover:bg-white/[0.07] hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-[26px] pb-[28px] pt-[16px]">
          <div className="mb-[18px] flex items-center gap-[16px] rounded-[15px] border border-white/[0.065] bg-white/[0.03] p-[16px]">
            <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-[13px] border border-[rgba(14,159,226,0.18)] bg-[#0b1730] [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
              {item.productImage && <SafeImage src={item.productImage} alt={item.productName} />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="m-0 mb-[7px] text-[16.5px] font-bold leading-[1.22] tracking-[-0.01em] text-white">{item.productName}</h4>
              <div className="grid grid-cols-1 gap-x-[20px] gap-y-[8px] min-[561px]:grid-cols-2">
                <span className="flex flex-wrap items-center gap-[6px] text-[11.5px] text-[#6a80a8] [&_b]:font-semibold [&_b]:text-[#eef4fc]">Sold by <b>{item.sellerName}</b></span>
                <span className="flex flex-wrap items-center gap-[6px] text-[11.5px] text-[#6a80a8] [&_b]:font-semibold [&_b]:text-[#eef4fc]">Qty <b>{item.qty}</b></span>
              </div>
            </div>
          </div>

          <div className="mb-[13px] flex flex-wrap gap-[9px]">
            {item.keys.length > 0 ? (
              <>
                <span className="inline-flex items-center gap-[7px] rounded-[10px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] px-[12px] py-[8px] text-[11.5px] font-medium text-[#9fb4d8]"><Sparkles className="h-3.5 w-3.5" />Instant delivery</span>
                <span className="inline-flex items-center gap-[7px] rounded-[10px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] px-[12px] py-[8px] text-[11.5px] font-medium text-[#9fb4d8]"><CircleCheck className="h-3.5 w-3.5" />Delivered</span>
              </>
            ) : item.isPreorder ? (
              <span className="inline-flex items-center gap-[7px] rounded-[10px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] px-[12px] py-[8px] text-[11.5px] font-medium text-[#9fb4d8]"><Package className="h-3.5 w-3.5" />Pre-order{item.preorderReleaseDate ? ` · releases ${formatReleaseDate(item.preorderReleaseDate)}` : ''}</span>
            ) : null}
          </div>

          {item.refunded ? (
            <div className={INFO_BOX}><div className={INFO_TEXT}>This item was refunded, so its keys are no longer available.</div></div>
          ) : item.keys.length === 0 ? (
            <div className={INFO_BOX}><div className={INFO_TEXT}>{item.isPreorder ? 'This is a pre-order. Your keys will appear here and in your email on release day.' : 'Your keys are not available yet. They will appear here as soon as delivery completes.'}</div></div>
          ) : (
            item.keys.map((raw, i) => {
              const account = isAccount ? parseDeliverable(raw) : null;
              if (!account) {
                return (
                  <KeyBox
                    key={`k-${i}`}
                    label={`${deliveryWords(item.productType).title}${item.keys.length > 1 ? ` ${i + 1}` : ''}`}
                    value={raw}
                    href={isActivationLink(item.productType) && isHttpUrl(raw) ? raw : undefined}
                    onCopied={onToast}
                  />
                );
              }
              const rows = describeAccountCredentials(account);
              const credentialRows = rows.filter((row) => row.key !== 'notes');
              const notes = rows.find((row) => row.key === 'notes');
              return (
                <div key={`a-${i}`}>
                  {credentialRows.length > 0 ? credentialRows.map((row) => (
                    <KeyBox
                      key={`${i}-${row.key}`}
                      label={row.label}
                      value={row.value}
                      secret={row.secret}
                      onCopied={onToast}
                    />
                  )) : (
                    <div className={INFO_BOX}><div className={INFO_TEXT}>{raw}</div></div>
                  )}
                  {notes && (
                    <div className={INFO_BOX}>
                      <div className={KEY_FLABEL}>Seller notes</div>
                      <div className={INFO_TEXT}>{notes.value}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CRUMB =
  'flex items-center gap-[8px] text-[12px] tracking-[0.01em] text-[#6a80a8] [&_a]:text-[#9fb4d8] [&_a]:no-underline [&_a:hover]:text-[#0e9fe2] [&_b]:font-medium [&_b]:text-[#eef4fc]';
const META_CELL =
  'flex flex-col gap-[3px] text-[10.5px] uppercase tracking-[0.1em] text-[#6a80a8] [&_b]:text-[13.5px] [&_b]:font-semibold [&_b]:normal-case [&_b]:tracking-normal [&_b]:text-[#eef4fc]';
const OS_IC =
  'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] text-[#6a80a8] [transition:0.2s]';
const OS_IC_DONE = 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#7ef0ab]';
const OS_IC_ACTIVE = 'border-[rgba(14,159,226,0.5)] bg-[rgba(14,159,226,0.12)] text-[#0e9fe2] shadow-[0_0_0_4px_rgba(14,159,226,0.09)]';
const CELL =
  'text-[13px] text-[#9fb4d8] [font-variant-numeric:tabular-nums] flex items-center justify-between gap-[12px] text-left ' +
  "before:content-[attr(data-label)] before:text-[10px] before:uppercase before:tracking-[0.12em] before:text-[#6a80a8] " +
  'min-[861px]:block min-[861px]:text-center min-[861px]:before:content-none';
const CELL_ACTION =
  'text-[13px] text-[#9fb4d8] flex items-center justify-start gap-[12px] before:content-none ' +
  'min-[861px]:block min-[861px]:text-right';
const TYPE_BADGE =
  'inline-flex items-center gap-[7px] rounded-[9px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] px-[11px] py-[5px] text-[11px] font-semibold tracking-[0.01em] text-[#eef4fc]';
const BTN_PRIMARY =
  'inline-flex cursor-pointer items-center gap-[8px] rounded-[10px] border border-[rgba(14,159,226,0.18)] bg-white/[0.03] px-[15px] py-[9px] text-[12.5px] font-semibold tracking-[0.005em] text-[#eef4fc] [font-family:inherit] [transition:transform_0.15s_ease,border-color_0.15s_ease,background_0.15s_ease,box-shadow_0.15s_ease] [&_svg]:text-[#0e9fe2] hover:-translate-y-px hover:border-[rgba(14,159,226,0.5)] hover:bg-[rgba(14,159,226,0.09)] hover:shadow-[0_6px_18px_-8px_rgba(14,159,226,0.6)] active:translate-y-0';
const FOOT_LABEL = 'mb-[9px] text-[10.5px] font-semibold uppercase tracking-[0.11em] text-[#6a80a8]';
const SUM_ROW = 'flex items-center justify-between py-[6px] text-[13px] text-[#9fb4d8] [font-variant-numeric:tabular-nums]';
const SUM_Q = 'inline-flex items-center gap-[6px] tracking-[0.005em] text-[#6a80a8]';
const ACT_BTN =
  'inline-flex min-w-[160px] flex-[1_1_100%] min-[561px]:flex-[1_1_0] cursor-pointer items-center justify-center gap-[9px] rounded-[14px] border border-[rgba(14,159,226,0.18)] bg-[rgba(10,31,71,0.72)] px-[18px] py-[14px] text-[13px] font-semibold tracking-[0.005em] text-[#eef4fc] no-underline backdrop-blur-[10px] [transition:transform_0.16s_ease,border-color_0.16s_ease,background_0.16s_ease,box-shadow_0.16s_ease] [&_svg]:text-[#0e9fe2] hover:-translate-y-[2px] hover:border-[rgba(14,159,226,0.5)] hover:bg-[rgba(14,159,226,0.06)] hover:shadow-[0_12px_26px_-14px_rgba(14,159,226,0.6)] active:translate-y-0';
const ACT_BTN_PRIMARY =
  'border-[rgba(120,200,245,0.55)] bg-[linear-gradient(135deg,#172aa4,#0e9fe2)] text-white shadow-[0_14px_30px_-14px_rgba(14,159,226,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] [&_svg]:text-white hover:brightness-[1.06]';

const OrderComplete = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const guestEmail = searchParams.get('guestEmail');
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { format: formatPrice } = useCurrency();
  const [openItem, setOpenItem] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-complete', orderId, guestEmail],
    queryFn: () => userAPI
      .getOrderKeys(orderId, guestEmail ? { guestEmail } : {})
      .then((r) => r.data.data),
    enabled: !!orderId,
    retry: false,
  });

  if (isLoading) return <Loading message="Loading your order..." />;
  if (isError || !data) return <ErrorMessage message="We couldn't load this order." />;

  const items = data.licenseDetails || [];
  const summary = data.summary;
  const placed = data.placedAt ? new Date(data.placedAt) : null;
  const placedDate = placed ? placed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const placedTime = placed ? placed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
  const delivered = items.some((i) => i.keys?.length > 0);
  const awaitingRelease = !!data.awaitingRelease;
  const releaseDate = items.find((i) => i.preorderReleaseDate)?.preorderReleaseDate;
  const releaseLabel = releaseDate ? formatReleaseDate(releaseDate) : null;
  const paymentDone = ['paid', 'partially_refunded'].includes(data.paymentStatus);

  const steps = [
    { t: 'Order placed', s: placedTime ? `${placedDate}, ${placedTime}` : placedDate, done: true },
    { t: 'Payment confirmed', s: data.paymentMethod || 'Paid', done: paymentDone },
    {
      t: 'Items delivered',
      s: delivered ? 'Instant delivery' : awaitingRelease ? (releaseLabel ? `On release, ${releaseLabel}` : 'On release day') : 'Preparing',
      done: delivered,
      active: awaitingRelease,
    },
    { t: 'Order complete', s: awaitingRelease ? 'After release' : 'Keys available below', done: data.orderStatus === 'completed', active: !awaitingRelease && data.orderStatus !== 'completed' },
  ];

  return (
    <div className="relative z-[1] text-[#eef4fc] tracking-[0.005em] antialiased">
      <div className="relative mx-auto max-w-[1000px] px-[4px] pb-[40px] pt-[6px]">
        <div className="mb-[40px] flex flex-wrap items-center justify-between gap-[12px]">
          <div className={CRUMB}>
            <Link to="/">Home</Link>
            <span>/</span>
            {isAuthenticated ? <Link to="/user/orders">My Orders</Link> : <span>Order</span>}
            <span>/</span>
            <b>Order complete</b>
          </div>
          <span className={SECURE_PILL}><ShieldCheck className="h-3.5 w-3.5" />Secure checkout</span>
        </div>

        <div className="mx-auto mb-[46px] max-w-[540px] text-center">
          <div className="relative mx-auto mb-[26px] flex h-[128px] w-[128px] items-center justify-center animate-oc-pop-in motion-reduce:animate-none">
            <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,rgba(14,159,226,0.95),rgba(34,197,94,0.9),rgba(124,58,237,0.72),rgba(14,159,226,0)_80%)] [-webkit-mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-3px))] [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-3px))] animate-oc-spin motion-reduce:animate-none" />
            <span className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[radial-gradient(120%_120%_at_32%_22%,#2071e8,#0e2b66_58%,#07142e_86%)] shadow-[0_16px_44px_-6px_rgba(14,159,226,0.45),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-8px_22px_rgba(4,9,22,0.55)]">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7ef0ab" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path className="[stroke-dasharray:30] [stroke-dashoffset:30] animate-oc-draw motion-reduce:[stroke-dashoffset:0] motion-reduce:animate-none" d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <Sparkles className="absolute -top-[4px] left-[16px] h-3.5 w-3.5 text-[#7bc5ff] opacity-0 [filter:drop-shadow(0_0_4px_currentColor)] animate-oc-sparkle [animation-delay:0.1s] motion-reduce:animate-none" />
            <Sparkles className="absolute top-[14px] -right-[2px] h-3 w-3 text-[#7ef0ab] opacity-0 [filter:drop-shadow(0_0_4px_currentColor)] animate-oc-sparkle [animation-delay:0.7s] motion-reduce:animate-none" />
            <Sparkles className="absolute bottom-[6px] -left-[4px] h-3 w-3 text-[#a855f7] opacity-0 [filter:drop-shadow(0_0_4px_currentColor)] animate-oc-sparkle [animation-delay:1.2s] motion-reduce:animate-none" />
            <Sparkles className="absolute -bottom-[2px] right-[22px] h-3.5 w-3.5 text-[#7bc5ff] opacity-0 [filter:drop-shadow(0_0_4px_currentColor)] animate-oc-sparkle [animation-delay:1.7s] motion-reduce:animate-none" />
          </div>
          <h1 className="m-0 mb-[13px] text-[29px] font-bold leading-[1.08] tracking-[-0.025em] text-white">
            Thank you! <span className="bg-[linear-gradient(90deg,#7bc5ff_0%,#0e9fe2_52%,#0e51e2_100%)] bg-clip-text text-transparent">{awaitingRelease ? 'Your pre-order is confirmed.' : 'Your order is complete.'}</span>
          </h1>
          <p className="m-0 text-[14px] leading-[1.62] text-[#9fb4d8]">
            {awaitingRelease ? (
              <>Your payment is confirmed. We&apos;ll deliver your keys on release day{releaseLabel ? <> (<b>{releaseLabel}</b>)</> : null} and email them
              {data.deliveredToEmail ? <> to <b>{data.deliveredToEmail}</b></> : null}.</>
            ) : (
              <>Your order details are below. Reveal and copy your keys any time — we&apos;ve also emailed a copy
              {data.deliveredToEmail ? <> to <b>{data.deliveredToEmail}</b></> : null}.</>
            )}
          </p>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[rgba(14,159,226,0.18)] bg-[rgba(10,31,71,0.72)] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-[16px] [backdrop-filter:blur(16px)_saturate(1.1)]">
          <div className="flex flex-wrap items-start justify-between gap-[18px] border-b border-white/[0.065] px-[28px] pb-[22px] pt-[24px]">
            <div className="flex flex-col gap-[11px]">
              <h2 className="m-0 flex flex-wrap items-center gap-[10px] text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6a80a8]">
                Order
                <span className="text-[19px] font-bold normal-case tracking-[0.02em] text-white [font-variant-numeric:tabular-nums]">{data.orderNumber || `#${String(data.orderId).slice(-8).toUpperCase()}`}</span>
              </h2>
              <span className="inline-flex items-center gap-[7px] rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-[11px] py-[5px] text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#7ef0ab]">
                <span className="h-[6px] w-[6px] rounded-full bg-[#22c55e] shadow-[0_0_7px_#22c55e]" />{awaitingRelease ? 'pre-order' : data.orderStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-[26px]">
              <span className={META_CELL}>Placed<b>{placedDate}</b></span>
              <span className={META_CELL}>Items<b>{data.itemCount ?? items.length}</b></span>
              <span className={META_CELL}>Delivery<b>{awaitingRelease ? 'On release' : 'Instant'}</b></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[16px] border-b border-white/[0.065] bg-[linear-gradient(180deg,rgba(255,255,255,0.012),transparent)] px-[28px] py-[18px] min-[761px]:flex-nowrap min-[761px]:gap-0">
            {steps.map((st, i) => (
              <div key={st.t} style={{ display: 'contents' }}>
                <div className="flex flex-[1_1_42%] items-center gap-[11px] min-[761px]:flex-[0_0_auto]">
                  <span className={`${OS_IC} ${st.done ? OS_IC_DONE : st.active ? OS_IC_ACTIVE : ''}`}>
                    {st.done ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="text-[12px] font-semibold tracking-[-0.005em] text-[#eef4fc]">{st.t}</span>
                    <div className="mt-[2px] text-[10.5px] text-[#6a80a8]">{st.s}</div>
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <span className={`hidden h-[2px] min-w-[16px] flex-[1_1_auto] rounded-[2px] mx-[14px] min-[761px]:block ${st.done ? 'bg-[linear-gradient(90deg,rgba(34,197,94,0.5),rgba(34,197,94,0.22))]' : 'bg-[rgba(14,159,226,0.18)]'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="px-[28px] py-[2px]">
            <div className="hidden grid-cols-[3fr_1.25fr_0.6fr_1fr_1fr_1.15fr] items-center gap-[14px] border-b border-white/[0.065] pb-[13px] pt-[16px] text-[10px] uppercase tracking-[0.13em] text-[#6a80a8] min-[861px]:grid [&>span:not(:first-child)]:text-center [&>span:last-child]:text-right">
              <span>Product</span><span>Type</span><span>Qty</span><span>Price</span><span>Row total</span><span>&nbsp;</span>
            </div>
            {items.map((it, i) => (
              <div className="grid grid-cols-1 items-center gap-[10px] border-b border-white/[0.065] py-[18px] last:border-b-0 min-[861px]:grid-cols-[3fr_1.25fr_0.6fr_1fr_1fr_1.15fr] min-[861px]:gap-[14px] min-[861px]:py-[20px] min-[861px]:[transition:background_0.16s] min-[861px]:hover:bg-[linear-gradient(90deg,rgba(14,159,226,0.04),transparent_60%)]" key={`${it.productName}-${i}`}>
              <div className="flex min-w-0 items-center gap-[15px]">
                <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[13px] border border-[rgba(14,159,226,0.18)] bg-[#0b1730] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.7)] after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] after:content-[''] [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
                  {it.productImage && <SafeImage src={it.productImage} alt={it.productName} />}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold leading-[1.3] tracking-[-0.005em] text-white">{it.productName}</div>
                  <span className="mt-[5px] inline-block rounded-[5px] border border-[rgba(14,159,226,0.24)] bg-[rgba(14,159,226,0.09)] px-[8px] py-[2px] text-[9px] font-semibold uppercase tracking-[0.09em] text-[#7bc5ff]">Digital product</span>
                  <div className="mt-[9px] flex flex-wrap items-center gap-[8px]">
                    <SellerAvatar name={it.sellerName} size={24} />
                    <span className="text-[11.5px] font-medium text-[#9fb4d8]">{it.sellerName}</span>
                  </div>
                </div>
              </div>
              <div className={CELL} data-label="Type">
                <span className={`${TYPE_BADGE} ${it.productType === 'ACCOUNT_BASED' ? '[&_svg]:text-[#93c5fd]' : '[&_svg]:text-[#7bc5ff]'}`}>
                  <KeyRound className="h-3.5 w-3.5" />
                  {it.productType === 'ACCOUNT_BASED' ? 'Account' : 'Key'}
                </span>
              </div>
              <div className={CELL} data-label="Qty">
                <span className="inline-flex h-[24px] min-w-[28px] items-center justify-center rounded-[7px] border border-[rgba(14,159,226,0.18)] px-[8px] text-[12px] font-semibold text-[#eef4fc]">{it.qty}</span>
              </div>
              <div className={CELL} data-label="Price">{formatPrice(it.unitPrice)}</div>
              <div className={`${CELL} min-[861px]:font-semibold min-[861px]:text-white`} data-label="Row total">{formatPrice(it.lineTotal)}</div>
              <div className={CELL_ACTION}>
                {it.refunded ? (
                  <span className="text-[11px] text-[#ff9b9b]">Refunded</span>
                ) : (
                  <button type="button" className={BTN_PRIMARY} onClick={() => setOpenItem(it)}>
                    <KeyRound className="h-3.5 w-3.5" />
                    {it.isPreorder && !it.keys?.length ? 'Details' : it.productType === 'ACCOUNT_BASED' ? 'View account' : 'View key'}
                  </button>
                )}
              </div>
              </div>
            ))}
          </div>

          <div className="relative h-[30px] before:absolute before:left-[28px] before:right-[28px] before:top-1/2 before:border-t-[1.6px] before:border-dashed before:border-[rgba(150,170,205,0.26)] before:content-['']">
            <span className="absolute left-0 top-1/2 h-[28px] w-[28px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050d20] shadow-[inset_0_0_0_1px_rgba(14,159,226,0.18)]" />
            <span className="absolute left-full top-1/2 h-[28px] w-[28px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050d20] shadow-[inset_0_0_0_1px_rgba(14,159,226,0.18)]" />
          </div>

          <div className="grid grid-cols-1 min-[861px]:grid-cols-[1fr_1fr_340px]">
            <div className="border-b border-white/[0.065] px-[28px] py-[22px] min-[861px]:border-b-0 min-[861px]:border-r">
              <div className={FOOT_LABEL}>Delivered to</div>
              <div className="break-words text-[13px] leading-[1.55] text-[#eef4fc]">{data.deliveredToEmail || '—'}</div>
            </div>
            <div className="border-b border-white/[0.065] px-[28px] py-[22px] min-[861px]:border-b-0 min-[861px]:border-r">
              <div className={FOOT_LABEL}>Payment method</div>
              <div className="break-words text-[13px] leading-[1.55] text-[#eef4fc]">
                {data.paymentMethod && <span className="mr-[8px] inline-flex h-[19px] items-center justify-center rounded-[5px] border border-[rgba(120,150,230,0.55)] bg-[linear-gradient(135deg,#12275f,#2a5ad8)] px-[7px] align-[2px] text-[10px] font-extrabold tracking-[0.1em] text-[#eef3fb] shadow-[0_2px_6px_-2px_rgba(42,90,216,0.6)]">{data.paymentMethod}</span>}
                <div className="text-[12px] text-[#6a80a8]">Paid {placedDate}</div>
              </div>
            </div>
            {summary ? (
              <div className="bg-[linear-gradient(180deg,rgba(14,159,226,0.035),transparent)] px-[28px] py-[22px]">
                <div className={SUM_ROW}><span className={SUM_Q}>Subtotal</span><span>{formatPrice(summary.subtotal)}</span></div>
                {summary.discount > 0 && (
                  <div className={SUM_ROW}><span className={SUM_Q}>Discounts</span><span>-{formatPrice(summary.discount)}</span></div>
                )}
                <div className={SUM_ROW}>
                  <span className={SUM_Q}>
                    Buyer protection
                    <span className="inline-flex h-[14px] w-[14px] cursor-help items-center justify-center rounded-full border border-[rgba(14,159,226,0.18)] text-[8.5px] text-[#6a80a8]" title="Covers escrow, dispute resolution &amp; platform security">?</span>
                  </span>
                  <span>{formatPrice(summary.buyerProtectionFee)}</span>
                </div>
                <div className={SUM_ROW}><span className={SUM_Q}>Checkout fee</span><span>{formatPrice(summary.buyerHandlingFee)}</span></div>
                <div className="my-[10px] h-px bg-white/[0.065]" />
                <div className="flex items-baseline justify-between pt-[4px]">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9fb4d8]">Grand total</span>
                  <span className="text-[23px] font-bold tracking-[-0.01em] text-white [font-variant-numeric:tabular-nums]">{formatPrice(summary.grandTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[linear-gradient(180deg,rgba(14,159,226,0.035),transparent)] px-[28px] py-[22px]">
                <div className={SUM_ROW}><span className={SUM_Q}>Order total is only visible to the buyer.</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-[22px] flex flex-wrap gap-[12px]">
          {isAuthenticated ? (
            <Link className={`${ACT_BTN} ${ACT_BTN_PRIMARY}`} to="/user/license-keys"><KeyRound className="h-4 w-4" />My license keys</Link>
          ) : (
            <Link className={`${ACT_BTN} ${ACT_BTN_PRIMARY}`} to="/register"><KeyRound className="h-4 w-4" />Create an account to save your keys</Link>
          )}
          {isAuthenticated && <Link className={ACT_BTN} to="/user/orders"><CreditCard className="h-4 w-4" />View all orders</Link>}
          <Link className={ACT_BTN} to="/user/support"><LifeBuoy className="h-4 w-4" />Get help</Link>
        </div>

        <div className="mt-[24px] flex flex-wrap items-center justify-center gap-[8px] text-center text-[12.5px] text-[#6a80a8] [&_a]:font-medium [&_a]:text-[#0e9fe2] [&_a]:no-underline [&_a:hover]:underline">
          <span>Your order confirmation has been sent to your email. Need help?</span>
          <Link to="/user/support">Contact DGMARQ Support</Link>
        </div>
      </div>

      {openItem && <ItemModal item={openItem} onClose={() => setOpenItem(null)} onToast={setToast} />}
      {toast && (
        <div className="fixed bottom-[26px] left-1/2 z-[9200] inline-flex -translate-x-1/2 items-center gap-[9px] rounded-[12px] border border-[rgba(34,197,94,0.4)] bg-[rgba(8,18,38,0.96)] px-[16px] py-[11px] text-[13px] text-[#eef4fc] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] animate-oc-rise [&_svg]:text-[#7ef0ab]"><Check className="h-4 w-4" />{toast}</div>
      )}
    </div>
  );
};

export default OrderComplete;
