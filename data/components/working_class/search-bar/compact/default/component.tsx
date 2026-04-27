import { type HTMLAttributes, useRef } from 'react';
import { cn } from '@skeed/core/cn';

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

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

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
          {loading ? <SpinnerIcon /> : <SearchIcon />}
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
            <XIcon />
          </button>
        )}
      </form>
    </div>
  );
}
