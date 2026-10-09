import { MENU_ICON_KEYS, getMenuIcon } from '@lib/menuIcons';
import { cn } from '@lib/utils';

export const IconPicker = ({ value, onChange, className }) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    {MENU_ICON_KEYS.map((key) => {
      const Icon = getMenuIcon(key);
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(value === key ? '' : key)}
          aria-label={key}
          aria-pressed={value === key}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
            value === key
              ? 'border-accent bg-accent/15 text-accent-on-dark'
              : 'border-border text-fg-muted hover:border-accent/50 hover:text-fg'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    })}
  </div>
);

export default IconPicker;
