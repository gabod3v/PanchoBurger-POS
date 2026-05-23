import { DollarSign } from 'lucide-react';

interface RateDisplayProps {
  rate: number;
  date?: string;
  openedAt?: string;
  variant?: 'card' | 'badge';
  className?: string;
}

export default function RateDisplay({ rate, date, openedAt, variant = 'card', className = '' }: RateDisplayProps) {
  const formatted = rate.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 bg-success/10 text-success font-bold text-sm px-3 py-1.5 rounded-full border border-success/20 ${className}`}>
        <DollarSign size={14} />
        {formatted} Bs/$
      </span>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-success/15 p-1.5 rounded-lg">
          <DollarSign size={16} className="text-success" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tasa de Cambio</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black font-display text-success tracking-tight">{formatted}</span>
        <span className="text-xs font-bold text-success/70">Bs/$</span>
      </div>
      {openedAt && (
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Desde las {new Date(openedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}
