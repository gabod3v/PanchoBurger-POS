import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, DollarSign, TrendingUp, ShoppingBag, ArrowLeft, Loader2, Trash2, Plus, ClipboardList, Package, Banknote, CreditCard, Smartphone, Coins, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import RateDisplay from '@/components/RateDisplay';
import { DaySession, Order, OrderItem, PaymentMethod } from '@/types';
import { formatQty, formatItemSummary } from '@/lib/format';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DaySummary() {
  const { id } = useParams();
  const { state, resetDay, fetchOrdersBySession, deleteOrder, addOrder } = useApp();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<DaySession | null>(null);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual Order State
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualItems, setManualItems] = useState<{productId: string, quantity: number}[]>([]);

  const loadSession = async () => {
    setLoading(true);
    if (id) {
      const found = state.sessions.find(s => s.id === id);
      if (found) {
        setSession(found);
        const orders = await fetchOrdersBySession(id);
        setSessionOrders(orders);
      }
    } else {
      setSession(state.currentDay);
      setSessionOrders(state.orders);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSession();
  }, [id, state.currentDay, state.orders, state.sessions]);

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      await deleteOrder(orderId, session?.id);
      setSessionOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Pedido eliminado');
    }
  };

  const handleAddManualItem = () => {
    if (state.products.length > 0) {
      setManualItems([...manualItems, { productId: state.products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const handleManualSubmit = async () => {
    if (!manualCustomer.trim() || manualItems.length === 0 || !session) return;
    
    const items: OrderItem[] = manualItems.map(mi => {
      const p = state.products.find(p => p.id === mi.productId)!;
      return { product: p, quantity: mi.quantity };
    });

    await addOrder(manualCustomer.trim(), items, session.id);
    setIsManualOrderOpen(false);
    setManualCustomer('');
    setManualItems([]);
    loadSession(); // reload list
    toast.success('Pedido cargado manualmente');
  };

  const completed = sessionOrders.filter(o => o.status === 'completed' || o.status === 'ready' || o.status === 'pending');
  const paidOrders = completed.filter(o => o.paymentStatus === 'paid');
  const pendingOrders = completed.filter(o => o.paymentStatus === 'pending');
  const totalUSD = completed.reduce((s, o) => s + parseFloat(o.totalUSD.toString()), 0);
  const totalLocal = completed.reduce((s, o) => s + parseFloat(o.totalLocal.toString()), 0);

  // Desglose por método de pago
  const paymentMethodLabels: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
    pagomovil: { label: 'Pagomóvil', icon: <Smartphone size={18} />, color: 'text-accent' },
    efectivo_bs: { label: 'Efectivo Bs', icon: <Coins size={18} />, color: 'text-success' },
    efectivo_usd: { label: 'Efectivo $', icon: <Banknote size={18} />, color: 'text-primary' },
    punto: { label: 'Punto', icon: <CreditCard size={18} />, color: 'text-secondary' },
  };

  const paymentsByMethod = paidOrders.reduce((acc, o) => {
    if (o.paymentMethod) {
      acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalUSD;
    }
    return acc;
  }, {} as Record<PaymentMethod, number>);

  const totalPaidUSD = paidOrders.reduce((s, o) => s + o.totalUSD, 0);
  const totalPendingUSD = pendingOrders.reduce((s, o) => s + o.totalUSD, 0);

  // Productos más vendidos (ranking)
  const productSales = completed.reduce((acc, o) => {
    o.items.forEach(item => {
      const existing = acc.find(p => p.id === item.product.id);
      if (existing) {
        existing.qty += item.quantity;
        existing.revenueUSD += parseFloat(item.product.price.toString()) * item.quantity;
      } else {
        acc.push({
          id: item.product.id,
          name: item.product.name,
          qty: item.quantity,
          revenueUSD: parseFloat(item.product.price.toString()) * item.quantity,
        });
      }
    });
    return acc;
  }, [] as { id: string; name: string; qty: number; revenueUSD: number }[])
    .sort((a, b) => b.qty - a.qty);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-muted-foreground font-medium">Cargando reporte...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="animate-slide-in text-center py-20">
        <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold font-display">Sin datos</h2>
        <p className="text-muted-foreground">Abre la caja para iniciar el día o selecciona un cierre del historial.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/historial')}>
          Ver Historial
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {(id || !session.isOpen) && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/historial')}>
              <ArrowLeft size={20} />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold font-display">
              {id || !session.isOpen ? 'Resumen de Cierre' : 'Resumen del Día'}
            </h1>
            <p className="text-muted-foreground">
              {session.date} — <RateDisplay rate={session.exchangeRate} variant="badge" /> • 
              {session.isOpen ? ' (En curso)' : ' (Cerrado)'}
            </p>
          </div>
        </div>

        <Dialog open={isManualOrderOpen} onOpenChange={setIsManualOrderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
              <Plus size={18} /> Cargar Faltante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cargar Pedido Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nombre del Cliente</label>
                <Input placeholder="Ej. Cliente Histórico" value={manualCustomer} onChange={e => setManualCustomer(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Productos</label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddManualItem} className="h-7 text-xs gap-1">
                    <Plus size={14} /> Añadir
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                  {manualItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Select 
                        value={item.productId} 
                        onValueChange={(val) => setManualItems(manualItems.map((mi, i) => i === idx ? {...mi, productId: val} : mi))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {state.products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {(() => {
                        const selectedProduct = state.products.find(p => p.id === item.productId);
                        const isWeight = selectedProduct?.soldByWeight;
                        return (
                          <>
                            <Input 
                              type="number" 
                              min={isWeight ? 0 : 1}
                              step={isWeight ? 0.01 : 1}
                              className="w-20" 
                              value={item.quantity} 
                              onChange={e => setManualItems(manualItems.map((mi, i) => i === idx ? {...mi, quantity: parseFloat(e.target.value) || (isWeight ? 0 : 1)} : mi))} 
                            />
                            {isWeight && <span className="text-xs font-bold text-muted-foreground">kg</span>}
                          </>
                        );
                      })()}
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveManualItem(idx)} className="text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleManualSubmit} disabled={!manualCustomer.trim() || manualItems.length === 0}>
                Guardar Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Pedidos completados" value={completed.length} icon={CheckCircle2} />
        <StatCard label="Total USD" value={`$${totalUSD.toFixed(2)}`} icon={DollarSign} />
        <StatCard label="Total Bs" value={totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2 })} icon={TrendingUp} />
      </div>

      {/* Desglose por método de pago */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="pos-card p-6">
          <h3 className="font-bold text-lg font-display mb-4 flex items-center gap-2">
            <Banknote className="text-success" size={20} />
            Ingresos por Método (USD)
          </h3>
          {paidOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay pedidos pagados</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(paymentMethodLabels).map(([method, { label, icon, color }]) => {
                const amount = paymentsByMethod[method as PaymentMethod] || 0;
                if (amount === 0) return null;
                return (
                  <div key={method} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={color}>{icon}</span>
                      <span className="font-medium">{label}</span>
                    </div>
                    <span className="font-bold text-success">${amount.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="font-bold">Total Pagado</span>
                <span className="font-bold text-success text-lg">${totalPaidUSD.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="pos-card p-6">
          <h3 className="font-bold text-lg font-display mb-4 flex items-center gap-2">
            <AlertCircle className="text-destructive" size={20} />
            Pendientes por Cobrar
          </h3>
          {pendingOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay pedidos pendientes</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="font-medium">Pedidos Pendientes</span>
                <span className="font-bold text-destructive">{pendingOrders.length}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="font-bold">Total Pendiente</span>
                <span className="font-bold text-destructive text-lg">${totalPendingUSD.toFixed(2)}</span>
              </div>
              {pendingOrders.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => navigate('/pendientes')}
                >
                  Ver Pedidos Pendientes
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Productos más vendidos */}
      {productSales.length > 0 && (
        <div className="pos-card p-6 mb-8">
          <h2 className="font-bold text-lg font-display mb-4 flex items-center gap-2">
            <Package className="text-primary" size={20} />
            Productos Más Vendidos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground font-bold">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4 text-right">Cantidad</th>
                  <th className="pb-3 pr-4 text-right">Total USD</th>
                  <th className="pb-3 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {productSales.map((p, idx) => {
                  const pct = ((p.qty / productSales.reduce((s, x) => s + x.qty, 0)) * 100).toFixed(1);
                  return (
                    <tr key={p.id} className={`border-b border-border/30 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                      <td className="py-3 pr-4 font-bold text-primary">{idx + 1}</td>
                      <td className="py-3 pr-4 font-medium">{p.name}</td>
                      <td className="py-3 pr-4 text-right font-bold">{p.qty.toFixed(p.qty % 1 === 0 ? 0 : 2)}</td>
                      <td className="py-3 pr-4 text-right text-success font-bold">${p.revenueUSD.toFixed(2)}</td>
                      <td className="py-3 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="pos-card mb-8 p-6">
          <h2 className="font-bold text-lg font-display mb-4 flex items-center gap-2">
            <ClipboardList className="text-muted-foreground" size={20} />
            Detalle de Ventas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground font-bold">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Productos</th>
                  <th className="pb-3 pr-4 text-right">USD</th>
                  <th className="pb-3 pr-4 text-right">Bs</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((o, idx) => (
                  <tr key={o.id} className={`border-b border-border/30 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'} hover:bg-muted/20`}>
                    <td className="py-3 pr-4 font-bold text-primary">{o.ticketNumber}</td>
                    <td className="py-3 pr-4 font-medium">
                      {o.customerName}
                      {o.paymentMethod && (
                        <span className="ml-2 text-[10px] font-bold text-muted-foreground">
                          • {paymentMethodLabels[o.paymentMethod]?.label}
                          {o.paymentMethod === 'pagomovil' && o.paymentReference && (
                            <span className="ml-1 font-mono">(Ref: {o.paymentReference})</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground italic text-xs">
                      {o.items.map(i => formatItemSummary(i.quantity, i.product.name, i.product.soldByWeight)).join(', ')}
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-success">${parseFloat(o.totalUSD.toString()).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-right font-medium">{parseFloat(o.totalLocal.toString()).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteOrder(o.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
</tbody>
              <tfoot className="bg-muted/20">
                <tr className="font-bold text-base">
                  <td colSpan={3} className="py-4 text-right pr-4 uppercase tracking-tighter text-xs text-muted-foreground">Totales de Venta:</td>
                  <td className="py-4 text-right pr-4 text-success font-display font-black">${totalUSD.toFixed(2)}</td>
                  <td className="py-4 text-right font-display font-black text-warning">{totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {(!session.isOpen && !id) && (
        <Button size="lg" className="w-full py-7 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all" onClick={() => { resetDay(); navigate('/caja'); }}>
          Iniciar Nuevo Día de Ventas
        </Button>
      )}
    </div>
  );
}
