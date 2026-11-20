import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Clock,
  Coins,
  Shield,
  Search,
  X,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StaffMember, StaffRole, AttendanceLog } from '../types/inventory';
import { BUSINESS_PRESET_ATTENDANCE, BUSINESS_PRESET_STAFF } from '../data/businessPresets';
import { fmt } from '../i18n/fmt';

export const StaffRosterView: React.FC = () => {
  const { warehouses, businessType, t } = useInventory();

  const loadStaffForBiz = (biz: typeof businessType): StaffMember[] => {
    try {
      const saved = localStorage.getItem(`terit_staff_${biz}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return BUSINESS_PRESET_STAFF[biz] || BUSINESS_PRESET_STAFF.shop;
  };

  const loadAttForBiz = (biz: typeof businessType): AttendanceLog[] => {
    try {
      const saved = localStorage.getItem(`terit_attendance_${biz}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return BUSINESS_PRESET_ATTENDANCE[biz] || BUSINESS_PRESET_ATTENDANCE.shop;
  };

  const [staffList, setStaffList] = useState<StaffMember[]>(() => loadStaffForBiz(businessType));
  const [attendance, setAttendance] = useState<AttendanceLog[]>(() => loadAttForBiz(businessType));

  const defaultRoleForBiz: StaffRole =
    businessType === 'pharmacy'
      ? 'pharmacist'
      : businessType === 'building' || businessType === 'store'
      ? 'storekeeper'
      : 'cashier';

  const [search, setSearch] = useState('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>(defaultRoleForBiz);
  const [newPhone, setNewPhone] = useState('+251 9');
  const [newBranch, setNewBranch] = useState(warehouses[0]?.name || t('main_branch_default'));
  const [newSalary, setNewSalary] = useState<number>(10000);

  useEffect(() => {
    setStaffList(loadStaffForBiz(businessType));
    setAttendance(loadAttForBiz(businessType));
    setNewRole(
      businessType === 'pharmacy'
        ? 'pharmacist'
        : businessType === 'building' || businessType === 'store'
        ? 'storekeeper'
        : 'cashier'
    );
    setNewBranch(warehouses[0]?.name || t('main_branch_default'));
  }, [businessType]);

  useEffect(() => {
    try {
      localStorage.setItem(`terit_staff_${businessType}`, JSON.stringify(staffList));
      localStorage.setItem(`terit_attendance_${businessType}`, JSON.stringify(attendance));
    } catch {}
  }, [staffList, attendance, businessType]);

  const totalMonthlyPayroll = staffList.reduce((sum, s) => sum + (s.monthlySalary || 0), 0);
  const onShiftCount = staffList.filter((s) => s.status === 'on_shift').length;
  const pendingPayrollCount = staffList.filter((s) => s.paymentStatus === 'pending').length;

  // Format large currency numbers so they never overflow cards on mobile
  const formatPayrollDisplay = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 10_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(2)}M`;
    }
    return amount.toLocaleString();
  };

  const handleToggleShift = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const nextStatus = s.status === 'on_shift' ? 'active' : 'on_shift';
          if (nextStatus === 'on_shift') {
            setAttendance([
              {
                id: `att-${Date.now()}`,
                staffId: s.id,
                staffName: s.name,
                date: new Date().toISOString().split('T')[0],
                checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'present',
              },
              ...attendance,
            ]);
          }
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleTogglePayment = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, paymentStatus: s.paymentStatus === 'paid' ? 'pending' : 'paid' }
          : s
      )
    );
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Sanitize salary input to maximum 10 million ETB
    const safeSalary = Math.min(10_000_000, Math.max(1_000, Number(newSalary) || 10_000));

    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      phone: newPhone.trim(),
      branch: newBranch.trim() || t('main_branch_default'),
      monthlySalary: safeSalary,
      hourlyWage: Math.round(safeSalary / 160),
      status: 'active',
      hiredDate: new Date().toISOString().split('T')[0],
      paymentStatus: 'pending',
    };

    setStaffList([...staffList, newStaff]);
    setIsAddStaffOpen(false);
    setNewName('');
    setNewPhone('+251 9');
    setNewSalary(10000);
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.branch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Top Banner */}
      <div className="terit-glass rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('nav_staff')}
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 whitespace-nowrap">
              {t('staff_roster_badge')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {t('staff_roster_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsAddStaffOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('new_staff_btn')}</span>
        </button>
      </div>

      {/* KPI Cards: Responsive grid with zero overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Staff */}
        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">{t('nav_staff')}</span>
            <Users className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white truncate">
            {staffList.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              {t('members_count')}
            </span>
          </div>
          <div className="mt-1 text-[10.5px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
            {t('across_all_branches')}
          </div>
        </div>

        {/* Card 2: On Shift */}
        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">{t('staff_on_shift')}</span>
            <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-emerald-600 truncate">
            {onShiftCount}{' '}
            <span className="text-xs font-normal text-slate-500">
              {t('on_shift_badge')}
            </span>
          </div>
          <div className="mt-1 text-[10.5px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
            {t('clocked_in_counters')}
          </div>
        </div>

        {/* Card 3: Monthly Payroll (with overflow protection) */}
        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">{t('total_monthly_payroll')}</span>
            <Coins className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div
            className="mt-2 text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white truncate"
            title={`${totalMonthlyPayroll.toLocaleString()} ETB`}
          >
            {formatPayrollDisplay(totalMonthlyPayroll)}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">{t('currency_etb')}</span>
          </div>
          <div className="mt-1 text-[10.5px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate">
            {pendingPayrollCount} {t('pending_payroll')}
          </div>
        </div>

        {/* Card 4: Security & Roles */}
        <div className="min-w-0 terit-glass rounded-2xl p-4 sm:p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">{t('security_and_roles')}</span>
            <Shield className="w-4 h-4 text-purple-500 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 truncate">
            5 <span className="text-xs font-normal text-slate-500">{t('roles_active_label')}</span>
          </div>
          <div className="mt-1 text-[10.5px] sm:text-[11px] text-slate-500 truncate">
            {t('rbac_access_control')}
          </div>
        </div>
      </div>

      {/* Staff List & Shift Roster Table */}
      <div className="terit-glass rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('staff_search_placeholder')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[620px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">{t('emp_name')}</th>
                <th className="py-3 px-3 font-bold">{t('emp_role')}</th>
                <th className="py-3 px-3 font-bold">{t('emp_branch')}</th>
                <th className="py-3 px-3 font-bold text-right">{t('monthly_salary_col')}</th>
                <th className="py-3 px-3 font-bold text-center">{t('shift_status_col')}</th>
                <th className="py-3 px-3 font-bold text-center">{t('payroll_status_col')}</th>
                <th className="py-3 px-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{s.phone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase font-mono text-slate-700 dark:text-slate-300">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{s.branch}</td>
                  <td className="py-3 px-3 font-mono text-right font-bold whitespace-nowrap">
                    {fmt(t('barcode_etb'), [(s.monthlySalary || 0).toLocaleString()])}</td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase ${
                        s.status === 'on_shift'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {s.status === 'on_shift' ? `● ${t('on_shift_badge')}` : t('off_shift_badge')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePayment(s.id)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase cursor-pointer transition-colors ${
                        s.paymentStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                      }`}
                    >
                      {s.paymentStatus === 'paid' ? (t('paid_status')) : (t('pending_status'))}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleToggleShift(s.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        s.status === 'on_shift'
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs'
                      }`}
                    >
                      {s.status === 'on_shift' ? t('clock_out_action') : t('clock_in_action')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add Staff Member */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex p-3 sm:p-5 bg-slate-900/55 dark:bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="terit-modal rounded-3xl max-w-md w-full p-5 sm:p-6 relative text-slate-900 dark:text-slate-100 m-auto max-h-[92dvh] overflow-y-auto">
            <button
              onClick={() => setIsAddStaffOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/8 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>{t('new_staff_btn')}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('staff_modal_desc')}
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {t('staff_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('staff_name_placeholder')}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t('staff_role')}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as StaffRole)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {businessType === 'pharmacy' ? (
                      <>
                        <option value="pharmacist">{t('role_pharmacist')}</option>
                        <option value="cashier">{t('role_dispensary_cashier')}</option>
                        <option value="storekeeper">{t('role_cold_chain_storekeeper')}</option>
                        <option value="manager">{t('role_pharmacy_manager')}</option>
                        <option value="admin">{t('role_admin')}</option>
                      </>
                    ) : businessType === 'building' ? (
                      <>
                        <option value="storekeeper">{t('role_yard_storekeeper')}</option>
                        <option value="cashier">{t('role_dispatch_clerk')}</option>
                        <option value="manager">{t('role_depot_manager')}</option>
                        <option value="admin">{t('role_admin')}</option>
                      </>
                    ) : businessType === 'store' ? (
                      <>
                        <option value="storekeeper">{t('role_warehouse_storekeeper')}</option>
                        <option value="manager">{t('role_logistics_manager')}</option>
                        <option value="cashier">{t('role_dispatch_desk_clerk')}</option>
                        <option value="admin">{t('role_admin')}</option>
                      </>
                    ) : (
                      <>
                        <option value="cashier">{t('role_pos_cashier')}</option>
                        <option value="storekeeper">{t('role_stockroom_clerk')}</option>
                        <option value="manager">{t('role_branch_manager')}</option>
                        <option value="admin">{t('role_admin')}</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t('phone_number_label')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t('monthly_wage_etb_label')}
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="10000000"
                    required
                    value={newSalary}
                    onChange={(e) => setNewSalary(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t('branch_facility_label')}
                  </label>
                  <input
                    type="text"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
                >
                  {t('cancel_btn')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  {t('new_staff_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
