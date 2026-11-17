# Tailored Business-Model UX & Operational Logic Upgrade for Terit

Upgrade Terit from a shared generic inventory interface with bolted-on industry calculators into seven genuinely model-native operational workspaces—each with adaptive dashboard KPIs, smart unit-and-batch guardrails during stock movements, live data-backed industry tools, and real inventory-driven analytics across all five Ethiopian languages.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Because this plan upgrades UX, operational rules, and live analytics across **all seven business models** simultaneously, confirm the three architectural choices below before implementation begins.

- **Scope & Rollout Strategy (Recommended Default: Full 7-Model Logic + Live Analytics)**: Replace all remaining static industry tables and disconnected calculators with live computations derived from real inventory, purchase orders, and stock ledger movements across Shop, Building Materials, Minimarket, Pharmacy, Supermarket, Wholesale Store, and General Commercial.
- **Persistent Industry Operational Flags**: Store pharmacy batch quarantine status, active clearance/evening markdown prices, and cold-chain temperature inspection logs directly in user-scoped cloud/offline storage (extending the strict database validation schema and deploying updated security rules) rather than browser-only temporary storage.
- **Smart Stock-Out & Unit Conversion Guardrails**: Upgrade the quick stock adjustment workflow to adapt per business model—enforcing FEFO batch selection and quarantine blocks for Pharmacies, carton/pallet/crate multipliers for Wholesale & Minimarkets, rebar bar-to-tonnage conversions for Building Yards, and missing-size warnings for Boutiques.

---

## 1. Overview & Core Concept

- **What It Does**: Adapts every core touchpoint of Terit—top KPI strips, industry operational hubs, quick stock adjustment modals, inventory filters, customer credit workflows, and executive analytics—to match how merchants in Ethiopia actually operate in each of the seven business verticals.
- **Target Audience & Context**: Shopkeepers, pharmacists, hardware/cement yard managers, supermarket supervisors, minimarket cashiers, wholesale depot clerks, and multi-branch commercial traders operating in ETB across Addis Ababa and regional markets, in English, አማርኛ, Afaan Oromoo, ትግርኛ, and Af Soomaali.
- **Key Value**: Eliminates dead-end calculators and generic static charts; every calculation (markdowns, landed unit costs, rebar cuts, crate deposits, Rx dispensings) directly reads from and commits back to live inventory, ledger entries, and customer credit records.

### Model-by-Model Operational Matrix

```
┌──────────────────┬─────────────────────────────┬───────────────────────────────┬──────────────────────────────┐
│ Business Model   │ Primary Dashboard KPI Focus │ Specialized Operational Logic │ Action-Linked Workflow       │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Boutique (Shop)  │ Size-Run Completeness,      │ Color × Size Stock Matrix,    │ One-click low-size PO,       │
│                  │ Slow-Mover Capital (ETB)    │ Real Sell-Through by Size     │ Apply Clearance % to SKUs    │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Building Yard    │ Yard Tonnage & Cement Age,  │ Rebar Diameter/Weight Calc,   │ Auto-deduct yard stock +     │
│                  │ Contractor Credit Exposure  │ Axle Load & Moisture Sentinel │ Sync Dispatch to Credit Note │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Minimarket       │ Daily Fast-Turn Stockouts,  │ Crate/Bottle Deposit Ledger,  │ 1-Tap Counter Sale + Return  │
│                  │ Gross Margin & Spoilage     │ Instant Daily Shrinkage Log   │ Crate Swap & Rapid Restock   │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Pharmacy         │ Expiring Value (≤30/60d),   │ EFDA FEFO Guidance, Batch     │ Block quarantined/expired    │
│                  │ Cold-Chain Compliance       │ Quarantine & Strip Dispensing │ dispensing; real fridge logs │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Supermarket      │ Perishable Risk Value,      │ Live Dept/Aisle Valuation,    │ Apply live Evening Markdown  │
│                  │ Margin Health by Aisle      │ Sort-by-Earliest-Expiry       │ price to SKU + Print Tag     │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Wholesale Store  │ Depot Bay Utilization %,    │ Pallet/Carton ↔ Piece Math,   │ Dock PO Receive + Export     │
│                  │ Open Freight PO Value       │ Tiered MOQ Rebate Quotes      │ Tiered Quote to Credit/PO    │
├──────────────────┼─────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ General Trade    │ Branch Allocation Balance,  │ Inter-Branch Transfer +       │ Commit calculated Landed     │
│                  │ Avg Gross Margin %          │ Customs/Freight Costing       │ Cost & Price back to SKU     │
└──────────────────┴─────────────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Model-Adaptive Dashboard Arrival**: Upon sign-in or model selection, the dashboard renders a unified 4-card KPI strip tailored to the active business vertical (e.g., Pharmacies immediately see At-Risk Expiring Value & Quarantined Batches alongside Stock Valuation; Building Yards see Cement Age Risk & Yard Tonnage).
  2. **Closed-Loop Industry Workbench**: Directly beneath the KPI strip, the workspace opens the model's focused 2–3 tab operations panel. Every action—applying an evening grocery markdown, clearing a boutique size run, issuing a building yard dispatch pass, logging a 2–8°C fridge reading, returning beverage crates, or computing landed import costs—writes real state updates with inline confirmation and undo-safe ledger entries.
  3. **Smart Contextual Stock Movement (`Stock In / Out`)**: Opening Stock In/Out presents model-aware unit helpers and safety checks: Pharmacies see the item's batch/expiry status and a warning if a batch is quarantined or an earlier-expiring batch exists; Building & Wholesale operators can toggle entry in Tons, Pallets, or Cartons and automatically convert to base units; Minimarkets can log spoilage/crate swaps in one click.
  4. **Live Model-Native Analytics**: Navigating to Reports shows real inventory-computed size sell-through matrices (Boutique), live expiry risk tiers (Pharmacy), category margin/velocity breakdowns from actual ledger entries (Supermarket/Minimarket), and real warehouse-capacity bars (Wholesale Store)—never static placeholder arrays.

- **Visual Identity & SaaS Dashboard Discipline**:
  - *Aesthetic Direction*: High-legibility utilitarian enterprise workspace grounded in crisp neutral surfaces (`#FFFFFF` light / `#0F172A` slate dark) with concentrated warm amber (`#D97706` / `#F59E0B`) reserved strictly for primary actions and active navigation states.
  - *Color & Contrast System*: Follows strict **60-30-10 allocation** (60% neutral canvas, 30% subdued hairline-bordered surfaces, 10% primary accent). Critical semantic colors—Emerald (`#16A34A`) for nominal/in-stock, Amber (`#D97706`) for warning/low-run, and Crimson (`#DC2626`) for critical expiry/overload/quarantine—always pair hue with explicit text labels and icons.
  - *Typography & Tabular Discipline*: Geometric display/body sans (`Plus Jakarta Sans`) paired with strict tabular monospace numerals (`JetBrains Mono` / `tabular-nums`) for every ETB amount, SKU code, batch date, tonnage, and percentage so tables and matrices align cleanly without layout jitter.
  - *Anti-Clutter & Zero-Pill Refinement*: Replace decorative pill sandwiches, pulsing status dots, and nested card-within-card wrappers with single-elevation surfaces (`1px` hairline borders), clean typographic separators (`·`, `/`), single-line `whitespace-nowrap` action controls, and compact 36px–44px table row density.
  - *Full 5-Language Localization*: Eliminate remaining hardcoded English/mixed-language labels inside industry tools and report sections so `en`, `am`, `om`, `ti`, and `so` render consistently across every vertical.

- **Interactive Feedback & Motion**:
  - Instant (<200ms) optimistic feedback banners and toast notifications when commits mutate stock, price, quarantine status, or ledger entries.
  - Explicit empty states for cold-chain logs, expiring batches, clearance candidates, or dock queues with one-click recovery buttons (`Log First Inspection`, `Add Expiring Batch`, `Create Inbound PO`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Real Inventory & Ledger Computations vs. Synthetic Charts**
  - *Chosen Approach*: Compute boutique size-run matrices, minimarket/supermarket peak movement velocity, wholesale warehouse capacity utilization, and pharmacy expiry exposure directly from live `items`, `warehouses`, and `stock_ledger` collections (with graceful empty-state guidance when no ledger activity exists yet).
  - *Why*: Merchants rely on dashboards to make real procurement and pricing decisions; hardcoded sample curves erode trust as soon as the merchant edits stock.
  - *Alternatives Considered*: Keeping synthetic curves as "demo projections"—rejected because mixing live inventory counts with fake chart numbers misleads operators.

- **Decision 2: Strict Schema Extension + Cloud/Local Dual Persistence for New Operational Fields**
  - *Chosen Approach*: Keep `InventoryItem` backward-compatible while adding optional typed properties where genuinely needed (`isQuarantined`, `markdownPrice`, `originalUnitPrice`, `packSize`, `crateDepositETB`), or storing lightweight operational logs (e.g., cold-chain fridge readings) in a user-owned profile/log structure validated in both the blueprint schema and Firestore rules.
  - *Why*: Security rules reject unapproved document keys (`keys().hasOnly(...)`). Updating the data schema and security rules in lockstep preserves strict validation while making operational flags persistent across devices.
  - *Alternatives Considered*: Storing everything only in browser `localStorage`—rejected because logged-in users switching devices would lose quarantine locks and markdown pricing.

- **Decision 3: Adaptive Model KPIs Without Fragmenting Navigation**
  - *Chosen Approach*: Keep the consistent global top navigation and 4-card top KPI grid structure across all models, while dynamically swapping the 3rd/4th KPI slot metrics, operational panel tabs, quick-adjust unit helpers, and report section per `businessType`.
  - *Why*: Operators managing multiple branches or switching models keep muscle memory for navigation while gaining immediate domain relevance on every screen.
  - *Alternatives Considered*: Building 7 completely separate router apps—rejected due to maintenance bloat and inconsistent multi-language support.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### System Architecture & Model Adaptation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Global Session & Business Context                    │
│  businessType ∈ {shop, building, minimarket, pharmacy, supermarket,     │
│                  store, other} + live items[] + ledger[] + locations[]  │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────┐       ┌─────────────────────────────────┐
│   Adaptive Presentation Layer │       │   Domain Logic & Guardrail Hub  │
│                               │       │                                 │
│ • Model-Specific KPI Engine   │       │ • Pharmacy: FEFO + Quarantine   │
│   (Expiring Val / Size Runs / │       │   block on outbound deduction   │
│    Depot Cap % / Yard Tons)   │       │ • Building: Rebar Ton↔Bar &     │
│ • Industry Workbench Panels   │       │   Axle Load + Credit Dispatch   │
│   (2-3 action-linked tabs)    │       │ • Boutique: Color×Size Matrix & │
│ • Live Model Analytics        │       │   Batch Clearance Pricing       │
│   (derived from items+ledger) │       │ • Wholesale/Mini: Crate/Carton  │
│ • 5-Lang Dictionary (t keys)  │       │   Multipliers & MOQ Quotes      │
└───────────────┬───────────────┘       └─────────────────┬───────────────┘
                │                                         │
                └────────────────────┬────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               Validated State Mutation & Ledger Commit                  │
│  updateItem() │ quickAdjustStock() │ createCredit() │ coldChainLog()    │
│        └──────────────► Offline Sync Outbox + Firestore Rules           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Schema Additions

- **Optional `InventoryItem` Operational Attributes**:
  - `isQuarantined` *(boolean)*: Prevents outbound sales/dispensing when flagged by Pharmacy Expiry Sentinel.
  - `originalUnitPrice` & `discountPct` *(numbers)*: Supports reversible Supermarket Evening Markdowns and Boutique Seasonal Clearance while keeping base retail price intact.
  - `packSize` *(number)*: Number of base pieces per carton, crate, or bundle (for Minimarket crate swaps, Pharmacy strip/box dispensing, and Wholesale depot tier conversions).
- **Cold-Chain & Yard Compliance Logs**:
  - Stored per user in `UserProfile.companyProfile` (last inspection timestamp, fridge temperature readings, inspector note) so logs persist cleanly in Firestore without adding extra top-level collections unless full audit history is needed.
- **Persistent Dispatch & Crate Deposit Context**:
  - Building Material Dispatch Passes assign a deterministic pass reference (`DSP-YYYY-NNNN`) once created, deduct yard cement/block stock atomically, and optionally create a matching `CreditRecord` contractor receivable if marked as Site Credit.
  - Minimarket Crate/Bottle Deposits track returnable crate balances cleanly alongside express counter sales.

### Interactive Component & State Mapping

- **Dashboard Header & KPI Grid**:
  - Derives KPI cards from a centralized model-KPI selector using live `items`, `purchaseOrders`, `warehouses`, and `transactions`—each card links directly to its filtered Inventory, Procurement, or Credit view.
- **Industry Operations Workbench**:
  - *Pharmacy*: Expiry window selector filters real batches by days remaining; `Quarantine Batch` updates item `isQuarantined` state; `Log Temperature Inspection` saves structured Celsius readings (`2.0°C–8.0°C` validation) with timestamp; `Dispense` converts prescribed tablets to strips/boxes, checks quarantine/expiry status, and deducts stock.
  - *Boutique (Shop)*: `Size & Color Matrix` aggregates real SKUs across color × size cells with direct `Reorder` / `Adjust` triggers; `Clearance Markdown` previews ETB liquidity and commits reversible markdown pricing directly to selected slow-moving items.
  - *Building Materials*: `Rebar Calculator` computes bars/tonnage/wire and deducts steel inventory; `Dispatch Pass` locks deterministic pass IDs, validates vehicle axle weight, deducts cement/HCB stock, and offers one-click conversion into a Contractor Credit invoice; `Moisture Sentinel` inspects real cement SKUs in inventory by batch age (`createdAt`/`batchNumber`) alongside stack/tarp rules.
  - *Supermarket*: `Freshness Watchlist` sorts real SKUs by earliest expiry date and stock risk; `Apply Evening Markdown` updates real SKU price reversibly and opens/prints updated shelf tags; `Aisle Restock` links each live category directly to pre-filled PO creation.
  - *Minimarket*: `Fast Restock & Crate Swap` supports instant `+crate`/`+pack` restocking, searchable quick counter sale, one-click daily shrinkage logging, and returnable crate deposit tracking.
  - *Wholesale Store*: `Depot Capacity` bars compute real hub occupancy from `locations`/`warehouses`; `Dock Receiving` confirms pending inbound POs; `MOQ Tier Builder` generates printable wholesale quotes and can push bulk credit terms to the Credit Ledger.
  - *General Commercial*: `Inter-Branch Transfer` moves stock across real locations; `Landed Cost Calculator` allows picking any real SKU, calculates unit freight + customs overhead, and commits the updated `costPrice` and target `unitPrice` directly to that SKU.
- **Contextual Stock In / Out Modal (`QuickAdjust`)**:
  - Adapts helper controls to `businessType` (Unit Multiplier toggle for Cartons/Pallets/Crates/Bags, FEFO earliest-expiry & quarantine safety banner for Pharmacies, weight/axle indicator for Building Yards) before calling `quickAdjustStock`.
- **Analytics & Reports**:
  - Replaces hardcoded arrays (`supermarketDayDemand`, `storeBayUtilizationHistory`, `shopSizeSellThrough`, `minimarketPeakHours`) with memoized selectors driven by actual `items` and `transactions` ledger timestamps, category margins, warehouse capacities, and variant quantities.
