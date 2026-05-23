import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ClipboardList, Printer, Trash2, Pencil, Clock, Banknote, CreditCard, Smartphone, Coins, AlertCircle, ChevronRight } from 'lucide-react';
import { OrderStatus, Order, PaymentMethod } from '@/types';
import { formatQty, formatUnitPrice } from '@/lib/format';
import PrintTicket from '@/components/PrintTicket';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

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

const paymentMethodLabels: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  pagomovil: { label: 'Pagomóvil', icon: <Smartphone size={14} /> },
  efectivo_bs: { label: 'Efectivo Bs', icon: <Coins size={14} /> },
  efectivo_usd: { label: 'Efectivo $', icon: <Banknote size={14} /> },
  punto: { label: 'Punto', icon: <CreditCard size={14} /> },
};

function getCardBg(status: OrderStatus): string {
  if (status === 'pending') return 'bg-amber-50';
  if (status === 'ready') return 'bg-blue-50/30';
  return 'bg-green-50/20';
}

export default function OrdersPage() {
  const { state, updateOrderStatus, deleteOrder } = useApp();
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      deleteOrder(id);
      toast.success('Pedido eliminado');
    }
  };

  const activeOrders = state.orders.filter(o => o.status !== 'completed');
  const completedOrders = state.orders.filter(o => o.status === 'completed');

  useEffect(() => {
    if (printingOrder) {
      setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 100);
    }
  }, [printingOrder]);

  if (state.orders.length === 0) {
    return (
      <div className="animate-slide-in flex flex-col items-center justify-center py-24 opacity-60">
        <ClipboardList size={56} className="text-muted-foreground mb-4" strokeWidth={1} />
        <h2 className="text-2xl font-semibold font-display tracking-tight">Sin pedidos</h2>
        <p className="text-muted-foreground font-medium mt-1">Aún no hay pedidos registrados hoy.</p>
      </div>
    );
  }

  const renderOrder = (o: Order) => {
    const next = nextStatus[o.status];
    const cardBg = getCardBg(o.status);

    return (
      <div
        key={o.id}
        className={`${cardBg} border border-amber-200/60 shadow-sm rounded-b-lg overflow-hidden transition-all duration-300 hover:shadow-md`}
      >
        {/* Top dashed perforation — torn ticket edge */}
        <div className="border-t-2 border-dashed border-amber-300" />

        <div className="p-5">
          {/* HEADER: Ticket number + Customer + Status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl font-black font-mono text-primary leading-none tracking-tighter">
                #{o.ticketNumber}
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground leading-tight truncate">
                  {o.customerName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <OrderStatusBadge status={o.status} className="shrink-0" />
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-amber-300/50 my-3" />

          {/* ITEMS SECTION */}
          <div className="space-y-2 mb-4">
            {o.items.map((i, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-1 text-sm"
              >
                <span className="text-muted-foreground/90">
                  <span className="text-amber-700 font-semibold">
                    {formatQty(i.quantity, i.product.soldByWeight)}
                  </span>{' '}
                  <span className="font-medium text-foreground/90">
                    {i.product.name}
                  </span>
                </span>
                <span className="font-medium tabular-nums text-foreground/80">
                  ${(i.product.price * i.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div className="border-t border-dashed border-amber-300/50 my-3" />

          {/* TOTALS */}
          <div className="flex justify-between items-end mb-1">
            <span className="text-lg font-bold text-foreground">Total</span>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-foreground">
                  ${o.totalUSD.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {o.totalLocal.toFixed(2)} Bs
              </span>
            </div>
          </div>

          {/* PAYMENT INFO */}
          {o.paymentStatus === 'paid' && o.paymentMethod && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 py-1.5 border-t border-dashed border-amber-300/30">
              {paymentMethodLabels[o.paymentMethod]?.icon}
              <span>{paymentMethodLabels[o.paymentMethod]?.label}</span>
              {o.paymentMethod === 'pagomovil' && o.paymentReference && (
                <>
                  <span className="mx-0.5 text-amber-300/50">•</span>
                  <span className="font-mono font-medium">Ref: {o.paymentReference}</span>
                </>
              )}
            </div>
          )}

          {o.paymentStatus === 'pending' && (
            <div className="flex items-center gap-1.5 text-xs text-destructive mt-2 py-1.5 border-t border-dashed border-amber-300/30">
              <AlertCircle size={12} />
              <span className="font-medium">Sin pagar</span>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-amber-300/50">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-200/60 hover:bg-amber-100/50"
              onClick={() => setPrintingOrder(o)}
            >
              <Printer size={14} />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-200/60 hover:bg-amber-100/50"
              onClick={() => navigate(`/nuevo-pedido?edit=${o.id}`)}
            >
              <Pencil size={14} />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 ml-auto"
              onClick={() => handleDelete(o.id)}
              title="Eliminar"
            >
              <Trash2 size={14} />
            </Button>
          </div>

          {/* STATUS PROGRESS */}
          {next && (
            <Button
              size="lg"
              className="w-full mt-4 gap-2 rounded-lg shadow-sm font-bold tracking-wide uppercase text-sm h-11"
              onClick={() => updateOrderStatus(o.id, next)}
            >
              {next === 'ready' ? 'Marcar como Listo' : 'Finalizar Entrega'}
              <ChevronRight size={18} />
            </Button>
          )}
        </div>

        {/* Bottom dashed perforation — ticket stub tear */}
        <div className="border-b-2 border-dashed border-amber-300" />
      </div>
    );
  };

  return (
    <div className="animate-slide-in max-w-5xl mx-auto">
      <div className="mb-8 border-b border-border/40 pb-4">
        <h1 className="text-4xl font-bold font-display tracking-tight">Pedidos</h1>
      </div>

      {activeOrders.length > 0 && (
        <>
          <h2 className="text-lg font-semibold font-display mb-4">
            En curso ({activeOrders.length})
          </h2>
          <div className="space-y-5 mb-10">
            {activeOrders.map(renderOrder)}
          </div>
        </>
      )}

      {completedOrders.length > 0 && (
        <>
          <h2 className="text-lg font-semibold font-display mb-4 text-muted-foreground">
            Completados ({completedOrders.length})
          </h2>
          <div className="space-y-5 opacity-70">
            {completedOrders.map(renderOrder)}
          </div>
        </>
      )}

      <PrintTicket order={printingOrder} />
    </div>
  );
}
