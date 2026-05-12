import { forwardRef } from 'react';
import { Mic, MicOff, MoveUp, Paperclip } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANT = {
  initial: {
    wrapper:
      'rounded-[2rem] shadow-xl dark:shadow-zinc-900/50 p-3 md:p-4 focus-within:ring-4',
    textarea: 'text-base md:text-lg max-h-32 min-h-[48px]',
    attachLabel: true,
  },
  inline: {
    wrapper: 'rounded-[1.5rem] shadow-lg dark:shadow-zinc-900/50 p-3 focus-within:ring-2',
    textarea: 'text-base max-h-48 min-h-[44px]',
    attachLabel: false,
  },
};

const ChatComposer = forwardRef(function ChatComposer(
  {
    value,
    onChange,
    onKeyDown,
    onSend,
    onToggleRecording,
    isRecording,
    isTranscribing,
    isLoading,
    canSend,
    placeholder,
    attachLabel,
    variant = 'initial',
  },
  ref,
) {
  const styles = VARIANT[variant];

  return (
    <div
      className={cn(
        'w-full bg-surface border border-border-token relative group',
        'focus-within:border-violet-500/30 focus-within:ring-violet-500/10 transition-all duration-300',
        styles.wrapper,
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={isRecording || isTranscribing}
        aria-label="Message"
        className={cn(
          'w-full bg-transparent border-none outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 dark:text-zinc-100 resize-none py-2 px-2 custom-scrollbar',
          styles.textarea,
        )}
        rows={1}
      />

      <div className="flex justify-between items-center mt-1 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-2 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
            aria-label={attachLabel || 'Attach'}
          >
            <Paperclip size={18} />
            {styles.attachLabel && attachLabel && (
              <span className="text-xs font-medium">{attachLabel}</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleRecording}
            disabled={isLoading || isTranscribing}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            className={cn(
              'p-2 rounded-full transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30',
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                : 'bg-surface-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
            )}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2',
              value?.trim()
                ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 scale-100'
                : 'bg-surface-2 text-fg-faint cursor-not-allowed scale-90',
            )}
          >
            <MoveUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatComposer;
