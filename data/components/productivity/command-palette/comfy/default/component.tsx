import { type HTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@skeed/core/cn';

export interface Command {
  id: string;
  title: string;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  commands: Command[];
  onClose?: () => void;
}

export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(function CommandPalette(
  { className, open = false, commands, onClose, ...rest },
  ref,
) {
  const [search, setSearch] = useState('');
  const inputId = 'command-palette-input';

  if (!open) return null;

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-skeed-spacing-20"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-skeed-color-neutral-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={cn(
          'relative z-10 w-full max-w-lg',
          'bg-skeed-color-neutral-50',
          'rounded-skeed-radius-2 shadow-skeed-shadow-3',
          'm-skeed-spacing-4 overflow-hidden',
          className,
        )}
        {...rest}
      >
        <div className="border-b border-skeed-color-neutral-200 px-skeed-spacing-4 py-skeed-spacing-3">
          <input
            id={inputId}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands..."
            className={cn(
              'w-full',
              'text-base font-skeed-body text-skeed-color-neutral-900',
              'placeholder:text-skeed-color-neutral-400',
              'focus:outline-none',
            )}
            autoFocus
          />
        </div>
        <div className="max-h-skeed-spacing-80 overflow-y-auto py-skeed-spacing-1">
          {filteredCommands.length === 0 ? (
            <div className="px-skeed-spacing-4 py-skeed-spacing-3 text-sm font-skeed-body text-skeed-color-neutral-500">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={() => {
                  command.onSelect();
                  onClose?.();
                }}
                className={cn(
                  'w-full flex items-center justify-between',
                  'px-skeed-spacing-4 py-skeed-spacing-2',
                  'text-sm font-skeed-body text-skeed-color-neutral-700',
                  'hover:bg-skeed-color-neutral-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
                )}
              >
                <span>{command.title}</span>
                {command.shortcut && (
                  <kbd className="px-skeed-spacing-1 py-skeed-spacing-0 text-xs font-skeed-mono bg-skeed-color-neutral-200 rounded-skeed-radius-1">
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
