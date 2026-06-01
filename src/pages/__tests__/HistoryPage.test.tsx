import { describe, it, expect } from 'vitest';
import { computeSessionStats, filterSessionsByDate } from '../HistoryPage';
import type { DaySession } from '@/types';

interface RawOrder {
  day_session_id: string;
  payment_status: string;
  total_usd: number;
}

describe('computeSessionStats', () => {
  it('groups orders by session and computes all stats', () => {
    const orders: RawOrder[] = [
      { day_session_id: 'session-a', payment_status: 'paid', total_usd: 100 },
      { day_session_id: 'session-a', payment_status: 'pending', total_usd: 50 },
      { day_session_id: 'session-b', payment_status: 'paid', total_usd: 200 },
    ];

    const result = computeSessionStats(orders);

    // Session A: 2 orders, 1 paid, 1 pending, $150 revenue
    expect(result['session-a'].totalOrders).toBe(2);
    expect(result['session-a'].paidOrders).toBe(1);
    expect(result['session-a'].pendingOrders).toBe(1);
    expect(result['session-a'].totalRevenueUSD).toBe(150);

    // Session B: 1 order, 1 paid, 0 pending, $200 revenue
    expect(result['session-b'].totalOrders).toBe(1);
    expect(result['session-b'].paidOrders).toBe(1);
    expect(result['session-b'].pendingOrders).toBe(0);
    expect(result['session-b'].totalRevenueUSD).toBe(200);
  });

  it('returns empty record for empty orders array', () => {
    const result = computeSessionStats([]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles all-pending orders correctly', () => {
    const orders: RawOrder[] = [
      { day_session_id: 'session-x', payment_status: 'pending', total_usd: 30 },
      { day_session_id: 'session-x', payment_status: 'pending', total_usd: 70 },
    ];

    const result = computeSessionStats(orders);

    expect(result['session-x'].totalOrders).toBe(2);
    expect(result['session-x'].paidOrders).toBe(0);
    expect(result['session-x'].pendingOrders).toBe(2);
    expect(result['session-x'].totalRevenueUSD).toBe(100);
  });

  it('sums revenue correctly with decimal values', () => {
    const orders: RawOrder[] = [
      { day_session_id: 'session-z', payment_status: 'paid', total_usd: 45.50 },
      { day_session_id: 'session-z', payment_status: 'paid', total_usd: 12.75 },
    ];

    const result = computeSessionStats(orders);

    expect(result['session-z'].totalOrders).toBe(2);
    expect(result['session-z'].paidOrders).toBe(2);
    expect(result['session-z'].totalRevenueUSD).toBe(58.25);
  });

  it('handles multiple sessions with mixed statuses', () => {
    const orders: RawOrder[] = [
      { day_session_id: 's1', payment_status: 'paid', total_usd: 10 },
      { day_session_id: 's1', payment_status: 'pending', total_usd: 20 },
      { day_session_id: 's2', payment_status: 'pending', total_usd: 30 },
      { day_session_id: 's3', payment_status: 'paid', total_usd: 40 },
    ];

    const result = computeSessionStats(orders);

    expect(result['s1'].totalOrders).toBe(2);
    expect(result['s1'].paidOrders).toBe(1);
    expect(result['s1'].pendingOrders).toBe(1);
    expect(result['s1'].totalRevenueUSD).toBe(30);

    expect(result['s2'].totalOrders).toBe(1);
    expect(result['s2'].paidOrders).toBe(0);
    expect(result['s2'].pendingOrders).toBe(1);
    expect(result['s2'].totalRevenueUSD).toBe(30);

    expect(result['s3'].totalOrders).toBe(1);
    expect(result['s3'].paidOrders).toBe(1);
    expect(result['s3'].pendingOrders).toBe(0);
    expect(result['s3'].totalRevenueUSD).toBe(40);
  });
});

describe('filterSessionsByDate', () => {
  const sessions: DaySession[] = [
    { id: '1', date: '26/5/2026', exchangeRate: 55, isOpen: true, openedAt: '2026-05-26T14:30:00.000Z' },
    { id: '2', date: '25/5/2026', exchangeRate: 54, isOpen: false, openedAt: '2026-05-25T10:00:00.000Z' },
    { id: '3', date: '26/5/2026', exchangeRate: 55, isOpen: false, openedAt: '2026-05-26T08:00:00.000Z' },
  ];

  it('returns all sessions when no date filter', () => {
    const result = filterSessionsByDate(sessions, '');
    expect(result).toHaveLength(3);
    expect(result.map(s => s.id)).toEqual(['1', '2', '3']);
  });

  it('filters sessions by matching date prefix', () => {
    const result = filterSessionsByDate(sessions, '2026-05-26');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['1', '3']);
  });

  it('returns empty array when no sessions match the date', () => {
    const result = filterSessionsByDate(sessions, '2026-05-27');
    expect(result).toHaveLength(0);
  });

  it('is case-sensitive and exact with date prefix matching', () => {
    const result = filterSessionsByDate(sessions, '2026-05-26T');
    expect(result).toHaveLength(2);
  });
});
