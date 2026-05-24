import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { ClipboardList, Printer, Trash2, Pencil, Clock, Banknote, CreditCard, Smartphone, Coins, AlertCircle, ChevronRight, Plus, CheckCircle, Share2 } from 'lucide-react';
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
  const { state, updateOrderStatus, deleteOrder, registerPayment, fetchOrdersBySession } = useApp();
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [currentTab, setCurrentTab] = useState('active');
  const navigate = useNavigate();

  // Pending payments state
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo_bs');
  const [payRef, setPayRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      deleteOrder(id);
      toast.success('Pedido eliminado');
    }
  };

  const formatOrderAsText = (o: Order): string => {
    const date = new Date(o.createdAt).toLocaleString('es-VE');
    const items = o.items.map(i =>
      `  ${i.quantity}× ${i.product.name}  $${(i.product.price * i.quantity).toFixed(2)}`
    ).join('\n');

    let paymentLine = '';
    if (o.paymentStatus === 'paid' && o.paymentMethod) {
      paymentLine = `\nPagado: ${paymentMethodLabels[o.paymentMethod]?.label || o.paymentMethod}`;
      if (o.paymentMethod === 'pagomovil' && o.paymentReference) {
        paymentLine += ` Ref: ${o.paymentReference}`;
      }
    } else if (o.paymentMethod === 'pagomovil' && o.paymentReference) {
      // Show pagomovil details even when pending — for sharing with customer
      paymentLine = `\nPagomóvil Ref: ${o.paymentReference}`;
    } else {
      paymentLine = '\nPendiente de pago';
    }

    return (
      `🧾 *PEDIDO #${o.ticketNumber}*\n` +
      `Cliente: ${o.customerName}\n` +
      `Fecha: ${date}\n` +
      `\n${items}\n` +
      `\n─────────────────\n` +
      `*Total: $${o.totalUSD.toFixed(2)}*  (Bs ${o.totalLocal.toFixed(2)})` +
      paymentLine
    );
  };

  const handleShare = async (o: Order) => {
    const text = formatOrderAsText(o);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Pedido #${o.ticketNumber}`, text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Ticket copiado al portapapeles');
    }
  };

  useEffect(() => {
    if (printingOrder) {
      setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 100);
    }
  }, [printingOrder]);

  // Load pending orders when switching to pending tab
  useEffect(() => {
    if (currentTab === 'pending') {
      loadPendingOrders();
    }
  }, [currentTab]);

  const loadPendingOrders = async () => {
    setLoadingPending(true);
    try {
      // Only show pending orders from today's open session
      const todayPending = state.orders.filter(o => o.paymentStatus === 'pending');

      // Also fetch pending from the most recent closed session of the same branch
      // (catches carry-over without flooding with all historical sessions)
      if (state.currentDay && state.currentDay.locationId) {
        const branchSessions = state.sessions
          .filter(s => s.locationId === state.currentDay!.locationId && !s.isOpen)
          .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

        if (branchSessions.length > 0) {
          const lastClosed = await fetchOrdersBySession(branchSessions[0].id);
          const carryOver = lastClosed.filter(o => o.paymentStatus === 'pending');
          todayPending.push(...carryOver);
        }
      }

      setPendingOrders(todayPending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading pending orders:', error);
    } finally {
      setLoadingPending(false);
    }
  };

  const handlePayOrder = async () => {
    if (!selectedOrder) return;
    if (payMethod === 'pagomovil' && !payRef) {
      toast.error('Ingresa la referencia del pagomóvil');
      return;
    }
    setIsProcessing(true);
    try {
      registerPayment(selectedOrder.id, payMethod, payRef);
      toast.success(`Pedido #${selectedOrder.ticketNumber} marcado como pagado`);
      setSelectedOrder(null);
      setPayRef('');
      loadPendingOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeOrders = state.orders.filter(o => o.status !== 'completed');
  const completedOrders = state.orders.filter(o => o.status === 'completed');
  const totalPending = pendingOrders.reduce((sum, o) => sum + o.totalUSD, 0);

  const renderOrder = (o: Order) => {
    const next = nextStatus[o.status];
    const cardBg = getCardBg(o.status);

    return (
      <div key={o.id} className={`${cardBg} border border-amber-200/60 shadow-sm rounded-b-lg overflow-hidden transition-all duration-300 hover:shadow-md`}>
        <div className="border-t-2 border-dashed border-amber-300" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl font-black font-mono text-primary leading-none tracking-tighter">#{o.ticketNumber}</span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-foreground leading-tight truncate">{o.customerName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <OrderStatusBadge status={o.status} className="shrink-0" />
          </div>
          <div className="border-t border-dashed border-amber-300/50 my-3" />
          <div className="space-y-2 mb-4">
            {o.items.map((i, index) => (
              <div key={index} className="flex justify-between items-center py-1 text-sm">
                <span className="text-muted-foreground/90">
                  <span className="text-amber-700 font-semibold">{formatQty(i.quantity, i.product.soldByWeight)}</span>{' '}
                  <span className="font-medium text-foreground/90">{i.product.name}</span>
                </span>
                <span className="font-medium tabular-nums text-foreground/80">${(i.product.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-amber-300/50 my-3" />
          <div className="flex justify-between items-end mb-1">
            <span className="text-lg font-bold text-foreground">Total</span>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-foreground">${o.totalUSD.toFixed(2)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{o.totalLocal.toFixed(2)} Bs</span>
            </div>
          </div>
          {o.paymentStatus === 'paid' && o.paymentMethod && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 py-1.5 border-t border-dashed border-amber-300/30">
              {paymentMethodLabels[o.paymentMethod]?.icon}
              <span>{paymentMethodLabels[o.paymentMethod]?.label}</span>
              {o.paymentMethod === 'pagomovil' && o.paymentReference && (
                <><span className="mx-0.5 text-amber-300/50">•</span><span className="font-mono font-medium">Ref: {o.paymentReference}</span></>
              )}
            </div>
          )}
          {o.paymentStatus === 'pending' && (
            <div className="flex items-center gap-1.5 text-xs text-destructive mt-2 py-1.5 border-t border-dashed border-amber-300/30">
              <AlertCircle size={12} />
              <span className="font-medium">Sin pagar</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-amber-300/50">
            <Button variant="outline" size="sm" className="border-amber-200/60 hover:bg-amber-100/50" onClick={() => setPrintingOrder(o)}>
              <Printer size={14} /> Imprimir
            </Button>
            <Button variant="outline" size="sm" className="border-amber-200/60 hover:bg-amber-100/50" onClick={() => handleShare(o)}>
              <Share2 size={14} /> Compartir
            </Button>
            <Button variant="outline" size="sm" className="border-amber-200/60 hover:bg-amber-100/50" onClick={() => navigate(`/nuevo-pedido?edit=${o.id}`)}>
              <Pencil size={14} /> Editar
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 ml-auto" onClick={() => handleDelete(o.id)} title="Eliminar">
              <Trash2 size={14} />
            </Button>
          </div>
          {next && (
            <Button size="lg" className="w-full mt-4 gap-2 rounded-lg shadow-sm font-bold tracking-wide uppercase text-sm h-11"
              onClick={() => updateOrderStatus(o.id, next)}>
              {next === 'ready' ? 'Marcar como Listo' : 'Finalizar Entrega'}
              <ChevronRight size={18} />
            </Button>
          )}
        </div>
        <div className="border-b-2 border-dashed border-amber-300" />
      </div>
    );
  };

  return (
    <div className="animate-slide-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
        <h1 className="text-4xl font-bold font-display tracking-tight">Pedidos</h1>
        <Button onClick={() => navigate('/nuevo-pedido')} className="gap-2 shrink-0 rounded-md font-semibold tracking-wide">
          <Plus size={18} />
          Nuevo Pedido
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg border border-border/50 mb-6">
          <TabsTrigger value="active" className="text-sm data-[state=active]:bg-background font-medium">
            Activos ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm data-[state=active]:bg-background font-medium">
            Completados ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-sm data-[state=active]:bg-background font-medium">
            Pendientes de pago ({pendingOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-60">
              <ClipboardList size={56} className="text-muted-foreground mb-4" strokeWidth={1} />
              <h2 className="text-2xl font-semibold font-display tracking-tight">Sin pedidos activos</h2>
              <p className="text-muted-foreground font-medium mt-1">Arrancá el día y tomá tu primer pedido.</p>
            </div>
          ) : (
            <div className="space-y-5">{activeOrders.map(renderOrder)}</div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-60">
              <CheckCircle size={56} className="text-muted-foreground mb-4" strokeWidth={1} />
              <h2 className="text-2xl font-semibold font-display tracking-tight">Sin pedidos completados</h2>
              <p className="text-muted-foreground font-medium mt-1">Los pedidos completados aparecen acá.</p>
            </div>
          ) : (
            <div className="space-y-5 opacity-70">{completedOrders.map(renderOrder)}</div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {loadingPending ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle size={48} className="mx-auto text-success mb-4" />
              <h2 className="text-xl font-semibold font-display">No hay pedidos pendientes</h2>
              <p className="text-muted-foreground mt-2">Todos los pedidos están pagados</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {pendingOrders.length} pedido{pendingOrders.length !== 1 ? 's' : ''} sin pagar • Total pendiente: <span className="font-bold text-warning">${totalPending.toFixed(2)}</span>
              </p>
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div key={order.id} className="pos-card flex items-center justify-between p-4 cursor-pointer hover:ring-1 hover:ring-warning/50"
                    onClick={() => { setSelectedOrder(order); setPayMethod('efectivo_bs'); setPayRef(''); }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                        <Clock className="text-warning" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold">Ticket #{order.ticketNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-warning">${order.totalUSD.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{order.totalLocal.toFixed(2)} Bs</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Pagar Pedido #{selectedOrder?.ticketNumber}</DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-semibold">{selectedOrder.customerName}</p>
                    <p className="text-2xl font-bold text-warning mt-2">${selectedOrder.totalUSD.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.totalLocal.toFixed(2)} Bs</p>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Método de Pago</label>
                    <PaymentMethodSelector value={payMethod} onChange={setPayMethod} />
                  </div>
                  {payMethod === 'pagomovil' && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Referencia (últimos 4 dígitos)</label>
                      <Input placeholder="Ej: 1234" value={payRef} onChange={e => setPayRef(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} className="w-32" />
                    </div>
                  )}
                  <Button className="w-full" size="lg" onClick={handlePayOrder} disabled={isProcessing}>
                    {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                  </Button>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <PrintTicket order={printingOrder} />
    </div>
  );
}
