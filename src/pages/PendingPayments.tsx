import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle } from 'lucide-react';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { Order, DaySession } from '@/types';

interface SessionGroup {
  session: DaySession;
  orders: Order[];
}

export default function PendingPayments() {
  const { state, fetchOrdersBySession } = useApp();
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const groups: SessionGroup[] = [];

      for (const session of state.sessions) {
        const orders = await fetchOrdersBySession(session.id);
        const pending = orders.filter(o => o.paymentStatus === 'pending');
        if (pending.length > 0) {
          groups.push({ session, orders: pending });
        }
      }

      const todayPending = state.orders.filter(o => o.paymentStatus === 'pending');
      if (todayPending.length > 0) {
        if (state.currentDay) {
          const existing = groups.find(g => g.session.id === state.currentDay!.id);
          if (existing) {
            existing.orders.push(...todayPending);
          } else {
            groups.unshift({ session: state.currentDay, orders: todayPending });
          }
        }
      }

      setSessionGroups(groups);
    } catch (error) {
      console.error('Error loading pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const allPendingOrders = sessionGroups.flatMap(g => g.orders);
  const totalUSD = allPendingOrders.reduce((sum, o) => sum + o.totalUSD, 0);
  const totalBs = state.currentDay
    ? totalUSD * state.currentDay.exchangeRate
    : allPendingOrders.reduce((sum, o) => sum + o.totalLocal, 0);

  const currentRate = state.currentDay?.exchangeRate;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatBs = (value: number) =>
    value.toLocaleString('es-VE', { minimumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Clock className="text-warning" size={28} />
            Pedidos Pendientes
          </h1>
          <p className="text-muted-foreground mt-1">
            {allPendingOrders.length} pedido{allPendingOrders.length !== 1 ? 's' : ''} sin pagar • Total: ${totalUSD.toFixed(2)} | {formatBs(totalBs)} Bs
          </p>
        </div>
      </div>

      {allPendingOrders.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={48} className="mx-auto text-success mb-4" />
          <h2 className="text-xl font-semibold font-display">No hay pedidos pendientes</h2>
          <p className="text-muted-foreground mt-2">Todos los pedidos están pagados</p>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="space-y-2">
            {sessionGroups.map(group => (
              <div key={group.session.id}>
                <h3 className="text-lg font-display font-semibold mt-6 mb-3 border-t pt-4 flex items-center gap-2">
                  📅 {formatDate(group.session.date)}
                  <span className="text-xs text-muted-foreground font-normal">
                    Tasa: {formatBs(group.session.exchangeRate)} Bs/$
                  </span>
                </h3>
                <div className="space-y-2">
                  {group.orders.map(order => {
                    const revaluedLocal = currentRate ? order.totalUSD * currentRate : undefined;
                    const isRevalued = revaluedLocal !== undefined && Math.abs(revaluedLocal - order.totalLocal) > 0.01;

                    const itemsPreview = order.items.slice(0, 2);
                    const remainingCount = order.items.length - 2;

                    return (
                      <div
                        key={order.id}
                        className="pos-card flex items-center justify-between p-4 cursor-pointer hover:ring-1 hover:ring-warning/50"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                            <Clock className="text-warning" size={24} />
                          </div>
                          <div>
                            <p className="font-semibold">Ticket #{order.ticketNumber}</p>
                            <p className="text-sm text-muted-foreground">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {itemsPreview.map(i => i.product.name).join(', ')}
                              {remainingCount > 0 ? ` y ${remainingCount} más` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('es-VE', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-warning">${order.totalUSD.toFixed(2)}</p>
                          <p className={`text-sm ${isRevalued ? 'text-warning' : 'text-muted-foreground'}`}>
                            {isRevalued ? '↻ ' : ''}{formatBs(order.totalLocal)} Bs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <OrderDetailModal
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onPaymentComplete={() => {
          setSelectedOrder(null);
          loadPendingOrders();
        }}
      />
    </div>
  );
}
