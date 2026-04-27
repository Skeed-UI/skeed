import { type InputHTMLAttributes, forwardRef, useState, useRef, useCallback, useId } from 'react';
import { cn } from '@skeed/core/cn';
import { Upload, X, AlertCircle, Check } from '@skeed/asset-icon';

export interface FileInfo {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface FileUploaderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  value?: FileInfo[];
  onChange?: (files: FileInfo[]) => void;
  onUpload?: (file: FileInfo) => Promise<void>;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(function FileUploader(
  {
    className,
    accept,
    multiple,
    maxSize,
    maxFiles = 10,
    value,
    onChange,
    onUpload,
    disabled,
    label = 'Upload files',
    helperText,
    ...rest
  },
  ref,
) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>(value ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusId = useId();

  // Sync with controlled value
  if (value !== undefined && value !== files) {
    setFiles(value);
  }

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File too large (max ${formatFileSize(maxSize)})`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const isAccepted = acceptedTypes.some((type) => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type || file.name.endsWith(type.replace('.', ''));
      });
      if (!isAccepted) {
        return `Invalid file type (accepted: ${accept})`;
      }
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles || disabled) return;

      const fileArray = Array.from(newFiles);
      const remainingSlots = maxFiles - files.length;
      const filesToAdd = fileArray.slice(0, remainingSlots);

      const newFileInfos: FileInfo[] = filesToAdd.map((file) => {
        const error = validateFile(file);
        return {
          id: generateId(),
          file,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error ?? undefined,
        };
      });

      const updatedFiles = [...files, ...newFileInfos];
      setFiles(updatedFiles);
      onChange?.(updatedFiles);

      // Auto-upload if handler provided
      if (onUpload) {
        newFileInfos
          .filter((f) => f.status === 'pending')
          .forEach(async (fileInfo) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === fileInfo.id ? { ...f, status: 'uploading' } : f)),
            );

            try {
              await onUpload(fileInfo);
              setFiles((prev) =>
                prev.map((f) => (f.id === fileInfo.id ? { ...f, status: 'complete', progress: 100 } : f)),
              );
            } catch (error) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileInfo.id
                    ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
                    : f,
                ),
              );
            }
          });
      }
    },
    [files, maxFiles, maxSize, accept, disabled, onChange, onUpload],
  );

  const removeFile = useCallback(
    (id: string) => {
      if (disabled) return;
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      onChange?.(updated);
    },
    [files, disabled, onChange],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [addFiles],
  );

  const hasErrors = files.some((f) => f.status === 'error');
  const canAddMore = files.length < maxFiles;

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium font-skeed-body text-skeed-color-neutral-900 mb-skeed-spacing-2">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={helperText ? `${statusId}-helper` : undefined}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'flex flex-col items-center justify-center',
          'px-skeed-spacing-6 py-skeed-spacing-8',
          'border-2 border-dashed rounded-skeed-radius-2',
          'transition-colors duration-skeed-motion-duration-fast',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
          isDragOver
            ? 'border-skeed-color-brand-500 bg-skeed-color-brand-50'
            : hasErrors
              ? 'border-skeed-color-danger-300 bg-skeed-color-danger-50'
              : 'border-skeed-color-neutral-300 bg-skeed-color-neutral-50 hover:bg-skeed-color-neutral-100',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          ref={(node) => {
            // Handle both refs
            inputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
          {...rest}
        />

        <Upload
          size={32}
          className={cn(
            'mb-skeed-spacing-3',
            isDragOver
              ? 'text-skeed-color-brand-500'
              : hasErrors
                ? 'text-skeed-color-danger-500'
                : 'text-skeed-color-neutral-400',
          )}
        />

        <div className="text-center">
          <p className="text-sm font-medium font-skeed-body text-skeed-color-neutral-700">
            {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-xs font-skeed-body text-skeed-color-neutral-500 mt-skeed-spacing-1">
            or click to browse
            {maxFiles > 1 && (
              <span className="block mt-skeed-spacing-1">
                {files.length} / {maxFiles} files
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Helper Text */}
      {helperText && (
        <p id={`${statusId}-helper`} className="mt-skeed-spacing-1 text-xs text-skeed-color-neutral-500">
          {helperText}
          {maxSize && ` • Max ${formatFileSize(maxSize)} per file`}
          {accept && ` • ${accept}`}
        </p>
      )}

      {/* Status Announcements */}
      <div id={statusId} aria-live="polite" aria-atomic="true" className="sr-only">
        {hasErrors && 'Some files have errors. Check the list below.'}
        {files.length > 0 && `${files.length} file${files.length === 1 ? '' : 's'} selected`}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <ul className="mt-skeed-spacing-4 space-y-skeed-spacing-2" aria-label="Selected files">
          {files.map((file) => (
            <li
              key={file.id}
              className={cn(
                'flex items-center gap-skeed-spacing-3',
                'px-skeed-spacing-3 py-skeed-spacing-2',
                'rounded-skeed-radius-2',
                'border',
                file.status === 'error'
                  ? 'border-skeed-color-danger-200 bg-skeed-color-danger-50'
                  : file.status === 'complete'
                    ? 'border-skeed-color-success-200 bg-skeed-color-success-50'
                    : 'border-skeed-color-neutral-200 bg-white',
              )}
            >
              {/* Status Icon */}
              {file.status === 'error' ? (
                <AlertCircle size={16} className="text-skeed-color-danger-500 flex-shrink-0" />
              ) : file.status === 'complete' ? (
                <Check size={16} className="text-skeed-color-success-500 flex-shrink-0" />
              ) : (
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0',
                    file.status === 'uploading'
                      ? 'border-skeed-color-brand-500 border-t-transparent animate-spin'
                      : 'border-skeed-color-neutral-300',
                  )}
                  aria-hidden="true"
                />
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-skeed-color-neutral-900 truncate">{file.file.name}</p>
                <p className="text-xs text-skeed-color-neutral-500">
                  {formatFileSize(file.file.size)}
                  {file.status === 'uploading' && file.progress > 0 && ` • ${file.progress}%`}
                  {file.error && ` • ${file.error}`}
                </p>
                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-skeed-spacing-1 h-1 bg-skeed-color-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-skeed-color-brand-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                disabled={disabled}
                aria-label={`Remove ${file.file.name}`}
                className={cn(
                  'p-skeed-spacing-1 rounded-skeed-radius-1',
                  'text-skeed-color-neutral-500 hover:text-skeed-color-danger-500',
                  'hover:bg-skeed-color-danger-50',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skeed-color-brand-500',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
