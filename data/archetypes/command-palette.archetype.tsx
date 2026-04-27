import { type HTMLAttributes, forwardRef, useState, useEffect, useCallback, useRef } from 'react';
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
  forwardedRef,
) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const inputId = 'command-palette-input';

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase()),
  );

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'Escape':
        onClose?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
          onClose?.();
        }
        break;
      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedIndex(filteredCommands.length - 1);
        break;
    }
  }, [open, filteredCommands, selectedIndex, onClose]);

  // Add keyboard listeners and manage focus/scroll
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus input after render
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (!open && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

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
        ref={(node) => {
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
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
            ref={inputRef}
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
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={filteredCommands[selectedIndex]?.id}
          />
        </div>
        <div id="command-list" role="listbox" className="max-h-skeed-spacing-80 overflow-y-auto py-skeed-spacing-1">
          {filteredCommands.length === 0 ? (
            <div className="px-skeed-spacing-4 py-skeed-spacing-3 text-sm font-skeed-body text-skeed-color-neutral-500">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                id={command.id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
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
                  index === selectedIndex && 'bg-skeed-color-neutral-100',
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
