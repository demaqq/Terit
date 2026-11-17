import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  Clock,
  Receipt,
  Package,
  Truck,
  Sliders,
  PackageCheck,
  PackageMinus,
  AlertCircle,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { LedgerEntryType } from '../types/inventory';
import { escapeHtml, printHtmlDocument } from '../lib/posHardware';
import { useToast } from './Toast';

const LEDGER_TYPE_CONFIG: Record<LedgerEntryType, { labelKey: string; icon: React.FC<any>; color: string }> = {
  purchase: { labelKey: 'ledger_filter_purchase', icon: Receipt, color: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  sale: { labelKey: 'ledger_filter_sale', icon: PackageMinus, color: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  transfer: { labelKey: 'ledger_filter_transfer', icon: Truck, color: 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' },
  adjustment: { labelKey: 'ledger_filter_adjustment', icon: Sliders, color: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' },
  assembly: { labelKey: 'ledger_filter_assembly', icon: PackageCheck, color: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
  disassembly: { labelKey: 'ledger_filter_disassembly', icon: PackageMinus, color: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' },
  inbound: { labelKey: 'ledger_filter_purchase', icon: Package, color: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  outbound: { labelKey: 'ledger_filter_sale', icon: PackageMinus, color: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  initial: { labelKey: 'ledger_filter_purchase', icon: Clock, color: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800' },
};

export const LedgerView: React.FC = () => {
  const { transactions, t, isOnline } = useInventory();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const typeOptions: { key: LedgerEntryType | 'all'; labelKey: string }[] = [
    { key: 'all', labelKey: 'ledger_filter_all' },
    { key: 'purchase', labelKey: 'ledger_filter_purchase' },
    { key: 'sale', labelKey: 'ledger_filter_sale' },
    { key: 'transfer', labelKey: 'ledger_filter_transfer' },
    { key: 'adjustment', labelKey: 'ledger_filter_adjustment' },
    { key: 'assembly', labelKey: 'ledger_filter_assembly' },
    { key: 'disassembly', labelKey: 'ledger_filter_disassembly' },
    { key: 'inbound', labelKey: 'ledger_filter_purchase' },
    { key: 'outbound', labelKey: 'ledger_filter_sale' },
    { key: 'initial', labelKey: 'ledger_filter_purchase' },
  ];

  const filteredEntries = useMemo(() => {
    return transactions
      .filter((entry) => {
        const matchesSearch =
          entry.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = typeFilter === 'all' || entry.type === typeFilter;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      });
  }, [transactions, searchTerm, typeFilter, sortDirection]);

  const summary = useMemo(() => {
    const inboundQty = filteredEntries
      .filter((e) => e.quantity > 0 && (e.destinationLocationId || e.type === 'inbound' || e.type === 'purchase' || e.type === 'initial'))
      .reduce((sum, e) => sum + e.quantity, 0);
    const outboundQty = filteredEntries
      .filter((e) => e.quantity > 0 && (e.sourceLocationId || e.type === 'outbound' || e.type === 'sale' || e.type === 'transfer'))
      .reduce((sum, e) => sum + e.quantity, 0);
    const totalValue = filteredEntries.reduce((sum, e) => sum + (e.totalCost ?? 0), 0);
    return { inboundQty, outboundQty, totalValue };
  }, [filteredEntries]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Item / SKU', 'Type', 'Quantity', 'Source', 'Destination', 'Unit Cost', 'Total Cost', 'Reason', 'Sync Status'];
    const rows = filteredEntries.map((entry) =>
      [
        entry.createdAt,
        `${entry.itemName} (${entry.sku})`,
        entry.type,
        entry.quantity,
        entry.sourceLocationName || '-',
        entry.destinationLocationName || '-',
        entry.unitCost ?? 0,
        entry.totalCost ?? 0,
        entry.reason,
        entry.syncStatus ?? 'synced',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
    const objectUrl = URL.createObjectURL(new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', `terit-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const handleExportPDF = () => {
    const rows = filteredEntries
      .map(
        (e) => `
      <tr>
        <td>${escapeHtml(new Date(e.createdAt).toLocaleString())}</td>
        <td>${escapeHtml(e.itemName)} (${escapeHtml(e.sku)})</td>
        <td>${escapeHtml(e.type)}</td>
        <td style="text-align:right">${e.quantity}</td>
        <td>${escapeHtml(e.sourceLocationName || '-')}</td>
        <td>${escapeHtml(e.destinationLocationName || '-')}</td>
        <td style="text-align:right">${escapeHtml((e.totalCost ?? 0).toLocaleString())} ETB</td>
        <td>${escapeHtml(e.syncStatus ?? 'synced')}</td>
      </tr>`
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(t('ledger_view_title'))}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0 0 4px}p{color:#555;font-size:12px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f5f5f5}</style>
      </head><body><h1>${escapeHtml(t('ledger_view_title'))}</h1><p>${escapeHtml(new Date().toLocaleString())} · ${filteredEntries.length}</p>
      <table><thead><tr><th>${escapeHtml(t('ledger_date'))}</th><th>${escapeHtml(t('ledger_item'))}</th><th>${escapeHtml(t('ledger_entry_type'))}</th><th>${escapeHtml(t('ledger_quantity'))}</th><th>${escapeHtml(t('ledger_source'))}</th><th>${escapeHtml(t('ledger_destination'))}</th><th>${escapeHtml(t('ledger_total_cost'))}</th><th>${escapeHtml(t('ledger_status'))}</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    const ok = printHtmlDocument(html);
    if (!ok) {
      toast(t('print_unavailable_toast'), 'error');
    }
  };

  const typeConfig = (type: LedgerEntryType) => LEDGER_TYPE_CONFIG[type] ?? LEDGER_TYPE_CONFIG.initial;

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('ledger_view_title')}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
              {t('ledger_entries_count_label')
                .replace('{shown}', String(filteredEntries.length))
                .replace('{total}', String(transactions.length))}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('ledger_view_subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 terit-glass-sub text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('ledger_export')}</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 terit-glass-sub text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white/95 dark:hover:bg-slate-800/80 transition-colors text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('export_pdf')}</span>
          </button>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              sortDirection === 'desc'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'terit-glass-sub text-slate-700 dark:text-slate-300 hover:bg-white/95 dark:hover:bg-slate-800/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{sortDirection === 'desc' ? t('sort_newest') : t('sort_oldest')}</span>
          </button>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}
            title={isOnline ? t('status_online') : t('status_offline')}
          />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('ledger_kpi_inbound_qty')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{summary.inboundQty}</p>
        </div>
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('ledger_kpi_outbound_qty')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{summary.outboundQty}</p>
        </div>
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('ledger_kpi_total_value')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {summary.totalValue.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ETB</span>
          </p>
        </div>
        <div className="min-w-0 terit-glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">{t('ledger_kpi_entry_types')}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{new Set(filteredEntries.map((e) => e.type)).size}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="terit-glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative w-full sm:w-auto flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -mt-2 text-slate-400 w-4 h-4 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -mt-2 text-slate-400 w-4 h-4 pointer-events-none">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm cursor-pointer"
            >
              {typeOptions.map((opt) => (
                <option key={String(opt.key)} value={opt.key}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="terit-glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_date')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_item')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_entry_type')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_quantity')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_source')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_destination')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_total_cost')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">{t('ledger_status')}</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-500 dark:text-slate-400">{t('ledger_no_entries')}</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const cfg = typeConfig(entry.type);
                  const isInbound =
                    entry.quantity > 0 &&
                    (entry.destinationLocationId ||
                      entry.type === 'inbound' ||
                      entry.type === 'purchase' ||
                      entry.type === 'initial' ||
                      entry.type === 'assembly' ||
                      entry.type === 'disassembly');
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{entry.itemName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">{entry.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" />
                          {t(cfg.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {isInbound ? `+${entry.quantity}` : `-${entry.quantity}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                        {entry.sourceLocationName || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                        {entry.destinationLocationName || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {(entry.totalCost ?? 0).toLocaleString()} ETB
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            entry.syncStatus === 'synced'
                              ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                              : entry.syncStatus === 'pending'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                              : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {entry.syncStatus === 'synced'
                            ? t('ledger_sync_synced')
                            : entry.syncStatus === 'pending'
                            ? t('ledger_sync_pending')
                            : t('ledger_sync_conflict')}
                        </span>
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
