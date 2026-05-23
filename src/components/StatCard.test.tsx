import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Pendientes" value="5" />);
    
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders numeric value correctly', () => {
    render(<StatCard label="Total" value={42} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const Icon = () => <svg data-testid="test-icon" />;
    render(<StatCard label="Ventas" value="$100" icon={Icon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard label="Test" value="1" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
