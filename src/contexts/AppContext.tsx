import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, Order, DaySession, AppState, OrderItem, OrderStatus, SyncStatus, PendingAction, PaymentMethod, PaymentStatus } from '@/types';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'pancho_burger_state';

const loadSavedState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...parsed, syncStatus: 'online' }; // Assume online initially
    } catch (e) {
      console.error('Error loading saved state', e);
    }
  }
  return {
    products: [],
    categories: [],
    sessions: [],
    orders: [],
    currentDay: null,
    nextTicket: 1,
    syncStatus: 'online',
    pendingActions: []
  };
};

const initialState: AppState = loadSavedState();

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'OPEN_DAY'; payload: DaySession }
  | { type: 'CLOSE_DAY' }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }
  | { type: 'REGISTER_PAYMENT'; payload: { id: string; paymentMethod: PaymentMethod; paymentReference?: string; totalLocal: number; paidAt: string } }
  | { type: 'RESET_DAY' }
  | { type: 'ADD_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'LOAD_SESSIONS'; payload: DaySession[] }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'QUEUE_ACTION'; payload: PendingAction }
  | { type: 'CLEAR_PENDING'; payload: string }
  | { type: 'DELETE_ORDER'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload, syncStatus: state.syncStatus };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'OPEN_DAY':
      return { ...state, currentDay: action.payload, nextTicket: 1, orders: [] };
    case 'CLOSE_DAY':
      return state.currentDay
        ? { ...state, currentDay: { ...state.currentDay, isOpen: false, closedAt: new Date().toISOString() } }
        : state;
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload], nextTicket: state.nextTicket + 1 };
    case 'UPDATE_ORDER_STATUS':
      return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? { ...o, status: action.payload.status } : o) };
    case 'REGISTER_PAYMENT':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.id
            ? {
                ...o,
                paymentStatus: 'paid' as PaymentStatus,
                paymentMethod: action.payload.paymentMethod,
                paymentReference: action.payload.paymentReference,
                totalLocal: action.payload.totalLocal,
                paidAt: action.payload.paidAt
              }
            : o
        )
      };
    case 'RESET_DAY':
      return { ...state, currentDay: null, orders: [], nextTicket: 1 };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'LOAD_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'QUEUE_ACTION':
      return { ...state, pendingActions: [...state.pendingActions, action.payload] };
    case 'CLEAR_PENDING':
      return { ...state, pendingActions: state.pendingActions.filter(a => a.id !== action.payload) };
    case 'DELETE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  addProduct: (name: string, price: number, category: string, image_url?: string, price_bs?: number, is_price_in_bs?: boolean) => void;
  updateProduct: (id: string, name: string, price: number, category: string, image_url?: string, price_bs?: number, is_price_in_bs?: boolean) => void;
  deleteProduct: (id: string) => void;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  openDay: (exchangeRate: number, customBsPrices?: Record<string, number>) => void;
  closeDay: () => void;
  addOrder: (customerName: string, items: OrderItem[], sessionId?: string, ticketNumber?: number, paymentStatus?: PaymentStatus, paymentMethod?: PaymentMethod, paymentReference?: string) => void;
  deleteOrder: (id: string, sessionId?: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  registerPayment: (orderId: string, paymentMethod: PaymentMethod, paymentReference?: string) => void;
  resetDay: () => void;
  fetchOrdersBySession: (sessionId: string) => Promise<Order[]>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persistence: Save state on every change
  useEffect(() => {
    const { syncStatus, ...persistedState } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
  }, [state]);

  // Sync: Process pending queue when online
  useEffect(() => {
    const processQueue = async () => {
      if (state.syncStatus !== 'online' || state.pendingActions.length === 0) return;
      
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
      
      const actions = [...state.pendingActions].sort((a, b) => a.timestamp - b.timestamp);
      
      for (const action of actions) {
        try {
          const fCol = action.filterColumn || 'id';
          const fVal = action.filterValue ?? action.data.id;

          if (action.type === 'INSERT') {
            await supabase.from(action.table).insert([action.data]);
          } else if (action.type === 'UPDATE') {
            await supabase.from(action.table).update(action.data).eq(fCol, fVal);
          } else if (action.type === 'DELETE') {
            await supabase.from(action.table).delete().eq(fCol, fVal);
          }
          dispatch({ type: 'CLEAR_PENDING', payload: action.id });
        } catch (e) {
          console.error('Failed to sync action', action, e);
          break; // Stop processing queue if an action fails
        }
      }
      
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'online' });
    };

    const handleStatusChange = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: navigator.onLine ? 'online' : 'offline' });
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    processQueue();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [state.syncStatus, state.pendingActions]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: products } = await supabase.from('productos').select('*');
        const { data: categories } = await supabase.from('categorias').select('*');
        const { data: sessions = [] } = await supabase.from('sesiones_dia').select('*').order('opened_at', { ascending: false });
        
        const openSession = sessions?.find(s => s.is_open) || null;

        let orders: Order[] = [];
        if (openSession) {
          const { data: ordersData } = await supabase.from('pedidos').select(`
            *,
            items:order_items(quantity, product:products(*))
          `).eq('day_session_id', openSession.id);

          if (ordersData) {
            orders = ordersData.map(o => ({
              id: o.id,
              ticketNumber: o.ticket_number,
              customerName: o.customer_name,
              totalUSD: o.total_usd,
              totalLocal: o.total_local,
              status: o.status,
              paymentStatus: o.payment_status || 'pending',
              paymentMethod: o.payment_method,
              paymentReference: o.payment_reference,
              paidAt: o.paid_at,
              createdAt: o.created_at,
              items: o.items.map((i: any) => ({
                quantity: i.quantity,
                product: {
                  id: i.product.id,
                  name: i.product.name,
                  price: parseFloat(i.product.price),
                  category: i.product.category,
                  image_url: i.product.image_url
                }
              }))
            }));
          }
        }

        const nextTicket = orders.length > 0 ? Math.max(...orders.map(o => o.ticketNumber)) + 1 : 1;
        const mappedProducts = products?.map(p => ({
          id: p.id, 
          name: p.name, 
          price: parseFloat(p.price), 
          price_bs: p.price_bs ? parseFloat(p.price_bs) : 0,
          is_price_in_bs: p.is_price_in_bs,
          category: p.category, 
          image_url: p.image_url
        })) || [];

        dispatch({
          type: 'LOAD_STATE',
          payload: {
            products: mappedProducts,
            categories: categories || [],
            sessions: (sessions || []).map(s => ({
              id: s.id,
              date: s.date,
              exchangeRate: parseFloat(s.exchange_rate),
              isOpen: s.is_open,
              openedAt: s.opened_at,
              closedAt: s.closed_at
            })),
            currentDay: openSession ? {
              id: openSession.id,
              date: openSession.date,
              exchangeRate: parseFloat(openSession.exchange_rate),
              isOpen: openSession.is_open,
              openedAt: openSession.opened_at,
            } : null,
            orders,
            nextTicket,
            syncStatus: navigator.onLine ? 'online' : 'offline',
            pendingActions: state.pendingActions
          }
        });
      } catch (e) {
        console.warn('Could not load data from Supabase, using local cache', e);
      }
    };

    loadData();
  }, []);

  const performMutation = async (type: 'INSERT' | 'UPDATE' | 'DELETE', table: string, data: any, filterColumn: string = 'id', filterValue?: any) => {
    const fVal = filterValue ?? data.id;
    try {
      if (type === 'INSERT') await supabase.from(table).insert([data]);
      else if (type === 'UPDATE') await supabase.from(table).update(data).eq(filterColumn, fVal);
      else if (type === 'DELETE') await supabase.from(table).delete().eq(filterColumn, fVal);
    } catch (e) {
      console.warn(`Mutation failed, queueing for later: ${table}`, e);
      dispatch({
        type: 'QUEUE_ACTION',
        payload: { 
          id: crypto.randomUUID(), 
          type, 
          table, 
          data, 
          filterColumn, 
          filterValue: fVal, 
          timestamp: Date.now() 
        }
      });
    }
  };

  const addProduct = async (name: string, price: number, category: string, image_url?: string, price_bs: number = 0, is_price_in_bs: boolean = false) => {
    const newProduct: Product = { id: crypto.randomUUID(), name, price, category, image_url, price_bs, is_price_in_bs };
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    await performMutation('INSERT', 'productos', {
      id: newProduct.id,
      name,
      price,
      category,
      image_url,
      price_bs,
      is_price_in_bs
    });
  };

  const updateProduct = async (id: string, name: string, price: number, category: string, image_url?: string, price_bs: number = 0, is_price_in_bs: boolean = false) => {
    const updated: Product = { id, name, price, category, image_url, price_bs, is_price_in_bs };
    dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
    await performMutation('UPDATE', 'productos', {
      id,
      name,
      price,
      category,
      image_url,
      price_bs,
      is_price_in_bs
    });
  };

  const deleteProduct = async (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
    await performMutation('DELETE', 'productos', { id });
  };

  const addCategory = async (name: string) => {
    const newCategory = { id: crypto.randomUUID(), name };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    await performMutation('INSERT', 'categorias', newCategory);
  };

  const updateCategory = async (id: string, name: string) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, name } });
    await performMutation('UPDATE', 'categorias', { id, name });
  };

  const deleteCategory = async (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    await performMutation('DELETE', 'categorias', { id });
  };

  const openDay = async (exchangeRate: number, customBsPrices?: Record<string, number>) => {
    const id = crypto.randomUUID();
    const date = new Date().toLocaleDateString('es-VE');
    const newDay: DaySession = {
      id,
      date,
      exchangeRate,
      isOpen: true,
      openedAt: new Date().toISOString(),
    };
    
    // Update USD prices for products priced in Bs
    const bsProducts = state.products.filter(p => p.is_price_in_bs);
    for (const p of bsProducts) {
      const currentBsPrice = customBsPrices?.[p.id] ?? (p.price_bs || 0);
      const newPriceUSD = currentBsPrice / exchangeRate;
      await updateProduct(p.id, p.name, newPriceUSD, p.category, p.image_url, currentBsPrice, true);
    }

    dispatch({ type: 'OPEN_DAY', payload: newDay });
    await performMutation('INSERT', 'sesiones_dia', {
      id: newDay.id,
      date: newDay.date,
      exchange_rate: newDay.exchangeRate,
      is_open: true,
      opened_at: newDay.openedAt
    });
  };

  const closeDay = async () => {
    if (!state.currentDay) return;
    const closedAt = new Date().toISOString();
    const sessionId = state.currentDay.id;
    dispatch({ type: 'CLOSE_DAY' });
    await performMutation('UPDATE', 'sesiones_dia', { id: sessionId, is_open: false, closed_at: closedAt });
    
    // Refresh sessions list after closing
    const { data: sessions } = await supabase.from('sesiones_dia').select('*').order('opened_at', { ascending: false });
    if (sessions) {
      dispatch({ type: 'LOAD_SESSIONS', payload: sessions.map(s => ({
        id: s.id,
        date: s.date,
        exchangeRate: parseFloat(s.exchange_rate),
        isOpen: s.is_open,
        openedAt: s.opened_at,
        closedAt: s.closed_at
      })) });
    }
  };

  const addOrder = async (customerName: string, items: OrderItem[], sessionId?: string, ticketNumber?: number, paymentStatus: PaymentStatus = 'pending', paymentMethod?: PaymentMethod, paymentReference?: string) => {
    const targetSessionId = sessionId || state.currentDay?.id;
    const session = state.sessions.find(s => s.id === targetSessionId) || state.currentDay;
    if (!targetSessionId || !session) return;

    const totalUSD = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const totalLocal = totalUSD * session.exchangeRate;
    const isPaid = paymentStatus === 'paid';
    const newOrder = {
      id: crypto.randomUUID(),
      ticketNumber: ticketNumber || (state.currentDay?.id === targetSessionId ? state.nextTicket : 999),
      customerName,
      items,
      totalUSD,
      totalLocal,
      status: 'completed' as OrderStatus,
      paymentStatus,
      paymentMethod: isPaid ? paymentMethod : undefined,
      paymentReference: isPaid && paymentMethod === 'pagomovil' ? paymentReference : undefined,
      paidAt: isPaid ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };
    
    if (state.currentDay?.id === targetSessionId) {
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
    }

    // 1. Queue Order
    await performMutation('INSERT', 'pedidos', {
      id: newOrder.id,
      day_session_id: targetSessionId,
      ticket_number: newOrder.ticketNumber,
      customer_name: newOrder.customerName,
      total_usd: newOrder.totalUSD,
      total_local: newOrder.totalLocal,
      status: newOrder.status,
      payment_status: newOrder.paymentStatus,
      payment_method: newOrder.paymentMethod,
      payment_reference: newOrder.paymentReference,
      paid_at: newOrder.paidAt,
      created_at: newOrder.createdAt
    });

    // 2. Queue Items
    for (const item of items) {
      await performMutation('INSERT', 'order_items', {
        order_id: newOrder.id,
        product_id: item.product.id,
        quantity: item.quantity
      });
    }
  };

  const deleteOrder = async (id: string, sessionId?: string) => {
    if (state.currentDay?.id === (sessionId || state.currentDay?.id)) {
      dispatch({ type: 'DELETE_ORDER', payload: id });
    }
    
    // First delete items, then order (to handle constraints manually in queue if needed)
    await performMutation('DELETE', 'order_items', { order_id: id }, 'order_id', id);
    await performMutation('DELETE', 'pedidos', { id });
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status } });
    await performMutation('UPDATE', 'pedidos', { id, status });
  };

  const registerPayment = async (orderId: string, paymentMethod: PaymentMethod, paymentReference?: string) => {
    const currentDay = state.currentDay;
    const order = state.orders.find(o => o.id === orderId);
    if (!order || !currentDay) return;

    // Recalcular totalLocal con la tasa del día actual
    const newTotalLocal = order.totalUSD * currentDay.exchangeRate;
    const paidAt = new Date().toISOString();

    // Actualizar estado local
    dispatch({
      type: 'REGISTER_PAYMENT',
      payload: {
        id: orderId,
        paymentMethod,
        paymentReference: paymentMethod === 'pagomovil' ? paymentReference : undefined,
        totalLocal: newTotalLocal,
        paidAt
      }
    });
    
    // Actualizar en Supabase
    await performMutation('UPDATE', 'pedidos', {
      id: orderId,
      payment_status: 'paid',
      payment_method: paymentMethod,
      payment_reference: paymentMethod === 'pagomovil' ? paymentReference : null,
      total_local: newTotalLocal,
      paid_at: paidAt
    });
  };

  const resetDay = () => dispatch({ type: 'RESET_DAY' });

  const fetchOrdersBySession = async (sessionId: string): Promise<Order[]> => {
    if (!supabase) return [];

    const { data: ordersData } = await supabase.from('pedidos').select(`
      *,
      items:order_items(quantity, product:products(*))
    `).eq('day_session_id', sessionId);

    if (!ordersData) return [];

    return ordersData.map(o => ({
      id: o.id,
      ticketNumber: o.ticket_number,
      customerName: o.customer_name,
      totalUSD: parseFloat(o.total_usd),
      totalLocal: parseFloat(o.total_local),
      status: o.status,
      paymentStatus: o.payment_status || 'pending',
      paymentMethod: o.payment_method,
      paymentReference: o.payment_reference,
      paidAt: o.paid_at,
      createdAt: o.created_at,
      items: o.items.map((i: any) => ({
        quantity: i.quantity,
        product: {
          id: i.product.id,
          name: i.product.name,
          price: parseFloat(i.product.price),
          category: i.product.category,
          image_url: i.product.image_url
        }
      }))
    }));
  };

  return (
    <AppContext.Provider value={{
      state,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      openDay,
      closeDay,
      addOrder,
      deleteOrder,
      updateOrderStatus,
      registerPayment,
      resetDay,
      fetchOrdersBySession
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
