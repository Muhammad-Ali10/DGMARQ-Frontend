import { useCallback, useMemo, useRef, useState } from 'react';
import { Send, ImagePlus, Lock, MessageSquare } from 'lucide-react';
import { Button } from '@components/ui/button';

const MAX_CHARS = 2000;
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

const ChatInput = ({
  onSendText,
  onSendImage,
  placeholder = 'Type your message…',
  cannedResponses = null,
  allowInternal = false,
  onType = null,
}) => {
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [internal, setInternal] = useState(false);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  const autosize = useCallback((el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  const suggestions = useMemo(() => {
    if (!cannedResponses?.length) return [];
    const t = text.trim().toLowerCase();
    if (!t.startsWith('/')) return [];
    const q = t.slice(1);
    return cannedResponses
      .filter((c) => {
        const sc = (c.shortcut || '').toLowerCase();
        return !q || sc.includes(q) || (c.title || '').toLowerCase().includes(q);
      })
      .slice(0, 6);
  }, [cannedResponses, text]);

  const insertCanned = useCallback((c) => {
    setText(c.message);
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (el) {
        el.focus();
        autosize(el);
      }
    });
  }, [autosize]);

  const submitText = useCallback(() => {
    const value = text.trim();
    if (!value) return;
    onSendText?.(value, { internal });
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  }, [text, onSendText, internal]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (suggestions.length > 0) {
          e.preventDefault();
          insertCanned(suggestions[0]);
          return;
        }
        e.preventDefault();
        submitText();
      }
    },
    [submitText, suggestions, insertCanned]
  );

  const handleFiles = useCallback(
    (files) => {
      const file = Array.from(files || []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      onSendImage?.(file, text.trim(), { internal });
      setText('');
    },
    [onSendImage, text, internal]
  );

  const handlePaste = useCallback(
    (e) => {
      const item = Array.from(e.clipboardData?.items || []).find((it) => it.type.startsWith('image/'));
      if (item) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFiles([file]);
        }
      }
    },
    [handleFiles]
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitText();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer?.files);
      }}
      className={`relative border-t border-brand-cyan/10 p-3 ${internal ? 'bg-yellow-900/20' : 'bg-surface-2'} ${
        dragOver ? 'ring-2 ring-accent ring-inset' : ''
      }`}
    >
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-surface-sunken border border-border rounded-lg shadow-xl overflow-hidden z-10">
          {suggestions.map((c) => (
            <button
              key={c._id || c.shortcut}
              type="button"
              onClick={() => insertCanned(c)}
              className="w-full text-left px-3 py-2 hover:bg-gray-800 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-accent-on-dark text-xs font-mono">{c.shortcut}</span>
                <span className="text-fg text-sm font-medium">{c.title}</span>
              </div>
              <p className="text-fg-muted text-xs truncate">{c.message}</p>
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        aria-label="Attach a file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {allowInternal && (
        <button
          type="button"
          onClick={() => setInternal((v) => !v)}
          className={`mb-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
            internal ? 'bg-yellow-700/60 text-yellow-100' : 'bg-surface-2 text-fg-muted hover:bg-gray-600'
          }`}
        >
          {internal ? <Lock className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          {internal ? 'Internal note (not visible to customer)' : 'Reply to customer'}
        </button>
      )}

      <div className="flex items-end gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} title="Attach image">
          <ImagePlus className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <textarea
            ref={taRef}
            aria-label="Message"
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_CHARS));
              autosize(e.target);
              if (e.target.value.trim()) onType?.();
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={dragOver ? 'Drop image to send…' : internal ? 'Write an internal note…' : placeholder}
            className="w-full resize-none rounded-md bg-surface-sunken border border-border text-fg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          {text.length > MAX_CHARS * 0.75 && (
            <div className="text-right text-[10px] text-fg-muted mt-0.5">
              {text.length}/{MAX_CHARS}
            </div>
          )}
        </div>
        <Button type="submit" size="icon" disabled={!text.trim()} title="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
