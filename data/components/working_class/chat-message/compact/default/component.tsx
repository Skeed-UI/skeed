import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface ChatMessageProps extends HTMLAttributes<HTMLDivElement> {
  sender: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(function ChatMessage(
  { className, sender, avatar, content, timestamp, isMe = false, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex gap-skeed-spacing-3',
        isMe ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
      {...rest}
    >
      <div className="h-skeed-spacing-8 w-skeed-spacing-8 rounded-skeed-radius-9999 bg-skeed-color-neutral-200 flex-shrink-0 overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={sender} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs font-skeed-body text-skeed-color-neutral-500">
            {sender.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className={cn('flex flex-col max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-skeed-spacing-2 mb-skeed-spacing-1">
          <span className="text-xs font-medium font-skeed-body text-skeed-color-neutral-600">
            {sender}
          </span>
          <span className="text-xs font-skeed-body text-skeed-color-neutral-400">
            {timestamp}
          </span>
        </div>
        <div
          className={cn(
            'px-skeed-spacing-3 py-skeed-spacing-2',
            'rounded-skeed-radius-2',
            'text-sm font-skeed-body',
            isMe
              ? 'bg-skeed-color-brand-500 text-white'
              : 'bg-skeed-color-neutral-100 text-skeed-color-neutral-900',
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
});
