import { cn } from '@skeed/core/cn';
import { forwardRef } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(function Pagination(
  { currentPage, totalPages, onPageChange },
  ref,
) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav ref={ref} aria-label="Pagination" className="flex items-center gap-skeed-spacing-1">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(
          'px-skeed-spacing-2 py-skeed-spacing-1',
          'rounded-skeed-radius-1',
          'text-sm font-skeed-body',
          currentPage === 1
            ? 'text-skeed-color-neutral-400 cursor-not-allowed'
            : 'text-skeed-color-neutral-700 hover:bg-skeed-color-neutral-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
        )}
        aria-label="Previous page"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-label={`Page ${page}`}
          aria-current={currentPage === page ? 'page' : undefined}
          className={cn(
            'h-skeed-spacing-8 w-skeed-spacing-8',
            'rounded-skeed-radius-1',
            'text-sm font-medium font-skeed-body',
            'flex items-center justify-center',
            currentPage === page
              ? 'bg-skeed-color-brand-500 text-white'
              : 'text-skeed-color-neutral-700 hover:bg-skeed-color-neutral-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          )}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(
          'px-skeed-spacing-2 py-skeed-spacing-1',
          'rounded-skeed-radius-1',
          'text-sm font-skeed-body',
          currentPage === totalPages
            ? 'text-skeed-color-neutral-400 cursor-not-allowed'
            : 'text-skeed-color-neutral-700 hover:bg-skeed-color-neutral-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
        )}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
});
