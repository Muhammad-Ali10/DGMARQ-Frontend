import { useRef, useState, useMemo, useEffect } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPT = 'image/png,image/jpeg,image/jpg,application/pdf';
const MAX_BYTES = 10 * 1024 * 1024;

const humanSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileDropzone = ({ file, previewUrl, onChange, label, note, error, compact = false, id }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');

  const controlled = previewUrl !== undefined;
  const internalPreview = useMemo(
    () => (!controlled && file && file.type?.startsWith('image/') ? URL.createObjectURL(file) : null),
    [controlled, file],
  );
  useEffect(() => () => { if (internalPreview) URL.revokeObjectURL(internalPreview); }, [internalPreview]);
  const preview = controlled ? previewUrl : internalPreview;

  const validateAndSet = (f) => {
    if (!f) return;
    const okType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(f.type);
    if (!okType) {
      setLocalError('Only PNG, JPG or PDF files are allowed');
      return;
    }
    if (f.size > MAX_BYTES) {
      setLocalError('File is larger than 10MB');
      return;
    }
    setLocalError('');
    onChange(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    validateAndSet(f);
  };

  const shownError = error || localError;
  const isPdf = file && file.type === 'application/pdf';

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-sm font-medium text-fg">{label}</span>
      )}

      {!file ? (
        <button
          type="button"
          id={id}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'group w-full rounded-xl border-2 border-dashed text-center transition-all duration-200 cursor-pointer',
            compact ? 'p-4' : 'p-6',
            dragOver
              ? 'border-accent bg-accent/10 scale-[1.01]'
              : 'border-border-interactive bg-white/[0.02] hover:border-accent/70 hover:bg-accent/[0.04]',
            shownError && 'border-destructive seller-shake',
          )}
        >
          <UploadCloud
            className={cn(
              'mx-auto mb-2 text-fg-muted transition-colors group-hover:text-accent-on-dark',
              compact ? 'h-7 w-7' : 'h-9 w-9',
              dragOver && 'text-accent-on-dark',
            )}
          />
          <p className="text-sm font-medium text-fg">
            {dragOver ? 'Drop here' : 'Click or drag files here to upload'}
          </p>
          <p className="text-xs text-fg-subtle mt-1">PNG, JPG, PDF up to 10MB</p>
        </button>
      ) : (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3 bg-white/[0.03]',
            shownError ? 'border-destructive' : 'border-border-interactive',
          )}
        >
          <div className="flex-shrink-0">
            {preview ? (
              <img
                src={preview}
                alt={file.name}
                className="h-14 w-14 rounded-lg object-cover border border-border-interactive"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border-interactive bg-accent/10">
                {isPdf ? (
                  <FileText className="h-7 w-7 text-accent-on-dark" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-accent-on-dark" />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{file.name}</p>
            <p className="text-xs text-fg-muted">{humanSize(file.size)}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 text-xs text-accent-on-dark hover:underline"
            >
              Replace
            </button>
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); setLocalError(''); }}
            aria-label="Remove file"
            className="flex-shrink-0 rounded-full p-1.5 text-fg-muted hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        aria-label={label || 'Choose a file'}
        className="hidden"
        onChange={(e) => {
          validateAndSet(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {note && !shownError && <p className="text-xs text-fg-subtle">{note}</p>}
      {shownError && <p className="text-xs text-destructive">{shownError}</p>}
    </div>
  );
};

export default FileDropzone;
