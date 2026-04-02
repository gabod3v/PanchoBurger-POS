export interface Product {
  id: string;
  name: string;
  price: number; // USD
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'ready' | 'completed';

export interface Order {
  id: string;
  ticketNumber: number;
  customerName: string;
  items: OrderItem[];
  totalUSD: number;
  totalLocal: number;
  status: OrderStatus;
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

export interface AppState {
  products: Product[];
  orders: Order[];
  currentDay: DaySession | null;
  nextTicket: number;
}
