# Tasks: Elegant UI Overhaul + Restaurant Note Order Cards

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~700 (±50) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1: P1+P2, PR2: P3+P5+P6, PR3: P4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base |
|------|------|-----------|------|
| 1 | P1+P2: CSS foundation + Components + modals + color tokens | PR 1 | main |
| 2 | P3+P5+P6: All simpler pages (Index, Menu, ProductForm, Categories, NotFound, NewOrder, DaySummary, History, CashRegister, PendingPayments) | PR 2 | main |
| 3 | P4: Ticket cards (OrdersPage + KitchenDisplay) | PR 3 | main |

## Phase 1 — Foundation (src/index.css only)

- [x] 1.1 Update `.pos-card` in `src/index.css`: `rounded-xl`→`rounded-lg`, add `text-card-foreground`, `border-border/50`, `p-5`→`p-6`
- [x] 1.2 Update `.pos-stat` in `src/index.css`: `rounded-xl`→`rounded-lg`, add `text-card-foreground`, `border-border/50`, drop `hover:bg-muted/10`
- [x] 1.3 Remove `.pos-badge`, `.pos-badge-pending`, `.pos-badge-ready`, `.pos-badge-completed` from `src/index.css` (lines 123-137)

## Phase 2 — Components + Modals + Color Tokens

- [x] 2.1 Create `src/components/OrderStatusBadge.tsx`: shadcn `Badge` + cva with `pending`/`ready`/`completed` variants (orange/blue/green)
- [x] 2.2 Create `src/components/PaymentMethodSelector.tsx`: 4 methods grid (pagomovil, efectivo_bs, efectivo_usd, punto) with Lucide icons, selected state dark-bound outline
- [x] 2.3 Create `src/components/StatCard.tsx`: props `label, value, icon?, trend?, className?`, wraps `.pos-stat` pattern
- [x] 2.4 Replace custom modal in `CashRegister.tsx` (lines ~174-215) with shadcn `Dialog`, preserve all state/handlers
- [x] 2.5 Replace custom modal in `PendingPayments.tsx` (lines ~141-208) with shadcn `Dialog`, preserve all state/handlers
- [x] 2.6 Replace `text-blue-500`→`text-accent`, `text-purple-500`→`text-secondary` in `DaySummary.tsx` (lines 89, 92)

## Phase 3 — Pages Batch 1 (simpler pages)

- [ ] 3.1 `Index.tsx`: Replace 4 `pos-stat` divs with `StatCard` component, refine quick-action buttons (outlined, not `bg-primary`), consistent gap grid
- [ ] 3.2 `MenuPage.tsx`: Replace inline badge spans with `Badge` from shadcn, cards use refined `.pos-card`
- [ ] 3.3 `ProductFormPage.tsx`: Wrapper uses refined `.pos-card`, dropzone `rounded-xl`→`rounded-lg` (lines 185, 195)
- [ ] 3.4 `CategoriesPage.tsx`: Minor Card border/shadow refinement (already uses shadcn Card, just ensure consistency)
- [ ] 3.5 `NotFound.tsx`: Use `bg-background` instead of `bg-muted`

## Phase 4 — 🎫 Ticket Cards (Order Note Redesign)

- [ ] 4.1 `OrdersPage.tsx`: Full card redesign — `bg-amber-50` paper stock, `border-dashed` perforated edges, `font-mono` ticket number, item rows with dashed separators, stamp-style `OrderStatusBadge` with `rounded-none`, payment stamp section, summary sidebar with compact ticket list
- [ ] 4.2 `KitchenDisplay.tsx`: Same paper aesthetic with larger fonts (`text-3xl` header, `text-base` items, `text-sm` badges), full-width cards, status transition buttons refined

## Phase 5 — Pages Batch 2

- [ ] 5.1 `NewOrder.tsx`: Product cards use refined `.pos-card`, search input lighter border, replace payment buttons with outlined style (not `bg-primary`), summary sidebar refined
- [ ] 5.2 `DaySummary.tsx`: Stats use `StatCard`, payment breakdown cards refined, colors already tokenized in P2, optional shadcn `Table` for sales list
- [ ] 5.3 `HistoryPage.tsx`: Card border/shadow refinement (already uses shadcn Card)

## Phase 6 — Pages Batch 3

- [ ] 6.1 `CashRegister.tsx`: Multi-step flow step indicators refined (Dialog already replaced in P2)
- [ ] 6.2 `PendingPayments.tsx`: Use `PaymentMethodSelector` component (Dialog already replaced in P2)
- [ ] 6.3 `KitchenDisplay.tsx`: Ensure ticket aesthetic consistency with P4 (status badges, spacing, paper style)

## Dependency Graph

```
P1 ──→ P2 ──┬──→ P3 ──→ P5 ──→ P6
            │
            ├──→ P4
            │
            └──→ P5 ──→ P6
```

- **Sequential**: P1 → P2 (P2 depends on P1's CSS tokens)
- **Parallelizable (after P2)**: P3, P4, P5 — no cross-dependencies
- **Sequential tail**: P5 → P6 (P6 refines CashRegister/PendingPayments which use P5's patterns)
- **Each phase commit independently revertible**

## Work-Unit Commit Plan

| Commit | Phase | Files | Est. Lines | Revert Safe |
|--------|-------|-------|-----------|-------------|
| 1 | P1+P2 | `index.css`, `OrderStatusBadge.tsx`, `PaymentMethodSelector.tsx`, `StatCard.tsx`, `CashRegister.tsx`, `PendingPayments.tsx`, `DaySummary.tsx` | ~183 | Yes |
| 2 | P3+P5+P6 | `Index.tsx`, `MenuPage.tsx`, `ProductFormPage.tsx`, `CategoriesPage.tsx`, `NotFound.tsx`, `NewOrder.tsx`, `DaySummary.tsx`, `HistoryPage.tsx`, `CashRegister.tsx`, `PendingPayments.tsx`, `KitchenDisplay.tsx` | ~195 | Yes |
| 3 | P4 | `OrdersPage.tsx`, `KitchenDisplay.tsx` | ~330 | Yes |

## Execution Order

P1.1 → P1.2 → P1.3 → P2.1 → P2.2 → P2.3 → P2.4 → P2.5 → P2.6 → (P3.1-5, P4.1-2, P5.1-3 in any order, but recommend P3 first) → P6.1 → P6.2 → P6.3

Within each phase, tasks run left-to-right as numbered.
