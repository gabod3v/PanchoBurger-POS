import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { Order } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AppContext', async () => {
  const actual = await vi.importActual('@/contexts/AppContext');
  return {
    ...actual,
    useApp: vi.fn(),
  };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const mockProduct1 = {
  id: 'p1', name: 'Hamburguesa Clásica', price: 8.50,
  category: 'Comida', soldByWeight: false,
};

const mockProduct2 = {
  id: 'p2', name: 'Papa Frita', price: 4.00,
  category: 'Comida', soldByWeight: false,
};

const mockPaidOrder: Order = {
  id: 'o1', ticketNumber: 42, customerName: 'María González',
  items: [
    { product: mockProduct1, quantity: 2 },
    { product: mockProduct2, quantity: 1 },
  ],
  totalUSD: 21.00, totalLocal: 756.00,
  status: 'completed', paymentStatus: 'paid',
  paymentMethod: 'efectivo_bs', paymentReference: undefined,
  paidAt: '2024-01-15T11:30:00.000Z',
  createdAt: '2024-01-15T10:30:00.000Z',
};

const mockPendingOrder: Order = {
  id: 'o2', ticketNumber: 43, customerName: 'Juan Pérez',
  items: [
    { product: mockProduct1, quantity: 1 },
  ],
  totalUSD: 8.50, totalLocal: 306.00,
  status: 'pending', paymentStatus: 'pending',
  createdAt: '2024-01-15T10:30:00.000Z',
};

function renderModal(
  order: Order | null,
  open: boolean,
  onOpenChange = vi.fn(),
  onPaymentComplete = vi.fn(),
) {
  return render(
    <MemoryRouter>
      <OrderDetailModal
        order={order}
        open={open}
        onOpenChange={onOpenChange}
        onPaymentComplete={onPaymentComplete}
      />
    </MemoryRouter>
  );
}

function createMockApp(stateOverrides: Record<string, any> = {}) {
  return {
    state: {
      currentDay: { id: 'd1', date: '2024-01-15', exchangeRate: 36, isOpen: true, openedAt: '2024-01-15T08:00:00Z' },
      ...stateOverrides,
    },
    registerPayment: vi.fn(),
  };
}

describe('OrderDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RED: test renders nothing when order is null
  it('renders nothing when order is null', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    const { container } = renderModal(null, true);
    expect(container.innerHTML).toBe('');
  });

  // RED: test renders nothing when open is false
  it('renders nothing when open is false (even with an order)', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    const { container } = renderModal(mockPaidOrder, false);
    expect(container.innerHTML).toBe('');
  });

  // RED: test shows order header details
  it('shows ticket number, customer name, and date', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPaidOrder, true);

    expect(screen.getByText('Ticket #42')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    // Date should be formatted — check both createdAt and paidAt dates are shown
    expect(screen.getAllByText(/ene\./).length).toBe(2);
  });

  // RED: test shows order items
  it('shows all order items with quantities and subtotals', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPaidOrder, true);

    // 2 × Hamburguesa Clásica = $17.00
    expect(screen.getByText(/2\s*×/)).toBeInTheDocument();
    expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument();
    // 1 × Papa Frita = $4.00
    expect(screen.getByText(/1\s*×/)).toBeInTheDocument();
    expect(screen.getByText('Papa Frita')).toBeInTheDocument();
  });

  // RED: test shows totals
  it('shows total USD and total local (Bs)', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPaidOrder, true);

    expect(screen.getByText('$21.00')).toBeInTheDocument();
    expect(screen.getByText(/756\.00\s*Bs/)).toBeInTheDocument();
  });

  // RED: test shows paid status for paid orders
  it('shows payment method label and paid date when order is paid', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPaidOrder, true);

    expect(screen.getByText('Efectivo Bs')).toBeInTheDocument();
    expect(screen.getByText(/Pagado/)).toBeInTheDocument();
  });

  // RED: test shows payment form for pending orders
  it('shows PaymentMethodSelector and Confirmar Pago for pending orders', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPendingOrder, true);

    // Payment method buttons should show
    expect(screen.getByText('Pagomóvil')).toBeInTheDocument();
    expect(screen.getByText('Efectivo Bs')).toBeInTheDocument();
    expect(screen.getByText('Efectivo $')).toBeInTheDocument();
    expect(screen.getByText('Punto')).toBeInTheDocument();
    // Confirm button
    expect(screen.getByText('Confirmar Pago')).toBeInTheDocument();
  });

  // RED: test shows reference input when pagomovil is selected
  it('shows reference input when pagomovil is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPendingOrder, true);

    // Click pagomovil
    await user.click(screen.getByText('Pagomóvil'));

    // Reference input should appear
    expect(screen.getByPlaceholderText('Ej: 1234')).toBeInTheDocument();
  });

  // RED: test payment flow calls registerPayment
  it('calls registerPayment when confirming payment', async () => {
    const registerPayment = vi.fn();
    const onPaymentComplete = vi.fn();
    const onOpenChange = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      ...createMockApp(),
      registerPayment,
    });

    const user = userEvent.setup();
    renderModal(mockPendingOrder, true, onOpenChange, onPaymentComplete);

    // Select pagomovil and enter reference
    await user.click(screen.getByText('Pagomóvil'));
    const refInput = screen.getByPlaceholderText('Ej: 1234');
    await user.type(refInput, '1234');

    // Click confirm
    await user.click(screen.getByText('Confirmar Pago'));

    expect(registerPayment).toHaveBeenCalledWith('o2', 'pagomovil', '1234');
    expect(onPaymentComplete).toHaveBeenCalled();
  });

  // RED: test shows revalued local amount when exchange rate differs
  it('shows revalued local amount when exchange rate differs from stored rate', () => {
    // Stored totalLocal = 306.00 (rate 36), current rate = 50
    vi.mocked(useApp).mockReturnValue({
      state: {
        currentDay: { id: 'd1', date: '2024-01-15', exchangeRate: 50, isOpen: true, openedAt: '2024-01-15T08:00:00Z' },
      },
      registerPayment: vi.fn(),
    });
    renderModal(mockPendingOrder, true);

    // 8.50 * 50 = 425.00
    expect(screen.getByText(/↻/)).toBeInTheDocument();
    expect(screen.getByText(/425\.00\s*Bs/)).toBeInTheDocument();
  });

  // RED: test does not show revalued amount when exchange rate is the same
  it('does not show revalued amount when exchange rate matches stored rate', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPendingOrder, true);

    expect(screen.queryByText(/↻/)).not.toBeInTheDocument();
  });

  // RED: test "Editar Pedido" navigates correctly
  it('navigates to edit page when Editar Pedido is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPendingOrder, true);

    await user.click(screen.getByText('Editar Pedido'));

    expect(mockNavigate).toHaveBeenCalledWith('/nuevo-pedido?edit=o2');
  });

  // RED: test "Cerrar" button triggers onOpenChange(false)
  it('calls onOpenChange(false) when Cerrar is clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPendingOrder, true, onOpenChange);

    await user.click(screen.getByText('Cerrar'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // RED: test shows weight format for weight products
  it('shows kg format for weight-based products', () => {
    const mockWeightProduct = {
      id: 'p3', name: 'Carne', price: 15.00,
      category: 'Comida', soldByWeight: true,
    };
    const weightOrder: Order = {
      id: 'o3', ticketNumber: 44, customerName: 'Ana López',
      items: [{ product: mockWeightProduct, quantity: 0.5 }],
      totalUSD: 7.50, totalLocal: 270.00,
      status: 'completed', paymentStatus: 'paid',
      paymentMethod: 'efectivo_bs',
      createdAt: '2024-01-15T10:30:00.000Z',
    };

    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(weightOrder, true);

    expect(screen.getByText(/0\.50 kg/)).toBeInTheDocument();
    expect(screen.getByText('Carne')).toBeInTheDocument();
  });

  // RED: test shows pagomovil reference text for paid pagomovil orders
  it('shows payment reference for pagomovil paid orders', () => {
    const pagomovilOrder: Order = {
      ...mockPaidOrder,
      paymentMethod: 'pagomovil',
      paymentReference: '9876',
    };
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(pagomovilOrder, true);

    expect(screen.getByText('Pago Móvil')).toBeInTheDocument();
    expect(screen.getByText(/9876/)).toBeInTheDocument();
  });

  // RED: test payment validation — requires reference for pagomovil
  it('does not call registerPayment when confirming pagomovil without reference', async () => {
    const registerPayment = vi.fn();
    vi.mocked(useApp).mockReturnValue({
      ...createMockApp(),
      registerPayment,
    });

    const user = userEvent.setup();
    renderModal(mockPendingOrder, true);

    // Select pagomovil but don't enter reference
    await user.click(screen.getByText('Pagomóvil'));

    // Click confirm without reference
    await user.click(screen.getByText('Confirmar Pago'));

    expect(registerPayment).not.toHaveBeenCalled();
  });

  // RED: test shows pending status label for unpaid orders
  it('shows "Sin pagar" for pending payment orders', () => {
    vi.mocked(useApp).mockReturnValue(createMockApp());
    renderModal(mockPendingOrder, true);

    expect(screen.getByText('Sin pagar')).toBeInTheDocument();
  });
});
