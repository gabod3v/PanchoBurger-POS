# Design: Elegant UI Overhaul

## Technical Approach

6-phase pure-CSS/component rollout. No behavioral changes. Phase 1 fixes the CSS foundation (index.css), Phase 2 extracts reusable components + swaps 2 custom modals to shadcn Dialog, then 4 page batches apply the tokens and ticket-card visual. Each phase is one commit, independently revertible.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| Keep `.pos-card` CSS class vs inline Tailwind on every page | Class = DRY but indirect; inline = explicit but repetitive | **Keep `.pos-card` + update tokens** — already used across 7 files, refactor cost low |
| Ticket cards as CSS class vs inline Tailwind | Ticket design is unique, no reuse | **Inline Tailwind** — avoids adding dead class when no other card needs paper aesthetic |
| Dialog: controlled vs uncontrolled | Controlled matches `showPendingModal` / `selectedOrder` state | **Controlled** — wrap existing booleans directly |
| OrderStatusBadge: cva variants vs switch | cva = standard shadcn pattern | **cva** — matches `badge.tsx` convention, opens future variants |

## Data Flow

No data flow changes. All modifications are markup/CSS only. State variables, handlers, and context usage remain identical.

Component tree after change (new components in **bold**):

```
Page
├── **StatCard**          (Index, DaySummary, CashRegister)
├── **OrderStatusBadge**  (OrdersPage, KitchenDisplay)
├── **PaymentMethodSelector** (PendingPayments, NewOrder)
├── Dialog (shadcn)       (CashRegister, PendingPayments — replaces custom overlay)
└── Card (shadcn)         (CategoriesPage, HistoryPage — already in use)
```

## File Changes

| File | Action | Phase |
|------|--------|-------|
| `src/index.css` | Modify | P1 — update `.pos-card`/`.pos-stat`, remove `.pos-badge*`, `rounded-xl`→`lg` |
| `src/components/OrderStatusBadge.tsx` | **Create** | P2 — shadcn Badge + custom cva variants |
| `src/components/PaymentMethodSelector.tsx` | **Create** | P2 — 4-method grid selector |
| `src/components/StatCard.tsx` | **Create** | P2 — dashboard stat card wrapper |
| `src/pages/Index.tsx` | Modify | P3 — StatCard swap, quick-action style |
| `src/pages/MenuPage.tsx` | Modify | P3 — shadcn Badge for category tags |
| `src/pages/ProductFormPage.tsx` | Modify | P3 — dropzone `rounded-lg` |
| `src/pages/CategoriesPage.tsx` | Modify | P3 — card consistency |
| `src/pages/NotFound.tsx` | Modify | P3 — `bg-background` not `bg-muted` |
| `src/pages/OrdersPage.tsx` | Modify | P4 — full ticket card redesign |
| `src/pages/KitchenDisplay.tsx` | Modify | P4 + P6 — ticket aesthetic, large type |
| `src/pages/NewOrder.tsx` | Modify | P5 — refined pos-card, outlined payment buttons |
| `src/pages/DaySummary.tsx` | Modify | P5 — StatCard, color tokens, Table |
| `src/pages/HistoryPage.tsx` | Modify | P5 — border/shadow polish |
| `src/pages/CashRegister.tsx` | Modify | P2 + P6 — Dialog replacement, step polish |
| `src/pages/PendingPayments.tsx` | Modify | P2 + P6 — Dialog + PaymentMethodSelector |

## New Component Signatures

### OrderStatusBadge

```tsx
// src/components/OrderStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

// cva mapping:
//   pending  → bg-secondary/10 text-secondary border-transparent
//   ready    → bg-accent/10 text-accent border-transparent
//   completed → bg-green-100 text-green-800 border-transparent
//   DEFAULT  → rounded-none uppercase text-xs tracking-wider font-bold

// Usage:
//   <OrderStatusBadge status="pending" />
```

### PaymentMethodSelector

```tsx
// src/components/PaymentMethodSelector.tsx
import { PaymentMethod } from '@/types';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  className?: string;
}

// Renders 4 buttons in grid-cols-2, each with Lucide icon
// Active: bg-primary text-primary-foreground border-primary
// Inactive: bg-card text-muted-foreground border-border/50

// Usage:
//   <PaymentMethodSelector value={method} onChange={setMethod} />
```

### StatCard

```tsx
// src/components/StatCard.tsx

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

// Renders the .pos-stat pattern:
// bg-card text-card-foreground rounded-lg border border-border/50
// shadow-sm p-4 flex flex-col gap-1

// Usage:
//   <StatCard label="Pendientes" value={count} icon={<Clock />} />
```

## CSS Strategy (Phase 1)

Replace the entire `@layer components` block in `src/index.css`:

```
@layer components {
  .pos-card {
    @apply bg-card text-card-foreground rounded-lg border border-border/50 shadow-sm p-6;
  }

  .pos-card-hover:hover {
    @apply shadow-md -translate-y-0.5 ring-1 ring-border/50;
  }

  .pos-stat {
    @apply bg-card text-card-foreground rounded-lg border border-border/50 shadow-sm p-4 flex flex-col gap-1;
  }

  // Remove: .pos-badge, .pos-badge-pending, .pos-badge-ready, .pos-badge-completed
}
```

Map all existing usage:
- `.pos-badge-pending` → `<OrderStatusBadge status="pending" />`
- `.pos-badge-ready` → `<OrderStatusBadge status="ready" />`
- `.pos-badge-completed` → `<OrderStatusBadge status="completed" />`
- Direct `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium` in KitchenDisplay → `OrderStatusBadge` or inline shadcn `Badge`

## Modal Replacement Design (Phase 2)

### CashRegister → Dialog (lines 174-215)

```tsx
// Instead of raw fixed overlay:
// <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

// Use controlled Dialog:
<Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-3">
        <Clock className="text-warning" size={24} />
        Pedidos Pendientes
      </DialogTitle>
    </DialogHeader>
    {/* Keep: order list, total, buttons */}
    <DialogFooter className="flex-row gap-3">
      <Button variant="outline" onClick={() => setShowPendingModal(false)}>
        Después
      </Button>
      <Button onClick={() => { setShowPendingModal(false); window.location.href = '/pendientes'; }}>
        Registrar Pagos
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### PendingPayments → Dialog (lines 141-208)

```tsx
// selectedOrder doubles as open-state (null = closed)
<Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Pagar Pedido #{selectedOrder?.ticketNumber}</DialogTitle>
    </DialogHeader>
    {/* Keep: customer info, totals, PaymentMethodSelector, reference input */}
    <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
    {/* Keep: handlePayOrder button */}
  </DialogContent>
</Dialog>
```

## Ticket Card Visual Architecture (Phase 4)

### DOM Structure — OrdersPage

```html
<!-- Outer container: warm paper stock -->
<div class="bg-amber-50 rounded-lg border border-border/30 shadow-md overflow-hidden">
  <!-- Perforated edge at top -->
  <div class="border-t-2 border-dashed border-border/20 mx-4" />

  <div class="p-5 space-y-4">
    <!-- Header row -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <Receipt class="h-5 w-5 text-muted-foreground" />
        <span class="text-2xl font-mono font-bold text-primary">#{ticketNumber}</span>
      </div>
      <OrderStatusBadge status={order.status} />
    </div>

    <!-- Customer name -->
    <h3 class="text-lg font-semibold text-foreground">{customerName}</h3>

    <!-- Item rows — receipt-style -->
    <div class="space-y-2">
      {items.map(item =>
        <div class="flex justify-between items-center text-sm border-b border-dashed border-border/20 pb-2 last:border-0">
          <span class="font-medium flex-1">{item.product.name}</span>
          <span class="text-muted-foreground w-16 text-right tabular-nums">{formatQty(...)}</span>
          <span class="font-bold w-20 text-right tabular-nums">${(price*qty).toFixed(2)}</span>
        </div>
      )}
    </div>

    <!-- Total + Payment stamp -->
    <div class="border-t-2 border-dashed border-border/30 pt-3 space-y-2">
      <div class="flex justify-between items-baseline">
        <span class="text-sm uppercase tracking-wider font-semibold">Total</span>
        <span class="text-xl font-mono font-bold">${totalUSD.toFixed(2)} <span class="text-xs text-muted-foreground">USD</span></span>
      </div>
      {paymentStatus === 'paid' &&
        <div class="border-t border-dashed border-border/20 pt-2 text-xs font-mono text-muted-foreground">
          Pagado: {paymentMethodLabel}
        </div>
      }
    </div>

    <!-- Action button -->
    {next && <Button class="w-full mt-2">...</Button>}
  </div>
</div>
```

### Kitchen Display Variant
- Same `bg-amber-50` base, dashed edges, stamp badges
- Ticket number: `text-3xl font-mono`, customer: `text-xl`, items: `text-base`
- Status badges: `text-sm`, `rounded-sm` (more readable at 3m)
- Cards `col-span-1` (already full-width in grid), no max-w restriction

### Responsive Behavior
- OrdersPage: ticket cards stack full-width on mobile (<640px), 2-col at `md:` (if desired)
- KitchenDisplay: 1col `md:grid-cols-2` `xl:grid-cols-3` `2xl:grid-cols-4` (already set, just keep)

## Color Token Mapping

| Hardcoded | Elegant Token | Files Affected |
|-----------|--------------|----------------|
| `text-blue-500` | `text-accent` | DaySummary.tsx line 89 |
| `text-purple-500` | `text-secondary` | DaySummary.tsx line 92 |
| `bg-warning/15 text-warning` | `OrderStatusBadge` variant `pending` | OrdersPage, KitchenDisplay |
| `bg-info/15 text-info` | `OrderStatusBadge` variant `ready` | OrdersPage, KitchenDisplay |
| `bg-success/15 text-success` | `OrderStatusBadge` variant `completed` | OrdersPage, KitchenDisplay |
| `rounded-xl` | `rounded-lg` | index.css, ProductFormPage dropzone |
| `bg-muted` (in NotFound) | `bg-background` | NotFound.tsx |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Build | `npm run build:dev` | Exit 0 after each phase commit |
| Lint | `grep` for removed classes | `grep pos-badge src/index.css` → empty after P1; `grep text-blue-500/src/pages/DaySummary.tsx` → empty after P2 |
| Visual | 11 pages inspected | Per-phase visual walkthrough |
| Regression | Dialog behavior | CashRegister + PendingPayments modals open/close/confirm same as before |

## Migration / Rollout

No migration required. 6 sequential phase commits — each `git revert`-able.

## Open Questions

- [ ] Should KitchenDisplay keep the `border-2 border-border` (current) or transition to the ticket paper aesthetic with `border-border/30`? **Decision: ticket aesthetic**, but maintain taller left margin for readability.
- [ ] DaySummary already uses shadcn `Dialog` (line 9, the Manual Order dialog). The custom modal replacement is for the payment modals only — no conflict.
- [ ] KitchenDisplay currently has no `import Badge` — will add `OrderStatusBadge` import in Phase 4.
