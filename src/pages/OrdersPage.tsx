import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { OrderStatus } from '@/types';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  ready: 'Listo',
  completed: 'Completado',
};

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  pending: 'ready',
  ready: 'completed',
  completed: null,
};

const badgeClass: Record<OrderStatus, string> = {
  pending: 'pos-badge-pending',
  ready: 'pos-badge-ready',
  completed: 'pos-badge-completed',
};

export default function OrdersPage() {
  const { state, updateOrderStatus } = useApp();
  const activeOrders = state.orders.filter(o => o.status !== 'completed');
  const completedOrders = state.orders.filter(o => o.status === 'completed');

  if (state.orders.length === 0) {
    return (
      <div className="animate-slide-in text-center py-20">
        <ClipboardList size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold font-display">Sin pedidos</h2>
        <p className="text-muted-foreground">Aún no hay pedidos registrados hoy.</p>
      </div>
    );
  }

  const renderOrder = (o: typeof state.orders[0]) => {
    const next = nextStatus[o.status];
    return (
      <div key={o.id} className="pos-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl font-bold font-display text-primary">#{o.ticketNumber}</span>
            <span className="font-semibold">{o.customerName}</span>
            <span className={badgeClass[o.status]}>{statusLabels[o.status]}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {o.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
          </p>
          <p className="text-sm font-medium mt-1">
            ${o.totalUSD.toFixed(2)} — {o.totalLocal.toFixed(2)} Bs
          </p>
        </div>
        {next && (
          <Button size="sm" className="gap-1 shrink-0" onClick={() => updateOrderStatus(o.id, next)}>
            {next === 'ready' ? 'Marcar Listo' : 'Completar'}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="animate-slide-in">
      <h1 className="text-3xl font-bold font-display mb-6">Pedidos</h1>

      {activeOrders.length > 0 && (
        <>
          <h2 className="text-lg font-semibold font-display mb-3">En curso ({activeOrders.length})</h2>
          <div className="space-y-3 mb-8">{activeOrders.map(renderOrder)}</div>
        </>
      )}

      {completedOrders.length > 0 && (
        <>
          <h2 className="text-lg font-semibold font-display mb-3 text-muted-foreground">Completados ({completedOrders.length})</h2>
          <div className="space-y-3 opacity-70">{completedOrders.map(renderOrder)}</div>
        </>
      )}
    </div>
  );
}
