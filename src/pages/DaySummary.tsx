import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';

export default function DaySummary() {
  const { state, resetDay } = useApp();
  const navigate = useNavigate();
  const { currentDay, orders } = state;

  const completed = orders.filter(o => o.status === 'completed');
  const totalUSD = completed.reduce((s, o) => s + o.totalUSD, 0);
  const totalLocal = completed.reduce((s, o) => s + o.totalLocal, 0);

  if (!currentDay) {
    return (
      <div className="animate-slide-in text-center py-20">
        <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold font-display">Sin datos</h2>
        <p className="text-muted-foreground">Abre la caja para iniciar el día.</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <h1 className="text-3xl font-bold font-display mb-2">Resumen del Día</h1>
      <p className="text-muted-foreground mb-6">{currentDay.date} — Tasa: {currentDay.exchangeRate} Bs/$</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="pos-stat items-center">
          <ShoppingBag size={24} className="text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Pedidos completados</span>
          <span className="text-3xl font-bold font-display">{completed.length}</span>
        </div>
        <div className="pos-stat items-center">
          <DollarSign size={24} className="text-success mb-1" />
          <span className="text-xs text-muted-foreground">Total USD</span>
          <span className="text-3xl font-bold font-display">${totalUSD.toFixed(2)}</span>
        </div>
        <div className="pos-stat items-center">
          <TrendingUp size={24} className="text-warning mb-1" />
          <span className="text-xs text-muted-foreground">Total Bs</span>
          <span className="text-3xl font-bold font-display">{totalLocal.toFixed(2)}</span>
        </div>
      </div>

      {completed.length > 0 && (
        <div className="pos-card mb-8">
          <h2 className="font-semibold font-display mb-3">Detalle de Pedidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Cliente</th>
                  <th className="pb-2 pr-4">Productos</th>
                  <th className="pb-2 pr-4 text-right">USD</th>
                  <th className="pb-2 text-right">Bs</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(o => (
                  <tr key={o.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-bold text-primary">{o.ticketNumber}</td>
                    <td className="py-2 pr-4">{o.customerName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {o.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </td>
                    <td className="py-2 pr-4 text-right font-medium">${o.totalUSD.toFixed(2)}</td>
                    <td className="py-2 text-right font-medium">{o.totalLocal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="pt-3 text-right pr-4">Totales:</td>
                  <td className="pt-3 text-right pr-4">${totalUSD.toFixed(2)}</td>
                  <td className="pt-3 text-right">{totalLocal.toFixed(2)} Bs</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {!currentDay.isOpen && (
        <Button size="lg" className="w-full" onClick={() => { resetDay(); navigate('/caja'); }}>
          Iniciar Nuevo Día
        </Button>
      )}
    </div>
  );
}
