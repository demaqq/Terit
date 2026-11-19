import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Printer,
  Smartphone,
  Building,
  UserCheck,
  X,
  Receipt,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { CreditRecord, DebtStatus, PaymentMethod } from '../types/inventory';
import { loadCreditRecords, saveCreditRecords, outstandingForCustomer, isOverdue } from '../lib/creditRecords';
import { allowsFraction, defaultDueDate, expiryState } from '../data/businessProfiles';
import { useToast } from '../components/Toast';
import { ETRReceiptModal } from './ETRReceiptModal';

export const CreditLedgerView: React.FC = () => {
  const { items, companyProfile, businessType, profile, quickAdjustStock, t } = useInventory();
  const { toast } = useToast();
  const customerNoun = t(profile.customerNounKey);

  const [records, setRecords] = useState<CreditRecord[]>(() => loadCreditRecords(businessType));

  useEffect(() => {
    setRecords(loadCreditRecords(businessType));
  }, [businessType]);

  useEffect(() => {
    saveCreditRecords(businessType, records);
  }, [records, businessType]);

  // Status follows the due date: an unpaid balance past its due date is overdue.
  const effectiveStatus = (r: CreditRecord): DebtStatus =>
    r.remainingAmount <= 0 ? 'paid' : isOverdue(r) ? 'overdue' : r.paidAmount > 0 ? 'partial' : 'unpaid';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<CreditRecord | null>(null);
  const [isNewCreditOpen, setIsNewCreditOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [etrTargetRecord, setEtrTargetRecord] = useState<CreditRecord | null>(null);

  const getDefaultDueDate = () => defaultDueDate(profile);

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('telebirr');
  const [settleNote, setSettleNote] = useState('');

  // New Credit Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+251 9');
  const [newItemId, setNewItemId] = useState<string>('');
  const [newQty, setNewQty] = useState<number>(1);
  const [newPaidDown, setNewPaidDown] = useState<number>(0);
  const newItem = items.find((i) => i.id === newItemId);
  const newTotalAmount = newItem ? Math.round(newItem.unitPrice * (Number(newQty) || 0) * 100) / 100 : 0;
  const newCustomerOwes = outstandingForCustomer(records, newCustName, newCustPhone);
  const [newDueDate, setNewDueDate] = useState<string>(getDefaultDueDate);
  const [newNotes, setNewNotes] = useState('');

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.customerPhone.includes(search) ||
        r.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || effectiveStatus(r) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  // Aggregate Metrics
  const totalDebtOutstanding = records.reduce((sum, r) => sum + r.remainingAmount, 0);
  const totalOverdue = records.filter((r) => isOverdue(r)).reduce((sum, r) => sum + r.remainingAmount, 0);
  const activeDebtorsCount = records.filter((r) => r.remainingAmount > 0).length;
  const totalCollected = records.reduce((sum, r) => sum + r.paidAmount, 0);

  const handleOpenSettle = (record: CreditRecord) => {
    setSelectedRecord(record);
    setSettleAmount(record.remainingAmount);
    setSettleMethod('telebirr');
    setIsSettleOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    if (!Number.isFinite(settleAmount) || settleAmount <= 0 || settleAmount > selectedRecord.remainingAmount) {
      toast(
        t('credit_amount_range_error').replace('{max}', selectedRecord.remainingAmount.toLocaleString()),
        'error'
      );
      return;
    }

    const newPaid = selectedRecord.paidAmount + settleAmount;
    const newRemaining = selectedRecord.totalAmount - newPaid;
    const newStatus: DebtStatus = newRemaining === 0 ? 'paid' : 'partial';

    setRecords((prev) =>
      prev.map((r) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
              paymentMethod: settleMethod,
              settledAt: newRemaining === 0 ? new Date().toISOString().split('T')[0] : r.settledAt,
              notes: settleNote ? `${r.notes || ''} | Settled: ${settleNote}` : r.notes,
            }
          : r
      )
    );

    setIsSettleOpen(false);
      toast(t('payment_record_updated_toast') || 'Payment record updated. Terit does not process or verify the payment.', 'success');
  };

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      toast(t('credit_customer_required') || 'Please enter customer name.', 'error');
      return;
    }
    if (!newItem) {
      toast(t('credit_item_required'), 'error');
      return;
    }
    const qty = Number(newQty);
    const fractional = allowsFraction(newItem.unitOfMeasure, profile);
    if (!Number.isFinite(qty) || qty <= 0 || (!fractional && !Number.isInteger(qty))) {
      toast(t(fractional ? 'credit_qty_invalid' : 'add_item_error_whole_units'), 'error');
      return;
    }
    if (qty > newItem.quantity) {
      toast(t('credit_qty_exceeds_stock').replace('{qty}', String(newItem.quantity)), 'error');
      return;
    }
    if (profile.expiry.blockExpiredIssue && expiryState(newItem, profile) === 'expired') {
      toast(t('expired_issue_blocked'), 'error');
      return;
    }
    const paid = Math.min(Math.max(0, Number(newPaidDown) || 0), newTotalAmount);
    const remaining = Math.round((newTotalAmount - paid) * 100) / 100;
    const limit = profile.credit.limitPerCustomer;
    if (limit !== null && newCustomerOwes + remaining > limit) {
      toast(
        t('credit_limit_exceeded')
          .replace('{limit}', limit.toLocaleString())
          .replace('{owes}', newCustomerOwes.toLocaleString()),
        'error'
      );
      return;
    }

    const status: DebtStatus = remaining === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // The goods leave the shelf now, even though payment comes later.
    await quickAdjustStock(newItem.id, -qty, `${t('credit_sale_reason')} ${invoiceNumber} · ${newCustName.trim()}`, invoiceNumber);

    const newRec: CreditRecord = {
      id: `cr-${Date.now()}`,
      customerName: newCustName.trim(),
      customerPhone: newCustPhone,
      invoiceNumber,
      totalAmount: newTotalAmount,
      paidAmount: paid,
      remainingAmount: remaining,
      dueDate: newDueDate,
      status,
      itemsPurchased: [
        {
          itemId: newItem.id,
          itemName: newItem.name,
          sku: newItem.sku,
          quantity: qty,
          unitPrice: newItem.unitPrice,
        },
      ],
      paymentMethod: 'telebirr',
      notes: newNotes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setRecords((prev) => [newRec, ...prev]);
    setIsNewCreditOpen(false);
    setNewCustName('');
    setNewCustPhone('+251 9');
    setNewItemId('');
    setNewQty(1);
    setNewPaidDown(0);
    setNewDueDate(getDefaultDueDate());
    setNewNotes('');
    toast(t('credit_sale_recorded_toast').replace('{invoice}', invoiceNumber), 'success');
  };

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Top Banner & Header */}
      <div className="terit-glass rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('nav_credit')}
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
              {t('credit_ready_badge')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('credit_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsNewCreditOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('new_credit_btn')}</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('outstanding_debts')}</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900 dark:text-white">
            {totalDebtOutstanding.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            {activeDebtorsCount} {t('active_accounts_label')}
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{t('overdue_balance')}</span>
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums truncate">
            {totalOverdue.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-500 truncate">
            {t('telebirr_sms_needed')}
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{t('total_collected')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {t('settled_mobile_money')}
          </div>
        </div>

        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{t('collection_rate')}</span>
            <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
            {totalCollected + totalDebtOutstanding > 0
              ? Math.round((totalCollected / (totalCollected + totalDebtOutstanding)) * 100)
              : 100}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {t('healthy_recovery_ratio')}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="terit-glass rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_debt_placeholder')}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto text-xs">
          {(['all', 'unpaid', 'partial', 'overdue', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'all' ? (t('ledger_filter_all') || 'ALL').toUpperCase() : (t(`credit_status_${st}`) || st).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Debt Ledger Table & Cards */}
      <div className="terit-glass rounded-3xl overflow-hidden">
        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredRecords.map((r) => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{r.customerName}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{r.customerPhone}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                    effectiveStatus(r) === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : effectiveStatus(r) === 'overdue'
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {t(`credit_status_${effectiveStatus(r)}`) || effectiveStatus(r)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">{t('outstanding_due_label')}</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {r.remainingAmount.toLocaleString()} ETB
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">{t('due_date_label')}</div>
                  <div className={`font-bold ${effectiveStatus(r) === 'overdue' ? 'text-rose-500' : 'text-slate-600'}`}>
                    {r.dueDate}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setEtrTargetRecord(r)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title={t('etr_issue_btn')}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{t('etr_issue_short')}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedRecord(r);
                    setIsReceiptOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('proforma_btn') || 'Proforma'}</span>
                </button>
                {r.remainingAmount > 0 && (
                  <button
                    onClick={() => handleOpenSettle(r)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('record_payment_btn') || 'Record payment'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">{t('customer_debtor') || 'Customer / Debtor'}</th>
                <th className="py-3 px-3 font-bold">{t('invoice_ref_label')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('total_revenue') || 'Total Amount'}</th>
                <th className="py-3 px-3 font-bold text-right">{t('paid_amount')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('outstanding_due_label')}</th>
                <th className="py-3 px-3 font-bold text-center">{t('due_date_label')}</th>
                <th className="py-3 px-3 font-bold text-center">{t('status')}</th>
                <th className="py-3 px-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{r.customerName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{r.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{r.invoiceNumber}</td>
                  <td className="py-3 px-3 font-mono text-right font-semibold">{r.totalAmount.toLocaleString()} ETB</td>
                  <td className="py-3 px-3 font-mono text-right text-emerald-600">{r.paidAmount.toLocaleString()} ETB</td>
                  <td className="py-3 px-3 font-mono text-right font-black text-amber-600 dark:text-amber-400">
                    {r.remainingAmount.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className={effectiveStatus(r) === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                      {r.dueDate}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                        effectiveStatus(r) === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : effectiveStatus(r) === 'overdue'
                          ? 'bg-rose-500/10 text-rose-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {t(`credit_status_${effectiveStatus(r)}`) || effectiveStatus(r)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEtrTargetRecord(r)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title={t('etr_issue_btn')}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{t('etr_issue_short')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setIsReceiptOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title={t('view_proforma_title') || 'View Proforma'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t('proforma_btn') || 'Proforma'}</span>
                      </button>
                      {r.remainingAmount > 0 && (
                        <button
                          onClick={() => handleOpenSettle(r)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{t('record_payment_btn') || 'Record payment'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record a manually verified payment */}
      {isSettleOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-md w-full p-5 sm:p-6 m-auto max-h-[92dvh] overflow-y-auto relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setIsSettleOpen(false)}
              aria-label={t('close_btn') || 'Close'}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold mb-1 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span>{t('record_payment_title') || 'Record Payment Received'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {(t('record_payment_desc') || 'Record a payment you have already verified outside Terit for {name} ({invoice}).')
                .replace('{name}', selectedRecord.customerName)
                .replace('{invoice}', selectedRecord.invoiceNumber)}
            </p>

            <form onSubmit={handleConfirmSettle} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-200">
                {t('record_payment_notice') || 'Terit does not initiate, send, or verify payments. Confirm receipt with your payment provider before recording it here.'}
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('payment_method_received') || 'Payment method received'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMethod('telebirr')}
                    className={`p-2.5 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all ${
                      settleMethod === 'telebirr'
                        ? 'bg-amber-500 border-amber-500 text-slate-950'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{t('telebirr_gateway') || 'Telebirr'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleMethod('cbe_birr')}
                    className={`p-2.5 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all ${
                      settleMethod === 'cbe_birr'
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>{t('cbe_birr_gateway') || 'CBE Birr'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t('amount_received_label') || 'Amount Received (ETB)'}
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={selectedRecord.remainingAmount}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm font-bold"
                />
              </div>

              {settleMethod === 'telebirr' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  {t('telebirr_confirm_note') || 'Select Telebirr only if you have independently confirmed receipt in your verified merchant account.'}
                </div>
              )}

              {settleMethod === 'cbe_birr' && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-500/30 text-[11px] text-purple-900 dark:text-purple-200 space-y-1">
                  {t('cbe_birr_confirm_note') || 'Select CBE Birr only if you have independently confirmed receipt in your verified merchant account.'}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettleOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-semibold"
                >
                  {t('cancel_btn') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                >
                  {t('record_verified_payment_btn') || 'Record verified payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Digital Proforma / Receipt */}
      {isReceiptOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-md w-full p-5 sm:p-6 m-auto max-h-[92dvh] overflow-y-auto relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setIsReceiptOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Proforma Card */}
            <div id="printable-proforma" className="bg-slate-50 text-slate-950 p-5 rounded-2xl border border-slate-300 space-y-3 font-mono text-xs">
              <div className="text-center border-b border-slate-300 pb-2">
                <div className="font-extrabold text-sm text-amber-600">
                  {(companyProfile?.companyName || t('app_name')).toUpperCase()} · {t('credit_proforma_header')}
                </div>
                <div className="text-[10px] text-slate-500">
                  {[companyProfile?.city, companyProfile?.tin && `TIN: ${companyProfile.tin}`, companyProfile?.phone && `Tel: ${companyProfile.phone}`]
                    .filter((detail): detail is string => Boolean(detail))
                    .join(' · ')}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div><strong>{t('invoice_ref_label') || 'Invoice Ref:'}</strong> {selectedRecord.invoiceNumber}</div>
                <div><strong>{t('customer_label') || 'Customer:'}</strong> {selectedRecord.customerName}</div>
                <div><strong>{t('phone_label_short') || 'Phone:'}</strong> {selectedRecord.customerPhone}</div>
                <div><strong>{t('issued_date_label') || 'Issued Date:'}</strong> {selectedRecord.createdAt}</div>
                <div><strong>{t('due_date_label') || 'Due Date:'}</strong> {selectedRecord.dueDate}</div>
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1">
                {selectedRecord.itemsPurchased.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span>{item.itemName} x{item.quantity}</span>
                    <span>{(item.quantity * item.unitPrice).toLocaleString()} ETB</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-xs">
                <div>{t('total_bill_label') || 'Total Bill:'} <strong>{selectedRecord.totalAmount.toLocaleString()} ETB</strong></div>
                <div className="text-emerald-600">{t('paid_down_label') || 'Paid Down:'} -{selectedRecord.paidAmount.toLocaleString()} ETB</div>
                <div className="text-amber-600 font-bold">{t('remaining_due_label') || 'Remaining Due:'} {selectedRecord.remainingAmount.toLocaleString()} ETB</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('print_proforma') || 'Print Proforma Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Credit Sale */}
      {isNewCreditOpen && (
        <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-lg w-full p-5 sm:p-8 m-auto max-h-[92dvh] overflow-y-auto relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setIsNewCreditOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">{t('new_credit_sale_title')}</h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('new_credit_sale_desc')}
            </p>

            <form onSubmit={handleCreateCredit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">{customerNoun} *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={
                    businessType === 'pharmacy'
                      ? t('credit_placeholder_pharmacy')
                      : businessType === 'building'
                      ? t('credit_placeholder_building')
                      : businessType === 'supermarket' || businessType === 'minimarket'
                      ? t('credit_placeholder_food')
                      : businessType === 'store'
                      ? t('credit_placeholder_store')
                      : t('credit_placeholder_default')
                  }
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t('credit_phone_label') || 'Phone Number *'}</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('credit_due_date_label') || 'Payment Due Date *'}</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="credit-item" className="block font-semibold mb-1">{t('credit_item_label')}</label>
                  <select
                    id="credit-item"
                    required
                    value={newItemId}
                    onChange={(e) => setNewItemId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">{t('bundle_pick_item')}</option>
                    {items
                      .filter((i) => !i.isQuarantined)
                      .map((i) => {
                        const expired = profile.expiry.blockExpiredIssue && expiryState(i, profile) === 'expired';
                        return (
                          <option key={i.id} value={i.id} disabled={i.quantity <= 0 || expired}>
                            {i.name} · {i.unitPrice.toLocaleString()} ETB · {i.quantity} {i.unitOfMeasure}
                            {expired ? ` (${t('expired_label')})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label htmlFor="credit-qty" className="block font-semibold mb-1">{t('credit_qty_label')}</label>
                  <input
                    id="credit-qty"
                    type="number"
                    min={allowsFraction(newItem?.unitOfMeasure, profile) ? '0.01' : '1'}
                    step={allowsFraction(newItem?.unitOfMeasure, profile) ? 'any' : '1'}
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block font-semibold mb-1">{t('credit_total_label') || 'Total Amount (ETB) *'}</span>
                  <div className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {newTotalAmount.toLocaleString()} ETB
                  </div>
                </div>
                <div>
                  <label htmlFor="credit-paid" className="block font-semibold mb-1">{t('credit_advance_label') || 'Advance Down Payment (ETB)'}</label>
                  <input
                    id="credit-paid"
                    type="number"
                    min="0"
                    max={newTotalAmount || undefined}
                    value={newPaidDown}
                    onChange={(e) => setNewPaidDown(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {t('credit_terms_hint')
                  .replace('{days}', String(profile.credit.termDays))
                  .replace(
                    '{limit}',
                    profile.credit.limitPerCustomer === null ? t('credit_no_limit') : `${profile.credit.limitPerCustomer.toLocaleString()} ETB`
                  )}
                {newCustomerOwes > 0 && (
                  <span className="block mt-0.5 font-semibold text-amber-700 dark:text-amber-400">
                    {t('credit_customer_owes').replace('{owes}', newCustomerOwes.toLocaleString())}
                  </span>
                )}
              </p>

              <div>
                <label className="block font-semibold mb-1">{t('credit_notes_label') || 'Credit Terms / Notes'}</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={t('credit_notes_placeholder') || 'Guarantor, repayment schedule, or branch notes...'}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCreditOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-semibold"
                >
                  {t('cancel_btn') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  {t('record_credit_sale_btn') || 'Record Credit Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ETR Fiscal Tax Receipt */}
      <ETRReceiptModal
        isOpen={!!etrTargetRecord}
        onClose={() => setEtrTargetRecord(null)}
        customerName={etrTargetRecord?.customerName}
        items={
          etrTargetRecord
            ? etrTargetRecord.itemsPurchased.map((p) => ({
                name: p.itemName,
                qty: p.quantity,
                price: p.unitPrice,
              }))
            : []
        }
      />
    </div>
  );
};
