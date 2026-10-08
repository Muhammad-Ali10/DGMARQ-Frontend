import { SiSteam, SiEpicgames, SiPlaystation, SiNintendoswitch, SiGogdotcom, SiOrigin } from 'react-icons/si';
import { FaXbox } from 'react-icons/fa6';
import { Badge } from '@components/ui/badge';
import { cn } from '@lib/utils';
import { normalizePlatform } from '@lib/platform';

const PLATFORMS = {
  steam: { label: 'Steam', Icon: SiSteam },
  epic: { label: 'Epic Games', Icon: SiEpicgames },
  xbox: { label: 'Xbox', Icon: FaXbox },
  playstation: { label: 'PlayStation', Icon: SiPlaystation },
  nintendo: { label: 'Nintendo', Icon: SiNintendoswitch },
  origin: { label: 'EA / Origin', Icon: SiOrigin },
  gog: { label: 'GOG', Icon: SiGogdotcom },
};

export const isKnownPlatform = (value) => Boolean(PLATFORMS[normalizePlatform(value)]);

export const PlatformBadge = ({ platform, iconOnly = false, className }) => {
  const entry = PLATFORMS[normalizePlatform(platform)];

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
