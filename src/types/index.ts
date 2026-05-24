export interface Product {
  id: string;
  name: string;
  price: number; // Final USD price (calculated if is_price_in_bs is true)
  price_bs?: number; // Fixed Bs price
  is_price_in_bs?: boolean;
  soldByWeight?: boolean; // true = sold per kilo (quantity = kgs, price = price per kg)
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
  locationId?: string;
}

export interface DaySession {
  id: string;
  date: string;
  exchangeRate: number;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  locationId?: string;
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

export type UserRole = 'owner' | 'manager' | 'cashier' | 'kitchen_staff' | 'super_admin';

export type BranchRole = 'owner' | 'admin' | 'staff';

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  document_id?: string;
  phone?: string;
  rif?: string;
  created_at: string;
  updated_at: string;
}

export interface BranchPermission {
  id: string;
  user_id: string;
  ubicacion_id: string;
  role: BranchRole;
  is_active: boolean;
  created_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string | null;
  accent_color?: string | null;
  sidebar_color?: string | null;
  bank_name?: string | null;
  bank_phone?: string | null;
  bank_rif?: string | null;
  bank_beneficiary?: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'trial' | 'pending_verification';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  is_active?: boolean;
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
