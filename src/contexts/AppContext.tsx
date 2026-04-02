import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, Order, DaySession, AppState, OrderItem, OrderStatus } from '@/types';

const STORAGE_KEY = 'pos-fast-food';

const initialState: AppState = {
  products: [],
  orders: [],
  currentDay: null,
  nextTicket: 1,
};

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'OPEN_DAY'; payload: DaySession }
  | { type: 'CLOSE_DAY' }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }
  | { type: 'RESET_DAY' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
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
    case 'RESET_DAY':
      return { ...state, currentDay: null, orders: [], nextTicket: 1 };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  addProduct: (name: string, price: number) => void;
  updateProduct: (id: string, name: string, price: number) => void;
  deleteProduct: (id: string) => void;
  openDay: (exchangeRate: number) => void;
  closeDay: () => void;
  addOrder: (customerName: string, items: OrderItem[]) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  resetDay: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addProduct = (name: string, price: number) => {
    dispatch({ type: 'ADD_PRODUCT', payload: { id: crypto.randomUUID(), name, price } });
  };

  const updateProduct = (id: string, name: string, price: number) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id, name, price } });
  };

  const deleteProduct = (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const openDay = (exchangeRate: number) => {
    dispatch({
      type: 'OPEN_DAY',
      payload: {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('es-VE'),
        exchangeRate,
        isOpen: true,
        openedAt: new Date().toISOString(),
      },
    });
  };

  const closeDay = () => dispatch({ type: 'CLOSE_DAY' });

  const addOrder = (customerName: string, items: OrderItem[]) => {
    const totalUSD = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const totalLocal = totalUSD * (state.currentDay?.exchangeRate ?? 1);
    dispatch({
      type: 'ADD_ORDER',
      payload: {
        id: crypto.randomUUID(),
        ticketNumber: state.nextTicket,
        customerName,
        items,
        totalUSD,
        totalLocal,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status } });
  };

  const resetDay = () => dispatch({ type: 'RESET_DAY' });

  return (
    <AppContext.Provider value={{ state, addProduct, updateProduct, deleteProduct, openDay, closeDay, addOrder, updateOrderStatus, resetDay }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
