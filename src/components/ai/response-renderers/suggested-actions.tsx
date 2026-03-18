'use client';

interface SuggestedAction {
  label: string;
  message: string;
  icon?: string;
}

interface SuggestedActionsProps {
  suggestions: SuggestedAction[];
  onAction?: (_action: any) => void;
  className?: string;
}

/**
 * Horizontal strip of pill chips that fire send_message actions.
 * Imported by all response renderers to provide follow-up interactivity.
 */
export function SuggestedActions({
  suggestions,
  onAction,
  className = '',
}: SuggestedActionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  const handleClick = (suggestion: SuggestedAction) => {
    if (onAction) {
      onAction({ type: 'send_message', data: { message: suggestion.message } });
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 pt-3 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type='button'
          onClick={() => handleClick(suggestion)}
          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium
            bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-500
            text-gray-700 dark:text-gray-200
            hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700
            dark:hover:bg-blue-900/40 dark:hover:border-blue-500 dark:hover:text-blue-300
            transition-colors cursor-pointer shadow-sm'
        >
          {suggestion.icon && <span aria-hidden='true'>{suggestion.icon}</span>}
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
