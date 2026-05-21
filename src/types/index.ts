export interface Product {
  id: string;
  name: string;
  price: number; // Final USD price (calculated if is_price_in_bs is true)
  price_bs?: number; // Fixed Bs price
  is_price_in_bs?: boolean;
  category: string;
  image_url?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'ready' | 'completed';

export type PaymentStatus = 'pending' | 'paid';

export type PaymentMethod = 'pagomovil' | 'efectivo_bs' | 'efectivo_usd' | 'punto';

export interface Order {
  id: string;
  ticketNumber: number;
  customerName: string;
  items: OrderItem[];
  totalUSD: number;
  totalLocal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface DaySession {
  id: string;
  date: string;
  exchangeRate: number;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
}

export type SyncStatus = 'online' | 'offline' | 'syncing';

export interface PendingAction {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  filterColumn?: string;
  filterValue?: any;
  timestamp: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface AppState {
  products: Product[];
  categories: Category[];
  sessions: DaySession[];
  orders: Order[];
  currentDay: DaySession | null;
  nextTicket: number;
  syncStatus: SyncStatus;
  pendingActions: PendingAction[];
}
