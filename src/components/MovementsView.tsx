import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Download,
  Printer,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../components/Toast';
import { escapeHtml, printHtmlDocument } from '../lib/posHardware';

export const MovementsView: React.FC = () => {
  const { transactions, t } = useInventory();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || tx.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, selectedType]);

  // Aggregate stats
  const totalInbound = transactions
    .filter((t) => t.quantity > 0)
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalOutbound = Math.abs(
    transactions.filter((t) => t.quantity < 0).reduce((sum, t) => sum + t.quantity, 0)
  );

  const handleExportCSV = () => {
    const headers = ['Date', 'Item Name', 'SKU', 'Type', 'Delta Quantity', 'Previous Qty', 'New Qty', 'Reason', 'Ref Number', 'Location'];
    const rows = filtered.map((t) => [
      `"${new Date(t.createdAt).toLocaleString()}"`,
      `"${t.itemName.replace(/"/g, '""')}"`,
      t.sku,
      t.type,
      t.quantity,
      t.previousQuantity,
      t.newQuantity,
      `"${t.reason.replace(/"/g, '""')}"`,
      t.referenceNumber || '',
      `"${t.location}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const objectUrl = URL.createObjectURL(new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', `terit-stock-movements-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((tx) => `
      <tr>
        <td>${escapeHtml(new Date(tx.createdAt).toLocaleString())}</td>
        <td>${escapeHtml(tx.itemName)} (${escapeHtml(tx.sku)})</td>
        <td>${escapeHtml(tx.type)}</td>
        <td style="text-align:right">${tx.quantity}</td>
        <td style="text-align:right">${tx.previousQuantity} &rarr; ${tx.newQuantity}</td>
        <td>${escapeHtml(tx.reason)}</td>
        <td>${escapeHtml(tx.location || '')}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(t('audit_trail_title'))}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0 0 4px}p{color:#555;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f5f5f5}</style>
      </head><body><h1>${escapeHtml(t('audit_trail_title'))}</h1><p>${escapeHtml(new Date().toLocaleString())} · ${filtered.length}</p>
      <table><thead><tr><th>${escapeHtml(t('ledger_date'))}</th><th>${escapeHtml(t('product_sku'))}</th><th>${escapeHtml(t('ledger_entry_type'))}</th><th>${escapeHtml(t('movements_qty_change'))}</th><th>${escapeHtml(t('movements_balance'))}</th><th>${escapeHtml(t('ledger_reason'))}</th><th>${escapeHtml(t('location'))}</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    if (!printHtmlDocument(html)) {
      toast(t('print_unavailable_toast'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('audit_trail_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('audit_trail_desc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('export_csv')}</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl terit-glass-sub hover:bg-white/95 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('export_pdf')}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="min-w-0 terit-glass rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('movements_total_inbound')}</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
              +{totalInbound.toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('movements_total_outbound')}</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
              -{totalOutbound.toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('movements_total_entries')}</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {transactions.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="terit-glass rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-colors">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">{t('ledger_filter_all')}</option>
          <option value="inbound">{t('movement_inbound')}</option>
          <option value="outbound">{t('movement_outbound')}</option>
          <option value="adjustment">{t('movement_adjustment')}</option>
          <option value="transfer">{t('movement_transfer')}</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="terit-glass rounded-2xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">{t('ledger_date')}</th>
                <th className="py-3 px-3 font-bold">{t('product_sku')}</th>
                <th className="py-3 px-3 font-bold text-center">{t('ledger_entry_type')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('movements_qty_change')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('movements_balance')}</th>
                <th className="py-3 px-3 font-bold">{t('ledger_reason')}</th>
                <th className="py-3 px-4 font-bold">{t('location')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {t('ledger_no_entries')}
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isInbound = tx.quantity > 0;
                  const isTransfer = tx.type === 'transfer';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Product */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-200">{tx.itemName}</div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{tx.sku}</div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 text-center">
                        {tx.type === 'inbound' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                            <ArrowDownLeft className="w-3 h-3" /> {t('movement_inbound')}
                          </span>
                        )}
                        {tx.type === 'outbound' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                            <ArrowUpRight className="w-3 h-3" /> {t('movement_outbound')}
                          </span>
                        )}
                        {tx.type === 'adjustment' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                            <RefreshCw className="w-3 h-3" /> {t('movement_adjustment')}
                          </span>
                        )}
                        {tx.type === 'transfer' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20">
                            <ArrowRightLeft className="w-3 h-3" /> {t('movement_transfer')}
                          </span>
                        )}
                      </td>

                      {/* Quantity Change */}
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        <span className={isInbound ? 'text-emerald-600 dark:text-emerald-400' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isInbound ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        <span className="text-slate-400">{tx.previousQuantity}</span> &rarr;{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{tx.newQuantity}</span>
                      </td>

                      {/* Reason & Ref */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <div>{tx.reason}</div>
                        {tx.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400">{t('ref_short')}: {tx.referenceNumber}</div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {tx.location}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
