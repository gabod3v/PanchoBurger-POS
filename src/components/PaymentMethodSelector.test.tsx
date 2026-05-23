import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentMethodSelector } from './PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  it('renders all 4 payment methods', () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector value="efectivo_bs" onChange={onChange} />);
    
    expect(screen.getByText('Pagomóvil')).toBeInTheDocument();
    expect(screen.getByText('Efectivo Bs')).toBeInTheDocument();
    expect(screen.getByText('Efectivo $')).toBeInTheDocument();
    expect(screen.getByText('Punto')).toBeInTheDocument();
  });

  it('calls onChange with correct method when clicked', () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector value="efectivo_bs" onChange={onChange} />);
    
    fireEvent.click(screen.getByText('Pagomóvil'));
    expect(onChange).toHaveBeenCalledWith('pagomovil');
  });

  it('calls onChange with efectivo_usd', () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector value="efectivo_bs" onChange={onChange} />);
    
    fireEvent.click(screen.getByText('Efectivo $'));
    expect(onChange).toHaveBeenCalledWith('efectivo_usd');
  });

  it('calls onChange with punto', () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector value="efectivo_bs" onChange={onChange} />);
    
    fireEvent.click(screen.getByText('Punto'));
    expect(onChange).toHaveBeenCalledWith('punto');
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<PaymentMethodSelector value="efectivo_bs" onChange={onChange} disabled />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
