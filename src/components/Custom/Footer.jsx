import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Boxes,
  ShieldCheck,
  Globe,
  RotateCcw,
  DollarSign,
  BadgeCheck,
  Headphones,
  Clock,
  Mail,
  ArrowRight,
  Rss,
} from "lucide-react";
import SafeImage from "@components/ui/safe-image";
import "./Footer.css";

const CURRENCIES = [
  { code: "AUD", flag: "au", name: "Australian Dollar" },
  { code: "USD", flag: "us", name: "US Dollar" },
  { code: "EUR", flag: "eu", name: "Euro" },
  { code: "GBP", flag: "gb", name: "British Pound" },
  { code: "CAD", flag: "ca", name: "Canadian Dollar" },
  { code: "NZD", flag: "nz", name: "New Zealand Dollar" },
  { code: "SGD", flag: "sg", name: "Singapore Dollar" },
  { code: "JPY", flag: "jp", name: "Japanese Yen" },
];

const WHY = [
  { cls: "wdb-blue", icon: <Boxes />, title: "Massive digital catalogue", sub: (<>Thousands of <strong className="hl">game keys</strong> &amp; digital products</>) },
  { cls: "wdb-green", icon: <ShieldCheck />, title: "Verified sellers only", sub: (<><strong className="hl">Full KYC/KYB</strong> on individuals &amp; businesses</>) },
  { cls: "wdb-cyan", icon: <Globe />, title: "Global marketplace", sub: (<>Buyers &amp; sellers across <strong className="hl">100+</strong> countries</>) },
  { cls: "wdb-blue", icon: <RotateCcw />, title: "Refund window", sub: (<>Eligible purchases refunded within the <strong className="hl">refund window</strong></>) },
];

const COMPARE = [
  { icon: <DollarSign />, title: "Just 7% commission", sub: (<>vs <strong>10–15%</strong> on other marketplaces</>) },
  { icon: <BadgeCheck />, title: "Authorised retailers", sub: (<>From <strong>official partners</strong> only</>) },
  { icon: <Headphones />, title: "Real human support", sub: (<><strong>24/7 live agents</strong>, never bots</>) },
  { icon: <ShieldCheck />, title: "98.7% disputes solved", sub: (<>resolved within <strong>24 hours</strong></>) },
  { icon: <Clock />, title: "Instant delivery", sub: (<>on <strong>all products</strong>, 24/7</>) },
];

const SOCIALS = [
  { name: "Instagram", href: "https://instagram.com/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /><circle cx="12" cy="12" r="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.7)" /></svg> },
  { name: "Facebook", href: "https://facebook.com/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg> },
  { name: "LinkedIn", href: "https://linkedin.com/company/dgmarq", svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="2" y="9" width="4" height="12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4" cy="4" r="2" stroke="rgba(255,255,255,0.7)" strokeWidth="2" /></svg> },
];

const Footer = () => {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [email, setEmail] = useState("");
  const currencyRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Visual-only: no newsletter endpoint exists yet. Acknowledge the submit.
  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks! We'll keep you posted on the best deals.");
    setEmail("");
  };

  return (
    <div className="ftr-fx flex flex-col w-full text-white">
      {/* Why DGMARQ band */}
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

      {/* Compare + Stats strip */}
      <div className="cmp-section">
        <div className="cmp-inner">
          <p className="cmp-heading">Why shop with<span className="mark">DGMARQ</span></p>
          <div className="cmp-features">
            {COMPARE.map((f) => (
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

      {/* Accepted payments */}
      <div className="w-full py-6 bg-[#07173D]">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 w-full m-auto px-4">
          <h3 className="text-sm sm:text-base font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Accepted Payments</h3>
          <SafeImage src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393674/payments_qpgfwb.png" alt="payments" className="w-full max-w-[300px] sm:max-w-[460px]" />
        </div>
      </div>

      {/* Newsletter band (visual — no newsletter endpoint yet) */}
      <div className="fx-news-band">
        <span className="fx-news-grid" aria-hidden="true" />
        <span className="fx-news-glow fx-news-glow-a" aria-hidden="true" />
        <span className="fx-news-glow fx-news-glow-b" aria-hidden="true" />
        <div className="fx-news-inner">
          <div className="fx-news-copy">
            <div className="fx-news-badge"><Rss width={13} height={13} /> DGMARQ INSIDER</div>
            <h3 className="fx-news-title">Join our newsletter and enjoy <span className="fx-news-accent">exclusive deals</span></h3>
            <p className="fx-news-sub">Subscribe to get updates, new releases and members-only discounts straight to your inbox.</p>
          </div>
          <form className="fx-news-form" onSubmit={handleNewsletter}>
            <span className="fx-corner fx-corner-tl" /><span className="fx-corner fx-corner-tr" /><span className="fx-corner fx-corner-bl" /><span className="fx-corner fx-corner-br" />
            <div className="fx-news-field">
              <span className="fx-news-mail" aria-hidden="true"><Mail width={18} height={18} /></span>
              <input className="fx-news-input" type="email" placeholder="Enter your email" aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="fx-news-btn" type="submit">
                <span>Subscribe</span> <ArrowRight width={16} height={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer columns */}
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
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold uppercase pb-4">Support</h3>
          <Link className="text-sm leading-7 underline" to="/terms-conditions">Terms and conditions</Link>
          <Link className="text-sm leading-7 underline" to="/privacy-policy">Privacy and cookie Policy</Link>
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

      {/* Bottom bar */}
      <div style={{ background: "#04101F", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, flex: 1, minWidth: 260, margin: 0 }}>
            Using the DGMARQ.COM platform constitutes acceptance of the{" "}
            <Link to="/terms-conditions" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline", textUnderlineOffset: 2 }}>DGMARQ Terms and Conditions</Link>. Information on how we process your personal data can be found in the{" "}
            <Link to="/privacy-policy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy and Cookie Policy</Link>. Copyright © DGMARQ. All rights reserved.
          </p>
          <div style={{ position: "relative", flexShrink: 0 }} ref={currencyRef}>
            <button className="ftr-curr-btn" type="button" onClick={() => setCurrencyOpen((o) => !o)}>
              <img src={`https://flagcdn.com/w20/${currency.flag}.png`} width={22} height={16} alt={currency.code} style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>English EU&nbsp;&nbsp;|&nbsp;&nbsp;{currency.code}</span>
            </button>
            {currencyOpen && (
              <div className="ftr-curr-dropdown">
                {CURRENCIES.map((c) => (
                  <button key={c.code} type="button" className="ftr-curr-item" onClick={() => { setCurrency(c); setCurrencyOpen(false); }}>
                    <img src={`https://flagcdn.com/w20/${c.flag}.png`} width={20} height={14} alt={c.code} style={{ borderRadius: 2 }} />
                    <span>{c.code} — {c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
