import "./PaymentLogos.css";

// The payment methods a buyer can actually reach from <PaymentModal>: Google Pay
// and PayPal as their own tiles, and card brands via PayPal's card fields.
// Apple Pay is deliberately absent (owner-locked: explicitly off).
const PaymentLogos = () => (
  <>
    <span className="dg-paylogo" title="Google Pay">
      <svg width="34" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.2 1.6l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
      </svg>
    </span>
    <span className="dg-paylogo" title="PayPal">
      <span className="text-[12px] font-extrabold leading-none">
        <span style={{ color: "#003087" }}>Pay</span>
        <span style={{ color: "#009cde" }}>Pal</span>
      </span>
    </span>
    <span className="dg-paylogo" title="Visa">
      <span className="text-[11px] font-extrabold italic tracking-wide text-white/80">VISA</span>
    </span>
    <span className="dg-paylogo" title="Mastercard">
      <svg width="27" height="17" viewBox="0 0 38 24" aria-hidden="true">
        <circle cx="15" cy="12" r="10" fill="#EB001B" />
        <circle cx="23" cy="12" r="10" fill="#F79E1B" />
        <path d="M19 4.93a10 10 0 0 1 0 14.14A10 10 0 0 1 19 4.93z" fill="#FF5F00" />
      </svg>
    </span>
    <span className="dg-paylogo" title="American Express">
      <span className="text-[10px] font-extrabold tracking-wide text-[#6cb6ff]">AMEX</span>
    </span>
  </>
);

export default PaymentLogos;
