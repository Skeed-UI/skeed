import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@skeed/core/cn';

export interface FileUploaderProps extends InputHTMLAttributes<HTMLInputElement> {
  accept?: string;
  multiple?: boolean;
}

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(function FileUploader(
  { className, accept, multiple, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'px-skeed-spacing-6 py-skeed-spacing-8',
        'border-2 border-dashed border-skeed-color-neutral-300',
        'rounded-skeed-radius-2',
        'bg-skeed-color-neutral-50 hover:bg-skeed-color-neutral-100',
        'transition-colors duration-skeed-motion-duration-fast',
        className,
      )}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        {...rest}
      />
      <div className="text-center">
        <p className="text-sm font-medium font-skeed-body text-skeed-color-neutral-700">
          Drag and drop files here
        </p>
        <p className="text-xs font-skeed-body text-skeed-color-neutral-500 mt-skeed-spacing-1">
          or click to browse
        </p>
      </div>
    </div>
  );
});
