import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

export default function ModelSelector({
  models,
  selectedId,
  onSelect,
  isLoading,
  selectedMeta,
  isOpen,
  onToggle,
  variant = 'solid',
}) {
  const triggerBase =
    'flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm transition-colors';
  const triggerVariant =
    variant === 'glass'
      ? 'bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-border-token hover:border-border-strong text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
      : 'bg-surface border-border-token hover:border-gray-300 dark:hover:border-zinc-600 text-gray-600 dark:text-gray-300';

  const label = selectedMeta?.name || (isLoading ? 'Loading models...' : 'No model available');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={isLoading || models.length === 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          triggerBase,
          triggerVariant,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2',
        )}
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute top-full right-0 mt-2 bg-surface border border-border-token rounded-xl shadow-xl z-[60] min-w-[200px] overflow-hidden py-1"
        >
          {models.map((model) => {
            const isSelected = selectedId === model.id;
            return (
              <li key={model.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(model.id);
                    toast.success(`Switched to ${model.name}`);
                  }}
                  disabled={!model.available}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2 transition-colors flex flex-col gap-0.5',
                    isSelected
                      ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400'
                      : 'text-gray-700 dark:text-gray-200',
                    !model.available && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span className="font-medium flex items-center justify-between">
                    {model.name}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-500 line-clamp-1">
                    {model.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
