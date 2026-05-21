import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Banknote, CreditCard, Smartphone, Coins, CheckCircle, X } from 'lucide-react';
import { Order, PaymentMethod } from '@/types';
import { toast } from 'sonner';

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'pagomovil', label: 'Pagomóvil', icon: <Smartphone size={18} /> },
  { value: 'efectivo_bs', label: 'Efectivo Bs', icon: <Coins size={18} /> },
  { value: 'efectivo_usd', label: 'Efectivo $', icon: <Banknote size={18} /> },
  { value: 'punto', label: 'Punto', icon: <CreditCard size={18} /> },
];

export default function PendingPayments() {
  const { state, registerPayment, fetchOrdersBySession } = useApp();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo_bs');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const allPending: Order[] = [];
      
      for (const session of state.sessions) {
        const orders = await fetchOrdersBySession(session.id);
        const pending = orders.filter(o => o.paymentStatus === 'pending');
        allPending.push(...pending);
      }
      
      const todayPending = state.orders.filter(o => o.paymentStatus === 'pending');
      allPending.push(...todayPending);
      
      setPendingOrders(allPending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayOrder = async () => {
    if (!selectedOrder) return;
    if (paymentMethod === 'pagomovil' && !paymentReference) {
      toast.error('Ingresa la referencia del pagomóvil');
      return;
    }

    setIsProcessing(true);
    try {
      registerPayment(selectedOrder.id, paymentMethod, paymentReference);
      
      toast.success(`Pedido #${selectedOrder.ticketNumber} marcado como pagado`);
      setSelectedOrder(null);
      setPaymentReference('');
      loadPendingOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPending = pendingOrders.reduce((sum, o) => sum + o.totalUSD, 0);

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
            {pendingOrders.length} pedido{pendingOrders.length !== 1 ? 's' : ''} sin pagar • Total: ${totalPending.toFixed(2)}
          </p>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={48} className="mx-auto text-success mb-4" />
          <h2 className="text-xl font-semibold font-display">No hay pedidos pendientes</h2>
          <p className="text-muted-foreground mt-2">Todos los pedidos están pagados</p>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="space-y-3">
            {pendingOrders.map(order => (
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
                      {new Date(order.createdAt).toLocaleDateString('es-VE', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
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
        </ScrollArea>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="pos-card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-display">
                Pagar Pedido #{selectedOrder.ticketNumber}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-semibold">{selectedOrder.customerName}</p>
              <p className="text-2xl font-bold text-warning mt-2">${selectedOrder.totalUSD.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.totalLocal.toFixed(2)} Bs</p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg border transition-all font-medium text-sm ${
                      paymentMethod === pm.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'pagomovil' && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Referencia (últimos 4 dígitos)
                </label>
                <Input
                  placeholder="Ej: 1234"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="w-32"
                />
              </div>
            )}

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handlePayOrder}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}