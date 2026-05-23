# Delta for order-note-cards

> New capability — full spec. All requirements are visual/stylistic by design; no behavioral changes.

## Requirements

### Phase 1 — CSS Foundation

#### Requirement: `.pos-card` and `.pos-stat` Use Elegant Tokens

The system MUST refactor `.pos-card` to `bg-card text-card-foreground rounded-lg border border-border/50 shadow-sm p-6`.
The system MUST refactor `.pos-stat` to `bg-card text-card-foreground rounded-lg border border-border/50 shadow-sm p-4 flex flex-col gap-1`.
The system MUST remove all `.pos-badge*` classes from `src/index.css`.
All `rounded-xl` in index.css MUST become `rounded-lg`.
The system SHALL use `border-border/50` as the standard border utility.

#### Scenario: Foundation compiles clean

- GIVEN the project builds with `npm run build:dev`
- WHEN inspecting `src/index.css`
- THEN `.pos-card` and `.pos-stat` use the new token classes
- AND no `.pos-badge*` class definitions exist in the output

### Phase 2 — Reusable Components

#### Requirement: Custom Modals Replaced with shadcn Dialog

The payment modals in CashRegister.tsx (lines 174-215) and PendingPayments.tsx (lines 141-208) MUST use `Dialog` from shadcn. All existing state variables, callbacks, and event handlers MUST be preserved — markup only changes.

#### Requirement: Shared Components Extracted

The system SHALL extract three components:
- **`OrderStatusBadge`**: shadcn `Badge` with custom variants — `pending` (`bg-secondary/10 text-secondary`), `ready` (`bg-accent/10 text-accent`), `completed` (`bg-green-100 text-green-800`)
- **`PaymentMethodSelector`**: Renders 4 payment methods (cash, card, transfer, credit) with icons in a grid
- **`StatCard`**: Wraps the `.pos-stat` pattern for dashboard stats

#### Requirement: Hardcoded Colors Replaced

All `text-blue-500` and `text-purple-500` in DaySummary.tsx MUST be replaced with Elegant design tokens (`text-accent`, `text-secondary`).

#### Scenario: Modal Dialog works

- GIVEN the user opens payment modal in CashRegister
- WHEN inspecting the rendered DOM
- THEN it contains a `[role="dialog"]` element from shadcn Dialog
- AND all state/handlers (confirm, cancel, payment method selection) function identically

#### Scenario: Status badges display variants

- GIVEN an order with status "pending"
- WHEN `OrderStatusBadge` renders
- THEN it uses `bg-secondary/10 text-secondary` color classes

### Phase 3 — Pages Batch 1

#### Requirement: Simpler Pages Use Elegant Styling

- **Index.tsx**: Stat cards use `StatCard` component. Quick-action buttons use outlined or sophisticated dark-bordered style (NOT `bg-primary` heavy). Grid uses `gap-4`. `animate-slide-in` persists.
- **MenuPage.tsx**: Product cards use refined `.pos-card`. Category inline badges use shadcn `Badge`.
- **ProductFormPage.tsx**: Uses refined `.pos-card`. Dropzone `border-radius` consistent with `rounded-lg`.
- **CategoriesPage.tsx**: Minor Card border/shadow refinement (already uses shadcn Card).
- **NotFound.tsx**: Uses `bg-background` (not `bg-muted`). Text tone matches Elegant aesthetic.

### Phase 4 — Ticket Cards (Key Visual Feature)

#### Requirement: Order Cards Resemble Physical Restaurant Notes

(Full visual treatment in dedicated section below.)

### Phase 5 — Pages Batch 2

#### Requirement: NewOrder, DaySummary, History Use Elegant Styling

- **NewOrder.tsx**: Product cards use refined `.pos-card`. Search input lighter/refined. Payment method buttons use sophisticated outlined style (not `bg-primary`). Summary sidebar uses refined `.pos-card` with consistent spacing. WeightStepper integration clean (no functional changes).
- **DaySummary.tsx**: Stats use `StatCard`. Hardcoded colors eliminated (from Phase 2). Payment breakdown refined. MAY use shadcn `Table` component.
- **HistoryPage.tsx**: Card borders/shadows refined for consistency (already uses shadcn Card).

### Phase 6 — Pages Batch 3

#### Requirement: CashRegister, PendingPayments, KitchenDisplay Refined

- **CashRegister.tsx**: Multi-step flow step indicators refined. Modal already replaced (Phase 2).
- **PendingPayments.tsx**: Uses extracted `PaymentMethodSelector` component. Modal already replaced (Phase 2).
- **KitchenDisplay.tsx**: Ticket aesthetic consistent with Phase 4. Large typography maintained. Status transition buttons refined.

## Visual Spec — Order Note Cards

The ticket card is the signature visual of this change. Every element is chosen to evoke a physical restaurant order slip pinned to a rail.

| Element | Style | Rationale |
|---------|-------|-----------|
| **Card background** | `bg-amber-50` or `bg-stone-50` | Warm off-white simulates paper stock |
| **Perforated edge** | `border-dashed border-border/30` on top and/or bottom | Simulates tear-off from receipt roll |
| **Ticket number** | `text-2xl font-mono font-bold text-primary` | Large monospace — the order ID reads like a ticket stub |
| **Header icon** | `Receipt` from lucide-react, `h-5 w-5 text-muted-foreground` | Small visual cue reinforcing "ticket" |
| **Customer name** | `text-lg font-semibold text-foreground` | Prominent but secondary to ticket number |
| **Item rows** | Name left-aligned, qty center, price right; separator `border-b border-dashed border-border/20` between items | Mimics thermal receipt print layout |
| **Status badge** | Square corners (`rounded-none` or minimal), `uppercase text-xs tracking-wider font-bold`, tinted background | Looks like a rubber stamp applied to the paper |
| **Status colors** | Pending = `bg-secondary/15 text-secondary`, Ready = `bg-accent/15 text-accent`, Completed = `bg-green-100 text-green-800` | Keeps Elegant palette but muted for "stamped" feel |
| **Shadow** | `shadow-md` | Lifts card off page without heaviness |
| **Payment stamp** | Bottom section with `border-t border-dashed border-border/30` divider, `font-mono text-sm` for amounts | Looks like a validation mark at ticket bottom |

**Kitchen Display variant**: Same paper aesthetic with operational scaling — header `text-3xl`, item text `text-base`, status badges `text-sm` for 3m readability. Cards full-width (no sidebar). Transition buttons refined but functional.

## Acceptance Criteria

| Criterion | Verification |
|-----------|-------------|
| `npm run dev` compiles with no errors | `npm run build:dev` exits 0 |
| All 11 pages use consistent Elegant tokens | Visual inspection of each page |
| No `.pos-badge*` classes in index.css | `grep pos-badge src/index.css` returns empty |
| No `text-blue-500` or `text-purple-500` in DaySummary.tsx | `grep` returns empty |
| 2 custom modals replaced with shadcn Dialog | DOM contains `[role="dialog"]` in both flows |
| OrdersPage cards have dashed borders and paper background | Visual inspection |
| KitchenDisplay uses same ticket aesthetic, larger text | Visual inspection |
| `PaymentMethodSelector`, `OrderStatusBadge`, `StatCard` exist as components | Files exist in `src/components/` |
| Each phase commit is independently revertible | `git revert <phase-commit>` restores clean state |

## Out of Scope

All items from proposal: shadcn base components (`button.tsx`, `card.tsx`, `input.tsx`), Layout.tsx, NavLink.tsx, PrintTicket.tsx, WeightStepper.tsx, business logic, contexts, types, dark mode.
