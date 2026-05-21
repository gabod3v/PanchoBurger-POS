import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ClipboardList, ChevronRight, Printer, Trash2, Pencil, Clock, Banknote, CreditCard, Smartphone, Coins, AlertCircle } from 'lucide-react';
import { OrderStatus, Order, PaymentMethod } from '@/types';
import { formatQty, formatUnitPrice } from '@/lib/format';
import PrintTicket from '@/components/PrintTicket';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

const paymentMethodLabels: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  pagomovil: { label: 'Pagomóvil', icon: <Smartphone size={14} /> },
  efectivo_bs: { label: 'Efectivo Bs', icon: <Coins size={14} /> },
  efectivo_usd: { label: 'Efectivo $', icon: <Banknote size={14} /> },
  punto: { label: 'Punto', icon: <CreditCard size={14} /> },
};

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
    return (
      <div key={o.id} className="pos-card hover:shadow-lg transition-all duration-500 overflow-hidden border-border/60">
        <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-border/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-display text-primary tracking-tighter">#{o.ticketNumber}</span>
                <div>
                    <h3 className="font-bold text-lg text-foreground leading-none mb-1">{o.customerName}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black ${o.status === 'pending' ? 'bg-warning/10 text-warning border border-warning/20' : o.status === 'ready' ? 'bg-info/10 text-info border border-info/20' : 'bg-success/10 text-success border border-success/20'}`}>
                  {statusLabels[o.status]}
                </span>
                {o.paymentStatus === 'pending' ? (
                  <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Sin pagar
                  </span>
                ) : (
                  <>
                    <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black bg-success/10 text-success border border-success/20 flex items-center gap-1">
                      {paymentMethodLabels[o.paymentMethod!]?.icon}
                      {paymentMethodLabels[o.paymentMethod!]?.label}
                    </span>
                    {o.paymentMethod === 'pagomovil' && o.paymentReference && (
                      <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-border/30">
                        Ref: {o.paymentReference}
                      </span>
                    )}
                  </>
                )}
                <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPrintingOrder(o)} title="Imprimir">
                        <Printer size={15} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => navigate(`/nuevo-pedido?edit=${o.id}`)} title="Editar">
                        <Pencil size={15} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(o.id)} title="Eliminar">
                        <Trash2 size={15} />
                    </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 px-1">Detalle del Pedido</p>
                {o.items.map((i, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-border/5 last:border-0 px-1 hover:bg-muted/30 transition-colors rounded-md">
                    <div className="flex items-center gap-3">
                      <span className="bg-muted text-muted-foreground font-black text-[10px] w-10 h-6 rounded flex items-center justify-center shrink-0">{formatQty(i.quantity, i.product.soldByWeight)}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/90">{i.product.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{formatUnitPrice(i.product.price, i.product.soldByWeight)}</span>
                      </div>
                    </div>
                    <span className="font-bold text-foreground/80">${(i.product.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/40 shadow-inner-sm">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Total a Cobrar</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-display text-foreground">${o.totalUSD.toFixed(2)}</span>
                        <span className="text-sm font-bold text-muted-foreground">USD</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-primary mb-0.5">Equivalente en Bs</span>
                    <span className="text-xl font-bold font-display text-primary/80">{o.totalLocal.toFixed(2)} Bs</span>
                </div>
            </div>

            {next && (
                <Button size="lg" className="w-full mt-5 gap-2 rounded-xl shadow-md font-bold tracking-wide uppercase text-sm h-12" onClick={() => updateOrderStatus(o.id, next)}>
                    {next === 'ready' ? 'Marcar como Listo' : 'Finalizar Entrega'}
                    <ChevronRight size={18} />
                </Button>
            )}
        </div>
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

      <PrintTicket order={printingOrder} />
    </div>
  );
}
