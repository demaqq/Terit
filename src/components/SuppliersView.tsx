import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  Clock,
  Star,
  MapPin,
  ShoppingCart,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Supplier } from '../types/inventory';
import { backdrop } from '../lib/dismiss';

interface SuppliersViewProps {
  onOpenAddSupplier: () => void;
  onOpenEditSupplier: (supplier: Supplier) => void;
  onOpenCreatePOForSupplier: (supplierId: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenAddSupplier,
  onOpenEditSupplier,
  onOpenCreatePOForSupplier,
}) => {
  const { suppliers, items, deleteSupplier, t } = useInventory();
  const [search, setSearch] = useState('');
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    await deleteSupplier(supplierToDelete.id);
    setSupplierToDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('supplier_directory')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('suppliers_subtitle')}
          </p>
        </div>

        <button
          onClick={onOpenAddSupplier}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add_supplier_btn')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="terit-glass rounded-2xl p-3 transition-colors">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('suppliers_search_placeholder')}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs terit-glass rounded-2xl">
            {t('suppliers_empty')}
          </div>
        ) : (
          filteredSuppliers.map((supplier) => {
            const suppliedItems = items.filter(
              (i) => i.supplierId === supplier.id || i.supplierName === supplier.name
            );

            return (
              <div
                key={supplier.id}
                className="min-w-0 terit-glass rounded-2xl p-5 flex flex-col justify-between transition-colors"
              >
                <div className="min-w-0">
                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{supplier.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{supplier.contactName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditSupplier(supplier)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={t('edit_supplier_title')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(supplier)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={t('delete_supplier_title')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rating & Lead Time */}
                  <div className="flex items-center gap-4 py-2 border-y border-slate-100 dark:border-slate-800 my-3 text-xs">
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-bold font-mono">{supplier.rating || 5}.0</span>
                      <span className="text-slate-400 text-[10px]">{t('supplier_rating')}</span>
                    </div>
                    <div className="text-slate-300 dark:text-slate-700">·</div>
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-semibold">{supplier.leadTimeDays}d</span>
                      <span className="text-slate-400 text-[10px]">{t('lead_time_days')}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${supplier.email}`} className="text-amber-600 dark:text-amber-400 hover:underline truncate">
                        {supplier.email}
                      </a>
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-600 dark:text-slate-400">{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500 truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {supplier.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                      &quot;{supplier.notes}&quot;
                    </div>
                  )}
                </div>

                {/* Bottom Footer with Active SKUs count & Create PO */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {suppliedItems.length} {t('active_skus')}
                  </span>
                  <button
                    onClick={() => onOpenCreatePOForSupplier(supplier.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>{t('reorder_create_po')}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Supplier Confirmation Modal */}
      {supplierToDelete && (
        <div {...backdrop(() => setSupplierToDelete(null))} className="fixed inset-0 z-50 flex p-4 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-sm w-full p-6 space-y-4 m-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setSupplierToDelete(null)}
                aria-label={t('close_btn')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-base">
                {t('delete_supplier_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('delete_supplier_confirm_desc').replace('{name}', supplierToDelete.name)}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                {t('confirm_delete_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
