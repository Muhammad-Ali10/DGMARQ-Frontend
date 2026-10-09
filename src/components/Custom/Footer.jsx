import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  ShieldCheck,
  Globe,
  RotateCcw,
  DollarSign,
  BadgeCheck,
  Headphones,
  Clock,
} from "lucide-react";
import SafeImage from "@components/ui/safe-image";
import useCurrency from "@hooks/useCurrency";
import useLanguage from "@hooks/useLanguage";
import useBuyerCountry from "@hooks/useBuyerCountry";
import { useLegalFigures } from "@features/content/legal/useLegalFigures";
import CurrencyLanguageModal from "./CurrencyLanguageModal";
import "./Footer.css";

const WHY = [
  { cls: "wdb-blue", icon: <Boxes />, title: "Massive digital catalogue", sub: (<>Thousands of <strong className="hl">game keys</strong> &amp; digital products</>) },
  { cls: "wdb-green", icon: <ShieldCheck />, title: "Verified sellers only", sub: (<><strong className="hl">Full KYC/KYB</strong> on individuals &amp; businesses</>) },
  { cls: "wdb-cyan", icon: <Globe />, title: "Global marketplace", sub: (<>Region-aware keys with <strong className="hl">local currency</strong> pricing</>) },
  { cls: "wdb-blue", icon: <RotateCcw />, title: "Refund window", sub: (<>Eligible purchases refunded within the <strong className="hl">refund window</strong></>) },
];

const compareItems = (commissionRatePercent) => [
  { icon: <DollarSign />, title: `Just ${commissionRatePercent}% commission`, sub: (<>vs <strong>10–15%</strong> on other marketplaces</>) },
  { icon: <BadgeCheck />, title: "Clear activation regions", sub: (<>Every offer shows <strong>where its key works</strong></>) },
  { icon: <Headphones />, title: "Real human support", sub: (<><strong>Support tickets &amp; live chat</strong>, never bots</>) },
  { icon: <ShieldCheck />, title: "Buyer protection", sub: (<>Seller payouts held in <strong>escrow</strong></>) },
  { icon: <Clock />, title: "Instant delivery", sub: (<>on <strong>in-stock keys</strong>, 24/7</>) },
];

const SOCIALS = [
  { name: "Instagram", href: "https://instagram.com/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /><circle cx="12" cy="12" r="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.7)" /></svg> },
  { name: "Facebook", href: "https://facebook.com/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg> },
  { name: "LinkedIn", href: "https://linkedin.com/company/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="2" y="9" width="4" height="12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4" cy="4" r="2" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /></svg> },
  { name: "Discord", href: "https://discord.gg/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M20.32 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg> },
];

const Footer = () => {
  const { currency: currencyCode } = useCurrency();
  const { language } = useLanguage();
  const { country } = useBuyerCountry();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { commissionRatePercent } = useLegalFigures().figures;
  const compare = useMemo(() => compareItems(commissionRatePercent), [commissionRatePercent]);

  return (
    <div className="ftr-fx flex flex-col w-full text-fg">
      <div className="wdb">
        <div className="wdb-brand">
          <span className="why">Why</span> <span className="mark">DGMARQ?</span>
        </div>
        <div className="wdb-divider" />
        <div className="wdb-features">
          {WHY.map((f) => (
            <div key={f.title} className={`wdb-feature ${f.cls}`}>
              <div className="wdb-icon">{f.icon}</div>
              <div>
                <p className="title">{f.title}</p>
                <p className="sub">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cmp-section">
        <div className="cmp-inner">
          <p className="cmp-heading">Why shop with<span className="mark">DGMARQ</span></p>
          <div className="cmp-features">
            {compare.map((f) => (
              <div key={f.title} className="cmp-feature">
                <div className="cmp-icon">{f.icon}</div>
                <div>
                  <p className="title">{f.title}</p>
                  <p className="sub">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full py-6 bg-[#07173D]">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 w-full m-auto px-4">
          <h3 className="text-sm sm:text-base font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Accepted Payments</h3>
          <SafeImage src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393674/payments_qpgfwb.png" alt="payments" className="w-full max-w-[300px] sm:max-w-[460px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 p-4 sm:p-5 md:py-6 m-auto gap-6 sm:gap-4 w-full max-w-7xl">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">About</h3>
          <Link className="text-sm leading-7 underline" to="/about">Company</Link>
          <Link className="text-sm leading-7 underline" to="/marketplace">Marketplace</Link>
          <Link className="text-sm leading-7 underline" to="/security">Security</Link>
          <Link className="text-sm leading-7 underline" to="/contactus">Contact</Link>
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">For buyers</h3>
          <Link className="text-sm leading-7 underline" to="/buyer-support">Buyer support</Link>
          <Link className="text-sm leading-7 underline" to="/how-to-buy">How to buy</Link>
          <Link className="text-sm leading-7 underline" to="/dgmarq-plus">Buy with DGMARQ Plus</Link>
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">For Seller</h3>
          <Link className="text-sm leading-7 underline" to="/seller-support">Seller support</Link>
          <Link className="text-sm leading-7 underline" to="/how-to-sell">How to Sell</Link>
          <Link className="text-sm leading-7 underline" to="/vendor-terms">Vendor Terms</Link>
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">Support</h3>
          <Link className="text-sm leading-7 underline" to="/terms-conditions">Terms and conditions</Link>
          <Link className="text-sm leading-7 underline" to="/privacy-policy">Privacy and cookie Policy</Link>
          <Link className="text-sm leading-7 underline" to="/refund-policy">Refund Policy</Link>
          <Link className="text-sm leading-7 underline" to="/fee-schedule">Fee Schedule</Link>
          <Link className="text-sm leading-7 underline" to="/security">Stay Safe</Link>
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">Business</h3>
          <Link to="/how-to-sell" className="ftr-sell-btn">Sell on DGMARQ</Link>
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">Follow Us</h3>
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="ftr-social">
              <span className="ftr-social-ico">{s.svg}</span>
              <span>{s.name}</span>
            </a>
          ))}
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">Reviews</h3>
          <a href="https://www.trustpilot.com/review/dgmarq.com" target="_blank" rel="noopener noreferrer" className="ftr-tp">
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>See our reviews on</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 40 40"><polygon points="20,6 24.5,17.5 37,17.5 27,25.5 30.5,37 20,30 9.5,37 13,25.5 3,17.5 15.5,17.5" fill="#fff" /></svg>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Trustpilot</span>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2, 3].map((i) => (
                <svg key={i} width="24" height="24" viewBox="0 0 40 40"><rect width="40" height="40" fill="#00B67A" /><polygon points="20,6 24.5,17.5 37,17.5 27,25.5 30.5,37 20,30 9.5,37 13,25.5 3,17.5 15.5,17.5" fill="#fff" /></svg>
              ))}
              <svg width="24" height="24" viewBox="0 0 40 40"><defs><clipPath id="tp-clip-ftr"><rect x="0" y="0" width="13" height="40" /></clipPath></defs><rect width="40" height="40" fill="#DCDCE6" /><rect width="40" height="40" fill="#00B67A" clipPath="url(#tp-clip-ftr)" /><polygon points="20,6 24.5,17.5 37,17.5 27,25.5 30.5,37 20,30 9.5,37 13,25.5 3,17.5 15.5,17.5" fill="#fff" /></svg>
            </div>
          </a>
        </div>
      </div>

      <div style={{ background: "#04101F", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, flex: 1, minWidth: 260, margin: 0 }}>
            Using the DGMARQ.COM platform constitutes acceptance of the{" "}
            <Link to="/terms-conditions" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline", textUnderlineOffset: 2 }}>DGMARQ Terms and Conditions</Link>. Information on how we process your personal data can be found in the{" "}
            <Link to="/privacy-policy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy and Cookie Policy</Link>. Copyright © DGMARQ. All rights reserved.
          </p>
          <button className="ftr-curr-btn" type="button" onClick={() => setSettingsOpen(true)} style={{ flexShrink: 0 }}>
            <img src={`https://flagcdn.com/w20/${String(country || "us").toLowerCase()}.png`} width={22} height={16} alt={country || ""} style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{language}&nbsp;&nbsp;|&nbsp;&nbsp;{currencyCode}</span>
          </button>
        </div>
      </div>

      <CurrencyLanguageModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Footer;
