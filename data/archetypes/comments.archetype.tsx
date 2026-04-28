import { cn } from '@skeed/core/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
}

export interface CommentsProps extends HTMLAttributes<HTMLDivElement> {
  comments: Comment[];
}

export const Comments = forwardRef<HTMLDivElement, CommentsProps>(function Comments(
  { className, comments, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn('flex flex-col gap-skeed-spacing-4', className)} {...rest}>
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-skeed-spacing-3">
          <div className="h-skeed-spacing-8 w-skeed-spacing-8 rounded-skeed-radius-9999 bg-skeed-color-neutral-200 flex-shrink-0 overflow-hidden">
            {comment.avatar ? (
              <img
                src={comment.avatar}
                alt={comment.author}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-skeed-body text-skeed-color-neutral-500">
                {comment.author.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-skeed-spacing-2 mb-skeed-spacing-1">
              <span className="text-sm font-semibold font-skeed-body text-skeed-color-neutral-900">
                {comment.author}
              </span>
              <span className="text-xs font-skeed-body text-skeed-color-neutral-500">
                {comment.timestamp}
              </span>
            </div>
            <p className="text-sm font-skeed-body text-skeed-color-neutral-700">
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});
