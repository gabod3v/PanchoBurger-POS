import { describe, it, expect } from 'vitest';
import { formatQty, formatUnitPrice, formatLineTotal, formatItemSummary, formatSessionDate } from './format';

describe('formatQty', () => {
  it('shows integer for unit products', () => {
    expect(formatQty(3, false)).toBe('3');
    expect(formatQty(0, false)).toBe('0');
  });

  it('shows kg decimal for weight products', () => {
    expect(formatQty(0.5, true)).toBe('0.50 kg');
    expect(formatQty(1.75, true)).toBe('1.75 kg');
    expect(formatQty(0, true)).toBe('0.00 kg');
  });
});

describe('formatUnitPrice', () => {
  it('shows c/u for unit products', () => {
    expect(formatUnitPrice(10, false)).toBe('$10.00 c/u');
  });

  it('shows /kg for weight products', () => {
    expect(formatUnitPrice(10, true)).toBe('$10.00/kg');
    expect(formatUnitPrice(8.5, true)).toBe('$8.50/kg');
  });
});

describe('formatLineTotal', () => {
  it('calculates and formats total', () => {
    expect(formatLineTotal(10, 0.5)).toBe('$5.00');
    expect(formatLineTotal(8, 1.5)).toBe('$12.00');
    expect(formatLineTotal(5, 3)).toBe('$15.00');
  });
});

describe('formatItemSummary', () => {
  it('formats unit items as Nx Name', () => {
    expect(formatItemSummary(2, 'Hamburguesa', false)).toBe('2x Hamburguesa');
  });

  it('formats weight items as X.XX kg Name', () => {
    expect(formatItemSummary(0.5, 'Cochino Frito', true)).toBe('0.50 kg Cochino Frito');
    expect(formatItemSummary(1.25, 'Carne', true)).toBe('1.25 kg Carne');
  });
});

describe('formatSessionDate', () => {
  it('formats ISO date string to es-VE locale with weekday, day, month, year', () => {
    const isoStr = '2024-05-26T08:00:00.000Z';
    const result = formatSessionDate(isoStr);
    const expected = new Date(isoStr).toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    expect(result).toBe(expected);
  });

  it('formats different dates correctly', () => {
    const isoStr = '2023-12-25T10:30:00.000Z';
    const result = formatSessionDate(isoStr);
    const expected = new Date(isoStr).toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    expect(result).toBe(expected);
  });

  it('returns "Invalid Date" for unparseable strings', () => {
    const result = formatSessionDate('not-a-date');
    expect(result).toBe('Invalid Date');
  });

  it('returns "Invalid Date" for locale date format like "26/5/2026"', () => {
    // This is the exact bug scenario — locale dates are NOT parseable
    const result = formatSessionDate('26/5/2026');
    expect(result).toBe('Invalid Date');
  });
});
