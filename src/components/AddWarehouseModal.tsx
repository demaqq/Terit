import React, { useState } from 'react';
import { X, Warehouse as WarehouseIcon } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../components/Toast';
import { backdrop } from '../lib/dismiss';

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWarehouseModal: React.FC<AddWarehouseModalProps> = ({ isOpen, onClose }) => {
  const { addWarehouse, t } = useInventory();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState(15000);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast(t('add_warehouse_error'), 'error');
      return;
    }

    await addWarehouse({
      name,
      code: code.toUpperCase(),
      address,
      capacity: Number(capacity),
      isDefault: false,
    });

    onClose();
  };

  return (
    <div {...backdrop(onClose)} className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="terit-modal rounded-3xl max-w-md w-full p-5 sm:p-7 relative m-auto max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 flex items-center gap-2 pr-8">
          <WarehouseIcon className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t('add_warehouse_title')}</span>
        </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">
            {t('add_warehouse_subtitle')}
          </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('add_warehouse_name_label')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('add_warehouse_name_placeholder')}
              className="w-full bg-white/80 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('add_warehouse_code_label')}</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('add_warehouse_code_placeholder')}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('add_warehouse_capacity_label')}</label>
              <input
                type="number"
                min="100"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('add_warehouse_address_label')}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('add_warehouse_address_placeholder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
            >
              {t('cancel_btn')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10 transition-colors cursor-pointer"
            >
              {t('add_warehouse_add_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
