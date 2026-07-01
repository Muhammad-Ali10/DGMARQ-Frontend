import {
  HiLockClosed,
  HiShieldCheck,
  HiKey,
  HiCurrencyDollar,
  HiScale,
  HiShieldExclamation,
} from 'react-icons/hi2';
import GlowCard from './GlowCard';

const ICON_MAP = {
  HiLockClosed,
  HiShieldCheck,
  HiKey,
  HiCurrencyDollar,
  HiScale,
  HiShieldExclamation,
};

export default function TechCard({ title, description, icon }) {
  const IconComponent = ICON_MAP[icon] || HiLockClosed;

  return (
    <GlowCard>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <IconComponent className="w-5 h-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </GlowCard>
  );
}
