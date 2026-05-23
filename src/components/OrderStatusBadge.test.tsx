import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from './OrderStatusBadge';

describe('OrderStatusBadge', () => {
  it('renders "Pendiente" for pending status', () => {
    render(<OrderStatusBadge status="pending" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders "Listo" for ready status', () => {
    render(<OrderStatusBadge status="ready" />);
    expect(screen.getByText('Listo')).toBeInTheDocument();
  });

  it('renders "Completado" for completed status', () => {
    render(<OrderStatusBadge status="completed" />);
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<OrderStatusBadge status="pending" className="test-class" />);
    const badge = screen.getByText('Pendiente');
    expect(badge.className).toContain('test-class');
  });
});
