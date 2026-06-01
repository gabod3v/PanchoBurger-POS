/**
 * Format the quantity for display.
 * Weight products show "X.XX kg", unit products show integer.
 */
export function formatQty(qty: number, soldByWeight?: boolean): string {
  if (soldByWeight) {
    return `${qty.toFixed(2)} kg`;
  }
  return String(Math.floor(qty));
}

/**
 * Format the unit price for display.
 * Weight products show "$X.XX/kg", unit products show "$X.XX c/u".
 */
export function formatUnitPrice(price: number, soldByWeight?: boolean): string {
  if (soldByWeight) {
    return `$${price.toFixed(2)}/kg`;
  }
  return `$${price.toFixed(2)} c/u`;
}

/**
 * Format the line total.
 * Always shows "$X.XX".
 */
export function formatLineTotal(price: number, qty: number): string {
  return `$${(price * qty).toFixed(2)}`;
}

/**
 * Format the item summary string for DaySummary table.
 * Weight: "0.50 kg Cochino Frito"
 * Unit: "2x Hamburguesa"
 */
export function formatItemSummary(qty: number, name: string, soldByWeight?: boolean): string {
  if (soldByWeight) {
    return `${qty.toFixed(2)} kg ${name}`;
  }
  return `${Math.floor(qty)}x ${name}`;
}

/**
 * Format a session date from ISO string to es-VE locale.
 * Falls back to "Invalid Date" for unparseable strings.
 */
export function formatSessionDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
