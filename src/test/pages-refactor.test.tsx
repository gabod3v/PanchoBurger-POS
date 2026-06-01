import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { AppState, DaySession, Product, Category, Order } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useLocation: () => ({ pathname: '/test' }),
  };
});

vi.mock('@/contexts/AppContext', async () => {
  const actual = await vi.importActual('@/contexts/AppContext');
  return {
    ...actual,
    useApp: vi.fn(),
  };
});

const mockProduct: Product = {
  id: '1', name: 'Hamburguesa', price: 10,
  category: 'Comida', soldByWeight: false,
};

const mockProductWeight: Product = {
  id: '2', name: 'Carne', price: 15,
  category: 'Comida', soldByWeight: true,
};

const mockCategories: Category[] = [
  { id: '1', name: 'Comida' },
  { id: '2', name: 'Bebidas' },
];

const mockDay: DaySession = {
  id: '1', date: '2024-01-15', exchangeRate: 36,
  isOpen: true, openedAt: '2024-01-15T08:00:00Z',
};

const baseState: AppState = {
  products: [mockProduct, mockProductWeight],
  categories: mockCategories,
  sessions: [],
  orders: [],
  currentDay: mockDay,
  nextTicket: 1,
  syncStatus: 'online',
  pendingActions: [],
};

function createMockApp(stateOverrides: Partial<AppState> = {}) {
  const state = { ...baseState, ...stateOverrides };
  return {
    state,
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    openDay: vi.fn(),
    closeDay: vi.fn(),
    addOrder: vi.fn(),
    deleteOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    registerPayment: vi.fn(),
    resetDay: vi.fn(),
    fetchOrdersBySession: vi.fn().mockResolvedValue([]),
  };
}

function renderWithRouter(ui: React.ReactElement, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  );
}

describe('Index (Dashboard) page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title and current day info when caja is open', async () => {
    const mockApp = createMockApp({
      currentDay: { ...mockDay, isOpen: true },
      orders: [],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Dashboard = (await import('@/pages/Index')).default;
    renderWithRouter(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Caja abierta/)).toBeInTheDocument();
  });

  it('renders stat labels for pending, ready, completed orders', async () => {
    const mockOrder: Order = {
      id: 'o1', ticketNumber: 1, customerName: 'A',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 360,
      status: 'pending', paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
    };
    const mockApp = createMockApp({ orders: [mockOrder] });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Dashboard = (await import('@/pages/Index')).default;
    renderWithRouter(<Dashboard />);

    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Listos')).toBeInTheDocument();
    expect(screen.getByText('Completados')).toBeInTheDocument();
    expect(screen.getByText('Vendido (USD)')).toBeInTheDocument();
  });

  it('shows Caja cerrada message when caja is closed', async () => {
    const mockApp = createMockApp({
      currentDay: null,
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Dashboard = (await import('@/pages/Index')).default;
    renderWithRouter(<Dashboard />);

    expect(screen.getByText(/Caja cerrada/)).toBeInTheDocument();
  });

  it('renders quick action buttons', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Dashboard = (await import('@/pages/Index')).default;
    renderWithRouter(<Dashboard />);

    // "Nuevo Pedido" appears in header CTA AND quick actions since day is open
    expect(screen.getAllByText('Nuevo Pedido').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ver Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.getByText('Menú')).toBeInTheDocument();
    expect(screen.getByText('Resumen del Día')).toBeInTheDocument();
  });
});

describe('NewOrder page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order form with customer name input', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const NewOrder = (await import('@/pages/NewOrder')).default;
    renderWithRouter(<NewOrder />);

    expect(screen.getByPlaceholderText('Nombre del cliente')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });

  it('renders payment method section with willPayNow enabled', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const NewOrder = (await import('@/pages/NewOrder')).default;
    renderWithRouter(<NewOrder />);

    expect(screen.getByText('El cliente paga ahora')).toBeInTheDocument();
    expect(screen.getByText('Método de Pago')).toBeInTheDocument();
  });

  it('renders all 4 payment methods', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const NewOrder = (await import('@/pages/NewOrder')).default;
    renderWithRouter(<NewOrder />);

    expect(screen.getByText('Pagomóvil')).toBeInTheDocument();
    expect(screen.getByText('Efectivo Bs')).toBeInTheDocument();
    expect(screen.getByText('Efectivo $')).toBeInTheDocument();
    expect(screen.getByText('Punto')).toBeInTheDocument();
  });

  it('shows Caja Cerrada when day is not open', async () => {
    const mockApp = createMockApp({ currentDay: null });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const NewOrder = (await import('@/pages/NewOrder')).default;
    renderWithRouter(<NewOrder />);

    expect(screen.getByText('Caja Cerrada')).toBeInTheDocument();
  });
});

describe('DaySummary page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders day summary with title', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const DaySummary = (await import('@/pages/DaySummary')).default;
    renderWithRouter(<DaySummary />);

    expect(screen.getByText('Resumen del Día')).toBeInTheDocument();
  });

  it('renders stat labels for completed orders', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const DaySummary = (await import('@/pages/DaySummary')).default;
    renderWithRouter(<DaySummary />);

    expect(screen.getByText('Pedidos completados')).toBeInTheDocument();
    expect(screen.getByText('Total USD')).toBeInTheDocument();
    expect(screen.getByText('Total Bs')).toBeInTheDocument();
  });

  it('renders payment breakdown section', async () => {
    const mockApp = createMockApp({
      orders: [
        {
          id: 'o1', ticketNumber: 1, customerName: 'Juan',
          items: [{ product: mockProduct, quantity: 2 }],
          totalUSD: 20, totalLocal: 720,
          status: 'completed', paymentStatus: 'paid',
          paymentMethod: 'efectivo_bs',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const DaySummary = (await import('@/pages/DaySummary')).default;
    renderWithRouter(<DaySummary />);

    expect(screen.getByText('Ingresos por Método (USD)')).toBeInTheDocument();
    expect(screen.getByText('Pendientes por Cobrar')).toBeInTheDocument();
    expect(screen.getByText('Detalle de Ventas')).toBeInTheDocument();
  });
});

describe('KitchenDisplay page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders kitchen display title', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const KitchenDisplay = (await import('@/pages/KitchenDisplay')).default;
    renderWithRouter(<KitchenDisplay />);

    expect(screen.getByText('Pantalla de Cocina')).toBeInTheDocument();
  });

  it('renders status badges for pending orders', async () => {
    const mockApp = createMockApp({
      orders: [
        {
          id: 'o1', ticketNumber: 1, customerName: 'Juan',
          items: [{ product: mockProduct, quantity: 2 }],
          totalUSD: 20, totalLocal: 720,
          status: 'pending', paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'o2', ticketNumber: 2, customerName: 'Maria',
          items: [{ product: mockProduct, quantity: 1 }],
          totalUSD: 10, totalLocal: 360,
          status: 'ready', paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const KitchenDisplay = (await import('@/pages/KitchenDisplay')).default;
    renderWithRouter(<KitchenDisplay />);

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const KitchenDisplay = (await import('@/pages/KitchenDisplay')).default;
    renderWithRouter(<KitchenDisplay />);

    expect(screen.getByText('Sin pedidos en cocina')).toBeInTheDocument();
  });
});

describe('OrdersPage (Ticket Cards redesign)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOrderPending: Order = {
    id: 'o1', ticketNumber: 42, customerName: 'María González',
    items: [
      { product: mockProduct, quantity: 2 },
      { product: mockProductWeight, quantity: 0.5 },
    ],
    totalUSD: 27.5, totalLocal: 990,
    status: 'pending', paymentStatus: 'pending',
    createdAt: new Date('2024-01-15T10:30:00').toISOString(),
  };

  const mockOrderReady: Order = {
    id: 'o2', ticketNumber: 43, customerName: 'Juan Pérez',
    items: [{ product: mockProduct, quantity: 1 }],
    totalUSD: 10, totalLocal: 360,
    status: 'ready', paymentStatus: 'paid',
    paymentMethod: 'pagomovil', paymentReference: '4321',
    createdAt: new Date('2024-01-15T11:00:00').toISOString(),
  };

  const mockOrderCompleted: Order = {
    id: 'o3', ticketNumber: 44, customerName: 'Ana López',
    items: [{ product: mockProduct, quantity: 3 }],
    totalUSD: 30, totalLocal: 1080,
    status: 'completed', paymentStatus: 'paid',
    paymentMethod: 'efectivo_bs',
    createdAt: new Date('2024-01-15T12:00:00').toISOString(),
  };

  it('shows empty state when no orders', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Sin pedidos')).toBeInTheDocument();
  });

  it('renders page title', async () => {
    const mockApp = createMockApp({ orders: [mockOrderPending] });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Pedidos')).toBeInTheDocument();
  });

  it('renders active and completed order sections', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending, mockOrderCompleted],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText(/En curso/)).toBeInTheDocument();
    expect(screen.getByText(/Completados/)).toBeInTheDocument();
  });

  it('renders ticket numbers, customer names, and status badges for orders', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending, mockOrderReady],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('#43')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Listo')).toBeInTheDocument();
  });

  it('renders order items with quantities', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
    expect(screen.getByText('Carne')).toBeInTheDocument();
    // Weight product shows kg in format
    expect(screen.getByText(/0.50/)).toBeInTheDocument();
  });

  it('renders total USD prominently', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('$27.50')).toBeInTheDocument();
    expect(screen.getByText(/990\.00\s*Bs/)).toBeInTheDocument();
  });

  it('renders payment info for paid orders', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderReady],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Pagomóvil')).toBeInTheDocument();
    expect(screen.getByText(/Ref:/)).toBeInTheDocument();
  });

  it('shows unpaid badge for pending payment orders', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Sin pagar')).toBeInTheDocument();
  });

  it('edit button navigates to /nuevo-pedido?edit={id}', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    const editBtn = screen.getByText('Editar');
    editBtn.click();

    expect(mockNavigate).toHaveBeenCalledWith('/nuevo-pedido?edit=o1');
  });

  it('delete button triggers confirmation', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    window.confirm = vi.fn().mockReturnValue(false);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    const deleteBtn = screen.getByTitle('Eliminar');
    deleteBtn.click();

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApp.deleteOrder).not.toHaveBeenCalled();
  });

  it('delete button deletes on confirm', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    window.confirm = vi.fn().mockReturnValue(true);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    const deleteBtn = screen.getByTitle('Eliminar');
    deleteBtn.click();

    expect(mockApp.deleteOrder).toHaveBeenCalledWith('o1');
  });

  it('shows status advance button for active orders', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Marcar como Listo')).toBeInTheDocument();
  });

  it('shows Finalizar Entrega for ready orders', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderReady],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.getByText('Finalizar Entrega')).toBeInTheDocument();
  });

  it('does not show status advance button for completed orders', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderCompleted],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    expect(screen.queryByText('Marcar como Listo')).not.toBeInTheDocument();
    expect(screen.queryByText('Finalizar Entrega')).not.toBeInTheDocument();
  });

  it('renders print and edit action buttons', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    // Print button with text label
    expect(screen.getByText('Imprimir')).toBeInTheDocument();
    // Edit button with text label
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });

  it('renders total in Bs below USD total', async () => {
    const mockApp = createMockApp({
      orders: [mockOrderPending],
    });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const Orders = (await import('@/pages/OrdersPage')).default;
    renderWithRouter(<Orders />);

    // Both USD and Bs totals should be visible
    const usdTotal = screen.getByText('$27.50');
    const bsTotal = screen.getByText('990.00 Bs');
    expect(usdTotal).toBeInTheDocument();
    expect(bsTotal).toBeInTheDocument();
  });
});

describe('PendingPayments page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending payments title', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(screen.getByText('Pedidos Pendientes')).toBeInTheDocument();
  });

  it('shows empty state when no pending orders', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(screen.getByText('No hay pedidos pendientes')).toBeInTheDocument();
  });

  it('groups orders by session with date headers and rates', async () => {
    const session1: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: false, openedAt: '2024-05-26T08:00:00Z',
    };
    const session2: DaySession = {
      id: 's2', date: '2024-05-25', exchangeRate: 38,
      isOpen: false, openedAt: '2024-05-25T08:00:00Z',
    };
    const order1: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 400,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };
    const order2: Order = {
      id: 'o2', ticketNumber: 11, customerName: 'Maria',
      items: [{ product: mockProduct, quantity: 2 }],
      totalUSD: 20, totalLocal: 760,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-25T12:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session1, session2], currentDay: null });
    mockApp.fetchOrdersBySession = vi.fn()
      .mockResolvedValueOnce([order1])
      .mockResolvedValueOnce([order2]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(await screen.findByText('Ticket #10')).toBeInTheDocument();
    expect(screen.getByText('Ticket #11')).toBeInTheDocument();
    const tasaElements = screen.getAllByText(/Tasa/);
    expect(tasaElements).toHaveLength(2);
  });

  it('shows total Bs alongside USD total', async () => {
    const session: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: true, openedAt: '2024-05-26T08:00:00Z',
    };
    const order1: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 400,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };
    const order2: Order = {
      id: 'o2', ticketNumber: 11, customerName: 'Maria',
      items: [{ product: mockProduct, quantity: 2 }],
      totalUSD: 20, totalLocal: 800,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T12:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session], currentDay: session, orders: [order1, order2] });
    mockApp.fetchOrdersBySession = vi.fn().mockResolvedValue([]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(await screen.findByText(/\$30\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1\.200,00\s*Bs/)).toBeInTheDocument();
  });

  it('shows revaluation indicator when totalLocal differs from current rate', async () => {
    const session: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: true, openedAt: '2024-05-26T08:00:00Z',
    };
    // totalLocal=500 ≠ totalUSD*rate=400 → revalued
    const order: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 500,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session], currentDay: session, orders: [order] });
    mockApp.fetchOrdersBySession = vi.fn().mockResolvedValue([]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(await screen.findByText(/↻/)).toBeInTheDocument();
  });

  it('does not show revaluation indicator when totalLocal matches current rate', async () => {
    const session: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: true, openedAt: '2024-05-26T08:00:00Z',
    };
    // totalLocal=400 matches totalUSD*rate=10*40=400 → NOT revalued
    const order: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 400,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session], currentDay: session, orders: [order] });
    mockApp.fetchOrdersBySession = vi.fn().mockResolvedValue([]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(await screen.findByText('Ticket #10')).toBeInTheDocument();
    // Should NOT show ↻ indicator
    expect(screen.queryByText(/↻/)).not.toBeInTheDocument();
  });

  it('computes total Bs from stored totalLocal when no currentDay', async () => {
    const session: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: false, openedAt: '2024-05-26T08:00:00Z',
    };
    const order: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 350,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session], currentDay: null });
    mockApp.fetchOrdersBySession = vi.fn().mockResolvedValueOnce([order]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    // No currentDay → totalBs falls back to sum of totalLocal = 350
    expect(await screen.findByText(/Total:.*\$\d+\.\d+.*\|.*350,00\s*Bs/)).toBeInTheDocument();
  });

  it('shows items preview with single item (no "y X más")', async () => {
    const session: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: true, openedAt: '2024-05-26T08:00:00Z',
    };
    // Only 1 item — no "y X más" suffix
    const order: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [{ product: mockProduct, quantity: 1 }],
      totalUSD: 10, totalLocal: 400,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session], currentDay: session, orders: [order] });
    mockApp.fetchOrdersBySession = vi.fn().mockResolvedValue([]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(await screen.findByText(/Hamburguesa/)).toBeInTheDocument();
    expect(screen.queryByText(/más/)).not.toBeInTheDocument();
  });

  it('shows items preview with remaining count', async () => {
    const extraProduct: Product = {
      id: '3', name: 'Papas', price: 5,
      category: 'Comida', soldByWeight: false,
    };
    const extraProduct2: Product = {
      id: '4', name: 'Bebida', price: 3,
      category: 'Bebidas', soldByWeight: false,
    };
    const session: DaySession = {
      id: 's1', date: '2024-05-26', exchangeRate: 40,
      isOpen: true, openedAt: '2024-05-26T08:00:00Z',
    };
    const order: Order = {
      id: 'o1', ticketNumber: 10, customerName: 'Juan',
      items: [
        { product: mockProduct, quantity: 1 },
        { product: mockProductWeight, quantity: 0.5 },
        { product: extraProduct, quantity: 2 },
        { product: extraProduct2, quantity: 1 },
      ],
      totalUSD: 35.5, totalLocal: 1420,
      status: 'completed', paymentStatus: 'pending',
      createdAt: '2024-05-26T10:00:00Z',
    };

    const mockApp = createMockApp({ sessions: [session], currentDay: session, orders: [order] });
    mockApp.fetchOrdersBySession = vi.fn().mockResolvedValue([]);
    vi.mocked(useApp).mockReturnValue(mockApp);
    const PendingPayments = (await import('@/pages/PendingPayments')).default;
    renderWithRouter(<PendingPayments />);

    expect(await screen.findByText(/Hamburguesa/)).toBeInTheDocument();
    expect(screen.getByText(/Carne/)).toBeInTheDocument();
    expect(screen.getByText(/y 2 más/)).toBeInTheDocument();
  });
});

describe('CashRegister page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cash register title', async () => {
    const mockApp = createMockApp({ currentDay: null });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const CashRegister = (await import('@/pages/CashRegister')).default;
    renderWithRouter(<CashRegister />);

    expect(screen.getByText('Caja del Día')).toBeInTheDocument();
  });

  it('shows closed state when day is not open', async () => {
    const mockApp = createMockApp({ currentDay: null });
    vi.mocked(useApp).mockReturnValue(mockApp);
    const CashRegister = (await import('@/pages/CashRegister')).default;
    renderWithRouter(<CashRegister />);

    expect(screen.getByText('Caja Cerrada')).toBeInTheDocument();
  });

  it('shows active state when day is open', async () => {
    const mockApp = createMockApp();
    vi.mocked(useApp).mockReturnValue(mockApp);
    const CashRegister = (await import('@/pages/CashRegister')).default;
    renderWithRouter(<CashRegister />);

    expect(screen.getByText('Caja Activa')).toBeInTheDocument();
  });
});

describe('NotFound page', () => {
  it('renders 404 message', async () => {
    const NotFound = (await import('@/pages/NotFound')).default;
    renderWithRouter(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });
});
