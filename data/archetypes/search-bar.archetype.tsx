import { type HTMLAttributes, useRef } from 'react';
import { cn } from '@skeed/core/cn';
import { Search, X, Spinner } from '@skeed/asset-icon';

export interface SearchBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-8 text-sm px-skeed-spacing-3',
  md: 'h-10 px-skeed-density-cozy-padx',
  lg: 'h-12 px-skeed-spacing-4 text-lg',
};

const ICON_SIZE_CLASSES = {
  sm: 'left-skeed-spacing-2',
  md: 'left-skeed-spacing-3',
  lg: 'left-skeed-spacing-4',
};

const CLEAR_SIZE_CLASSES = {
  sm: 'right-skeed-spacing-2',
  md: 'right-skeed-spacing-3',
  lg: 'right-skeed-spacing-4',
};

const LEADING_PADDING = {
  sm: 'pl-skeed-spacing-8',
  md: 'pl-skeed-spacing-10',
  lg: 'pl-skeed-spacing-11',
};

const TRAILING_PADDING = {
  sm: 'pr-skeed-spacing-8',
  md: 'pr-skeed-spacing-10',
  lg: 'pr-skeed-spacing-11',
};

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  loading = false,
  clearable = true,
  size = 'md',
  fullWidth = false,
  className,
  ...rest
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const showClear = clearable && value.length > 0 && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && value.length > 0) {
      e.preventDefault();
      onChange('');
    }
  };

  return (
    <div
      role="search"
      className={cn(fullWidth ? 'w-full' : 'w-auto', className)}
      {...rest}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Leading icon: spinner when loading, search icon otherwise */}
        <span
          className={cn(
            'pointer-events-none absolute flex items-center',
            loading ? 'text-skeed-color-brand-500' : 'text-skeed-color-neutral-400',
            ICON_SIZE_CLASSES[size],
          )}
        >
          {loading ? <Spinner size={16} className="animate-spin" /> : <Search size={16} />}
        </span>

        <input
          ref={inputRef}
          type="search"
          role="searchbox"
          aria-label="Search"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full appearance-none bg-skeed-color-neutral-50 text-skeed-color-neutral-900 ' +
            'border border-skeed-color-neutral-300 rounded-skeed-radius-2 ' +
            'font-skeed-body placeholder:text-skeed-color-neutral-400 ' +
            'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500 ' +
            'focus-visible:border-skeed-color-brand-500 ' +
            'disabled:pointer-events-none disabled:opacity-50',
            SIZE_CLASSES[size],
            LEADING_PADDING[size],
            showClear && TRAILING_PADDING[size],
          )}
        />

        {showClear && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className={cn(
              'absolute flex items-center justify-center rounded-skeed-radius-2 ' +
              'text-skeed-color-neutral-400 hover:text-skeed-color-neutral-900 ' +
              'transition-colors duration-skeed-motion-duration-fast ease-skeed-motion-easing-default ' +
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
              CLEAR_SIZE_CLASSES[size],
            )}
          >
            <X size={14} />
          </button>
        )}
      </form>
    </div>
  );
}
