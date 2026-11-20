import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

const ADD_NEW = '__add_new__';

/**
 * A dropdown whose last option lets the user add their own value (e.g. a category or a
 * unit their business uses). The new value is saved through `onAdd` and selected.
 */
export const OptionSelect: React.FC<{
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAdd: (value: string) => string | null;
  addLabel: string;
  placeholder: string;
  className?: string;
}> = ({ id, value, options, onChange, onAdd, addLabel, placeholder, className }) => {
  const { t } = useInventory();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  // Keep the current value selectable even if it is no longer in the list.
  const list = value && !options.some((o) => o === value) ? [value, ...options] : options;

  const confirm = () => {
    const saved = onAdd(draft);
    if (saved) onChange(saved);
    setDraft('');
    setAdding(false);
  };

  if (adding) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              confirm();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setAdding(false);
            }
          }}
          placeholder={placeholder}
          className={className}
        />
        <button type="button" onClick={confirm} aria-label={t('option_add_confirm')} className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer">
          <Check className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => setAdding(false)} aria-label={t('cancel_btn')} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => (e.target.value === ADD_NEW ? setAdding(true) : onChange(e.target.value))}
      className={className}
    >
      {list.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value={ADD_NEW}>+ {addLabel}</option>
    </select>
  );
};

export const AddOptionIcon = Plus;
