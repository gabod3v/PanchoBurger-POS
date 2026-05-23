# Proposal: Elegant UI Overhaul

## Intent

Polish the entire POS UI to match the Elegant design tokens already configured in tailwind: neutral black (#171717), orange (#F97316), blue (#3B82F6), Inter typography, soft shadows, `rounded-lg`. Then redesign OrdersPage + KitchenDisplay with physical restaurant note/ticket card aesthetic. The CSS theme is correct — we execute it properly across all surfaces.

## Scope

### In Scope

- 11 pages: Index, MenuPage, ProductFormPage, CategoriesPage, OrdersPage, KitchenDisplay, NewOrder, DaySummary, HistoryPage, CashRegister, PendingPayments
- 1 CSS: `src/index.css` (pos-card, pos-stat, pos-badge classes)
- 2 custom modals: CashRegister pending modal, PendingPayments pay modal → replace with shadcn Dialog
- Badge alignment: `.pos-badge-pending/ready/completed` → shadcn Badge component
- Hardcoded colors: `text-blue-500`, `text-purple-500` → Elegant tokens
- 3 reusable components: PaymentMethodSelector, OrderStatusBadge, StatCard
- Order cards: restaurant note/ticket redesign on OrdersPage + KitchenDisplay

### Out of Scope

- shadcn base component styling (button.tsx, card.tsx, input.tsx) — keep defaults
- Layout, NavLink, PrintTicket, WeightStepper
- Functional logic, types, data flow, contexts
- Dark mode (tokens exist but not requested)

## Capabilities

### New Capabilities

- `order-note-cards`: Restaurant ticket-style order cards with receipt paper aesthetic, dashed cut-off borders, stamped status indicators

### Modified Capabilities

None — pure UI refactor, no spec-level behavior changes.

## Approach

6-phase rollout: (1) CSS foundation (index.css tokens), (2) reusable components + Dialog swap, (3) Dashboard + Menu + ProductForm + Categories + NotFound, (4) OrdersPage + KitchenDisplay (ticket card redesign), (5) NewOrder + DaySummary + History, (6) CashRegister + PendingPayments. Each phase is independently revertible.

**Order card vision**: Cards resemble paper restaurant tickets — off-white background, dashed bottom border simulating tear-off, monospace ticket number prominent, stamped/squared status badges (not rounded), item list with horizontal separators like a receipt printout. Kitchen cards get larger typography for readability at distance.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/index.css` | Modified | .pos-card→rounded-lg+border-border/50, .pos-stat→rounded-lg, .pos-badge* deprecated |
| `src/pages/OrdersPage.tsx` | Modified | Ticket note card redesign + Badge component + Dashed borders |
| `src/pages/KitchenDisplay.tsx` | Modified | Match ticket aesthetic, larger typography |
| `src/pages/CashRegister.tsx` | Modified | pos-card→Card, Dialog for custom modal |
| `src/pages/PendingPayments.tsx` | Modified | Dialog for custom modal |
| `src/pages/DaySummary.tsx` | Modified | Hardcoded colors→tokens, pos-card→Card |
| `src/pages/Index.tsx` | Modified | pos-stat→StatCard component |
| `src/pages/NewOrder.tsx` | Modified | pos-card→Card |
| `src/pages/MenuPage.tsx` | Modified | pos-card→Card |
| `src/pages/ProductFormPage.tsx` | Modified | pos-card→Card |
| `src/pages/CategoriesPage.tsx` | Modified | Minor polish (Card already used) |
| `src/pages/HistoryPage.tsx` | Modified | Minor polish |
| `src/pages/NotFound.tsx` | Modified | Elegant styling pass |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Kitchen cards lose readability at distance | Low | Maintain large font sizes, test on actual display |
| Custom modals→Dialog breaks behavior | Low | Preserve all state logic, refactor markup only |

## Rollback Plan

`git revert` per phase commit. Each phase commit is atomic and independently revertible.

## Dependencies

None.

## Success Criteria

- [ ] All 11 pages use consistent Elegant styling
- [ ] 2 custom modals replaced with shadcn Dialog (CashRegister + PendingPayments)
- [ ] Hardcoded `text-blue-500`/`text-purple-500` eliminated
- [ ] pos-card/pos-stat/pos-badge classes removed from `index.css`
- [ ] OrdersPage cards look like physical restaurant notes (dashed borders, receipt aesthetic)
- [ ] KitchenDisplay cards match ticket aesthetic
- [ ] `npm run dev` builds without errors
