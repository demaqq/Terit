import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Target,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Boxes,
  BookOpen,
} from 'lucide-react';

export interface NavItem {
  id: string;
  labelKey: string;
  Icon: LucideIcon;
  iconClass: string;
}

// One list of screens, ordered by daily workflow. Desktop shows PRIMARY_NAV as tabs and the
// rest under "More"; mobile shows four screens in the bottom bar and the rest in its drawer.
export const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav_dashboard', Icon: LayoutDashboard, iconClass: 'text-amber-500' },
  { id: 'inventory', labelKey: 'nav_inventory', Icon: Boxes, iconClass: 'text-amber-500' },
  { id: 'credit', labelKey: 'nav_credit', Icon: CreditCard, iconClass: 'text-sky-500' },
  { id: 'procurement', labelKey: 'nav_pos', Icon: ShoppingCart, iconClass: 'text-purple-500' },
  { id: 'reorder', labelKey: 'nav_reorder', Icon: Target, iconClass: 'text-rose-500' },
  { id: 'reports', labelKey: 'nav_reports', Icon: TrendingUp, iconClass: 'text-emerald-500' },
];

export const SECONDARY_NAV: NavItem[] = [
  { id: 'catalog', labelKey: 'nav_catalog', Icon: BookOpen, iconClass: 'text-amber-500' },
  { id: 'ledger', labelKey: 'nav_ledger', Icon: Receipt, iconClass: 'text-emerald-500' },
  { id: 'warehouses', labelKey: 'nav_warehouses', Icon: Warehouse, iconClass: 'text-rose-500' },
  { id: 'suppliers', labelKey: 'nav_suppliers', Icon: Building2, iconClass: 'text-indigo-500' },
  { id: 'staff', labelKey: 'nav_staff', Icon: Users, iconClass: 'text-sky-500' },
  { id: 'bundles', labelKey: 'nav_bundles', Icon: Package, iconClass: 'text-amber-500' },
  { id: 'landed-cost', labelKey: 'nav_landed_cost', Icon: Truck, iconClass: 'text-purple-500' },
];

// Screens reachable from the mobile bottom bar directly.
export const MOBILE_BAR_IDS = ['dashboard', 'inventory', 'credit', 'reports'];

// Everything else goes in the mobile "More" drawer.
export const MORE_MENU_ITEMS: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV].filter(
  (item) => !MOBILE_BAR_IDS.includes(item.id)
);

// Old tab ids that now resolve to another screen.
export const TAB_ALIASES: Record<string, string> = { movements: 'ledger' };
