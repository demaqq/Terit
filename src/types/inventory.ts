export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type MovementType = 'inbound' | 'outbound' | 'adjustment' | 'transfer';
export type POStatus = 'draft' | 'ordered' | 'received' | 'cancelled';
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'shop' | 'warehouse' | 'pharmacy';
export type CostingMethod = 'fifo' | 'lifo' | 'wac';
export type LedgerEntryType = 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'assembly' | 'disassembly' | 'inbound' | 'outbound' | 'initial';
export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface InventoryItem {
  id: string;
  userId?: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  quantity: number;
  minStockAlert: number;
  unitPrice: number; // selling price
  costPrice: number; // base procurement cost (pre-landed)
  unitOfMeasure: string; // 'pcs', 'boxes', 'kg', 'meters'
  location?: string; // Warehouse name or code (backward compat)
  locationId?: string; // new: reference to Location
  supplierId?: string;
  supplierName?: string;
  status: ItemStatus;
  batchNumber?: string;
  expiryDate?: string;
  color?: string;
  size?: string;
  specs?: string;
  isBundle?: boolean;
  bundleComponents?: BundleComponent[]; // component items & quantities
  costingMethod?: CostingMethod;
  // Operational attributes (tailored business models)
  isQuarantined?: boolean; // Pharmacy: block dispensing of expired/quarantined batches
  originalUnitPrice?: number; // Supermarket/Shop: base retail price before markdown
  discountPct?: number; // Reversible markdown/clearance percentage (0-100)
  packSize?: number; // Pieces per carton/crate/bundle for unit conversion
  createdAt: string;
  updatedAt: string;
}

// Backward-compatible alias
export type StockTransaction = StockLedgerEntry;

// Backward-compatible alias
export type Warehouse = Location;

export interface BundleComponent {
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number; // units of component per one bundle
}

export interface Location {
  id: string;
  userId?: string;
  name: string;
  code: string;
  type?: 'warehouse' | 'bin' | 'store' | 'vehicle';
  address?: string;
  capacity?: number;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StockLedgerEntry {
  id: string;
  userId?: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: LedgerEntryType;
  quantity: number; // positive = inbound to destination, negative = outbound from source
  previousQuantity?: number; // backward compat
  newQuantity?: number; // backward compat
  sourceLocationId?: string;
  sourceLocationName?: string;
  destinationLocationId?: string;
  destinationLocationName?: string;
  location?: string; // backward compat: primary location affected
  referenceNumber?: string; // backward compat
  unitCost?: number; // cost at time of movement
  totalCost?: number;
  referenceType?: 'purchase_order' | 'sale' | 'stock_adjustment' | 'transfer' | 'bundle_assembly' | 'bundle_disassembly' | 'initial';
  referenceId?: string;
  reason: string;
  syncStatus?: SyncStatus;
  localId?: string; // client-generated ID for offline-first
  createdAt: string;
  updatedAt?: string;
}

export interface StockBalance {
  itemId: string;
  locationId: string;
  locationName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageUnitCost: number;
  totalValue: number;
  lastUpdated: string;
}

export interface LandedCostAllocation {
  id: string;
  purchaseOrderId: string;
  lineItemId: string;
  costType: 'shipping' | 'customs_duty' | 'handling' | 'insurance' | 'other';
  description: string;
  amount: number; // total amount allocated across line items
  currency: string;
  allocatedTo: string[]; // line item IDs
  createdAt: string;
}

export interface Supplier {
  id: string;
  userId?: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  notes?: string;
  rating?: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface POLineItem {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number; // base cost before landed allocation
  totalCost: number;
  landedCostAllocated?: number; // allocated landed cost for this line
  landedUnitCost?: number; // unitCost + allocated landed cost per unit
}

export interface PurchaseOrder {
  id: string;
  userId?: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POLineItem[];
  totalAmount: number;
  totalLandedCost?: number;
  grandTotal?: number;
  status: POStatus;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  sku: string;
  locationId: string;
  locationName: string;
  quantityOnHand: number;
  averageDailyVelocity: number;
  leadTimeDays: number;
  reorderPoint: number;
  safetyStock: number;
  recommendedOrderQuantity: number;
  estimatedCost: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface SyncOutboxEntry {
  id: string;
  localId: string;
  operation: 'create' | 'update' | 'delete';
  collection: 'inventory_items' | 'stock_ledger' | 'items' | 'ledger_entries' | 'locations' | 'purchase_orders' | 'suppliers' | 'bundles';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface MarketSearchResult {
  query: string;
  analysis: string;
  sources: GroundingSource[];
  searchQueries: string[];
  timestamp: string;
}

export type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod = 'telebirr' | 'cbe_birr' | 'cash' | 'bank_transfer';

export interface CreditRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: DebtStatus;
  itemsPurchased: {
    itemId: string;
    itemName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  settledAt?: string;
}

export type StaffRole = 'admin' | 'manager' | 'pharmacist' | 'storekeeper' | 'cashier';

export interface AttendanceLog {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  hoursWorked?: number;
  status: 'present' | 'late' | 'absent' | 'on_leave';
  notes?: string;
}

export interface StaffMember {
  id: string;
  userId?: string;
  name: string;
  role: StaffRole;
  phone: string;
  email?: string;
  branch: string;
  hourlyWage?: number;
  monthlySalary?: number;
  status: 'active' | 'inactive' | 'on_shift';
  hiredDate: string;
  commissionRate?: number;
  paymentStatus: 'paid' | 'pending';
  lastPaymentDate?: string;
}

export interface AlertSettings {
  emailEnabled: boolean;
  recipientEmail: string;
  smsEnabled: boolean;
  recipientPhone: string;
  alertOnLowStock: boolean;
  alertOnOutOfStock: boolean;
  alertOnExpiry: boolean;
  alertOnPOReceipt: boolean;
  digestMode: 'instant' | 'daily';
}

export interface AlertDispatchLog {
  id: string;
  channel: 'sms' | 'email';
  recipient: string;
  subjectOrPreview: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp: string;
  triggeredBy: string;
}

export interface CompanyProfile {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  subcity?: string;
  address?: string;
  tin?: string;
  branchName?: string;
  selectedBMPlan?: string;
  billingCycle?: 'monthly' | 'annual';
  paymentMethod?: string;
  paymentStatus?: 'due' | 'paid' | 'trial';
  paymentDate?: string;
  lastPaymentTxId?: string;
  onboardingCompleted?: boolean;
  // Operational compliance logs (tailored business models)
  coldChainLastInspection?: string; // ISO date of last fridge inspection
  coldChainTempC?: number; // Last recorded fridge temperature (°C)
  coldChainInspectorNote?: string;
  yardLastInspection?: string;
  yardInspectorNote?: string;
}

