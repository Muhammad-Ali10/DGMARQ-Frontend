import { SiSteam, SiEpicgames, SiPlaystation, SiNintendoswitch, SiGogdotcom, SiOrigin } from 'react-icons/si';
import { FaXbox } from 'react-icons/fa6';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';

/**
 * Real platform brand marks, driven by `LicenseKey.keyType` — the only field on
 * this platform that actually carries a store/console identity. It is already
 * returned by `licenseKeyAPI.getMyLicenseKeys` and the seller offer-keys
 * endpoint, so this needs no backend change.
 *
 * Deliberately NOT used on the order screens: order items only carry
 * `productType`, which is a DELIVERY MODEL (key vs. account vs. gift code), not
 * a platform. Rendering a Steam mark next to an order because the row happened
 * to be a LICENSE_KEY would be inventing information. Those screens use
 * <DeliveryTypeBadge> instead.
 *
 * When a real `platform` field is eventually exposed on products/offers, pass it
 * straight in as `platform` — the value vocabulary is the same shape and nothing
 * else has to change.
 *
 * react-icons is used here and ONLY here, per the icon rule: brand marks come
 * from the `si` set, everything else in the app is lucide. The one exception is
 * Xbox — Simple Icons removed that mark over trademark concerns, so it comes
 * from `fa6`. There is no `si` alternative.
 */
const PLATFORMS = {
  steam: { label: 'Steam', Icon: SiSteam },
  epic: { label: 'Epic Games', Icon: SiEpicgames },
  xbox: { label: 'Xbox', Icon: FaXbox },
  playstation: { label: 'PlayStation', Icon: SiPlaystation },
  nintendo: { label: 'Nintendo', Icon: SiNintendoswitch },
  origin: { label: 'EA / Origin', Icon: SiOrigin },
  gog: { label: 'GOG', Icon: SiGogdotcom },
};

/**
 * Two vocabularies reach this component and they are not identical:
 *   - `LicenseKey.keyType` slugs  ("steam", "playstation", "origin")
 *   - `Platform.name` display strings from the catalog taxonomy, which the
 *     wishlist endpoint populates ("Epic Games", "Nintendo Switch", "EA")
 * This folds the second onto the first. Anything unrecognised falls through to
 * a neutral chip showing the raw text, so a new platform in the taxonomy shows
 * its name rather than silently disappearing.
 */
const ALIASES = {
  'epic games': 'epic',
  epicgames: 'epic',
  'nintendo switch': 'nintendo',
  switch: 'nintendo',
  ea: 'origin',
  'ea app': 'origin',
  'ea play': 'origin',
  'playstation network': 'playstation',
  psn: 'playstation',
  'xbox live': 'xbox',
  microsoft: 'xbox',
  'gog.com': 'gog',
  'gog galaxy': 'gog',
};

const normalize = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return ALIASES[key] || key;
};

/** True when this value maps to a real, brandable platform. */
export const isKnownPlatform = (value) => Boolean(PLATFORMS[normalize(value)]);

/**
 * @param {string} platform - a keyType value ("steam", "xbox", …)
 * @param {boolean} [iconOnly] - hide the text label (keeps an accessible name)
 */
export const PlatformBadge = ({ platform, iconOnly = false, className }) => {
  const entry = PLATFORMS[normalize(platform)];

  // 'account' and 'other' are storage models, not platforms. Show the raw value
  // as a neutral chip rather than pretending we know the store.
  if (!entry) {
    return (
      <Badge variant="neutral" className={cn('capitalize', className)}>
        {platform || 'Unknown'}
      </Badge>
    );
  }

  const { label, Icon } = entry;
  return (
    <Badge
      variant="neutral"
      className={cn('gap-1.5', className)}
      title={iconOnly ? label : undefined}
    >
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </Badge>
  );
};

export default PlatformBadge;
