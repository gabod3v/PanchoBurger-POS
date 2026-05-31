import { describe, it, expect } from 'vitest';
import type { AppState, Order } from '@/types';

// These imports will fail because reducer/Action are not exported yet — that's RED
import { reducer, Action } from '../AppContext';

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    ticketNumber: 1,
    customerName: 'Test',
    items: [],
    totalUSD: 100,
    totalLocal: 0,
    status: 'completed',
    paymentStatus: 'pending',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createBaseState(orders: Order[] = []): AppState {
  return {
    products: [],
    categories: [],
    sessions: [],
    orders,
    currentDay: null,
    nextTicket: 1,
    syncStatus: 'online',
    pendingActions: [],
  };
}

describe('AppContext reducer — REVALUE_PENDING_ORDERS', () => {
  it('recalculates totalLocal for all pending orders using the given rate', () => {
    const orders: Order[] = [
      createMockOrder({ id: 'o1', totalUSD: 100, totalLocal: 0, paymentStatus: 'pending' }),
      createMockOrder({ id: 'o2', totalUSD: 50, totalLocal: 500, paymentStatus: 'pending' }),
    ];
    const state = createBaseState(orders);
    const rate = 10;

    const nextState = reducer(state, { type: 'REVALUE_PENDING_ORDERS', payload: { rate } });

    expect(nextState.orders).toHaveLength(2);
    expect(nextState.orders[0].totalLocal).toBe(1000);   // 100 * 10
    expect(nextState.orders[1].totalLocal).toBe(500);    // 50 * 10
  });

  it('does not modify paid orders', () => {
    const orders: Order[] = [
      createMockOrder({ id: 'o1', totalUSD: 100, totalLocal: 800, paymentStatus: 'paid' }),
      createMockOrder({ id: 'o2', totalUSD: 50, totalLocal: 0, paymentStatus: 'pending' }),
    ];
    const state = createBaseState(orders);
    const rate = 10;

    const nextState = reducer(state, { type: 'REVALUE_PENDING_ORDERS', payload: { rate } });

    // Paid order unchanged
    expect(nextState.orders[0].totalLocal).toBe(800);
    // Pending order revalued
    expect(nextState.orders[1].totalLocal).toBe(500);
  });

  it('rounds totalLocal to 2 decimal places', () => {
    const orders: Order[] = [
      createMockOrder({ id: 'o1', totalUSD: 33.33, totalLocal: 0, paymentStatus: 'pending' }),
    ];
    const state = createBaseState(orders);
    const rate = 7.5;

    const nextState = reducer(state, { type: 'REVALUE_PENDING_ORDERS', payload: { rate } });

    // 33.33 * 7.5 = 249.975 → rounded to 249.98
    expect(nextState.orders[0].totalLocal).toBe(249.98);
  });

  it('handles zero rate gracefully', () => {
    const orders: Order[] = [
      createMockOrder({ id: 'o1', totalUSD: 100, totalLocal: 0, paymentStatus: 'pending' }),
    ];
    const state = createBaseState(orders);
    const rate = 0;

    const nextState = reducer(state, { type: 'REVALUE_PENDING_ORDERS', payload: { rate } });

    expect(nextState.orders[0].totalLocal).toBe(0);
  });

  it('handles state with no orders (empty array)', () => {
    const state = createBaseState([]);
    const rate = 10;

    const nextState = reducer(state, { type: 'REVALUE_PENDING_ORDERS', payload: { rate } });

    expect(nextState.orders).toEqual([]);
    expect(nextState).toMatchObject({ products: [], categories: [] }); // other state preserved
  });
});
