import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, ShoppingBag, Ticket, Search, ArrowLeft, Banknote, Clock } from 'lucide-react';
import WeightStepper from '@/components/WeightStepper';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { OrderItem, PaymentMethod, PaymentStatus } from '@/types';
import { formatQty, formatUnitPrice } from '@/lib/format';
import { toast } from 'sonner';

export default function NewOrder() {
  const { state, addOrder, deleteOrder } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [items, setItems] = useState<Record<string, number>>({});
  const [originalTicket, setOriginalTicket] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo_bs');
  const [paymentReference, setPaymentReference] = useState('');
  const [willPayNow, setWillPayNow] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentDay, products } = state;
  const exchangeRate = currentDay?.exchangeRate || 0;

  // Safety: Ensure products always have a price calculated from Bs if they are is_price_in_bs
  const processedProducts = products.map(p => {
    if (p.is_price_in_bs && p.price === 0 && exchangeRate > 0) {
      return { ...p, price: (p.price_bs || 0) / exchangeRate };
    }
    return p;
  });

  useEffect(() => {
    if (editId) {
      const order = state.orders.find(o => o.id === editId);
      if (order) {
        setCustomerName(order.customerName);
        setOriginalTicket(order.ticketNumber);
        setPaymentMethod(order.paymentMethod || 'efectivo_bs');
        const cartItems: Record<string, number> = {};
        order.items.forEach(i => {
          cartItems[i.product.id] = i.quantity;
        });
        setItems(cartItems);
      }
    }
  }, [editId, state.orders]);

  if (!currentDay?.isOpen) {
    return (
      <div className="animate-slide-in text-center py-20">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold font-display mb-2">Caja Cerrada</h2>
        <p className="text-muted-foreground">Debes abrir la caja antes de registrar pedidos.</p>
        <Button className="mt-4" onClick={() => navigate('/caja')}>Ir a Caja</Button>
      </div>
    );
  }

  if (processedProducts.length === 0) {
    return (
      <div className="animate-slide-in text-center py-20">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold font-display mb-2">Sin Productos</h2>
        <p className="text-muted-foreground">Agrega productos al menú primero.</p>
        <Button className="mt-4" onClick={() => navigate('/menu')}>Ir al Menú</Button>
      </div>
    );
  }

  const updateQty = (productId: string, delta: number) => {
    setItems(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const orderItems: OrderItem[] = Object.entries(items).map(([id, qty]) => ({
    product: processedProducts.find(p => p.id === id)!,
    quantity: qty,
  }));

  const totalUSD = orderItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalLocal = totalUSD * exchangeRate;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!customerName.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editId) {
        await deleteOrder(editId);
      }

      await addOrder(
        customerName.trim(), 
        orderItems, 
        state.currentDay?.id || undefined, 
        originalTicket || undefined,
        willPayNow ? 'paid' : 'pending',
        willPayNow ? paymentMethod : undefined,
        willPayNow ? paymentReference : undefined
      );

      toast.success(editId ? `Pedido #${originalTicket} actualizado` : `Pedido #${state.nextTicket} creado`, {
        description: willPayNow ? `Pagado con ${paymentMethod}` : 'Pago pendiente',
      });

      if (editId) {
        navigate('/pedidos');
      } else {
        setCustomerName('');
        setItems({});
        setOriginalTicket(null);
        setWillPayNow(true);
        setPaymentMethod('efectivo_bs');
        setPaymentReference('');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error al guardar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-in">
      <div className="flex items-center gap-4 mb-6">
        {editId && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/pedidos')}>
            <ArrowLeft size={20} />
          </Button>
        )}
        <h1 className="text-3xl font-bold font-display">
          {editId ? `Editando Pedido #${originalTicket}` : 'Nuevo Pedido'}
        </h1>
        {currentDay && (
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border border-border/40 shadow-inner-sm">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tasa BCV/Día:</span>
            <span className="font-display font-bold text-primary">{currentDay.exchangeRate?.toFixed(4)} Bs</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Nombre del cliente"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="mb-4 text-lg"
          />

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors" size={18} />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-card border-border/30 focus-visible:ring-1 focus-visible:ring-primary/50 shadow-sm rounded-lg transition-all"
            />
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setWillPayNow(!willPayNow)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all font-medium w-full ${
                willPayNow
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-warning/10 border-warning/30 text-warning'
              }`}
            >
              {willPayNow ? <Banknote size={20} /> : <Clock size={20} />}
              <span>{willPayNow ? 'El cliente paga ahora' : 'El cliente paga después'}</span>
            </button>
          </div>

          {willPayNow && (
            <>
              <div className="mb-6">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Método de Pago</label>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {paymentMethod === 'pagomovil' && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Referencia (últimos 4 dígitos)</label>
                  <Input
                    placeholder="Ej: 1234"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="w-32"
                  />
                </div>
              )}
            </>
          )}

          <ScrollArea className="w-full whitespace-nowrap mb-8 pb-3">
            <div className="flex w-max space-x-3">
              {['Todas', ...state.categories.map(c => c.name).filter(c => c !== 'Otros'), 'Otros'].map(cat => {
                const isActive = activeCategory === cat;
                return (
                  <Button
                    key={cat}
                    variant={isActive ? 'default' : 'outline'}
                    className={`rounded-full px-6 transition-all duration-300 font-medium ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/50'}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {processedProducts
              .filter(p => activeCategory === 'Todas' || p.category === activeCategory || (!p.category && activeCategory === 'Otros'))
              .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(p => {
                const qty = items[p.id] || 0;
                return (
                  <div key={p.id} className={`pos-card pos-card-hover flex flex-col justify-between transition-all gap-4 p-5 ${qty > 0 ? 'ring-1 ring-primary/20 bg-muted/20' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 cursor-pointer" onClick={() => updateQty(p.id, 1)}>
                        <p className="font-semibold text-[1.05rem] text-foreground leading-tight tracking-tight mb-1.5">{p.name}</p>
                        {p.is_price_in_bs ? (
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-bold text-primary">{p.price_bs?.toFixed(2)} Bs</p>
                            <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight">≈ ${p.price.toFixed(2)} USD</p>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-secondary">${p.price.toFixed(2)} USD</p>
                        )}
                      </div>
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shadow-sm shrink-0 border border-border/40" />
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/30 pt-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{p.category || 'Otros'}</span>
                      {p.soldByWeight ? (
                        <WeightStepper
                          value={qty}
                          onChange={(val) => updateQty(p.id, val - qty)}
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 bg-muted/30 rounded-full p-1 border border-border/50">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm" onClick={() => updateQty(p.id, -1)} disabled={qty === 0}>
                            <Minus size={14} />
                          </Button>
                          <span className="w-6 text-center font-bold text-sm">{qty}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background hover:shadow-sm" onClick={() => updateQty(p.id, 1)}>
                            <Plus size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        {/* Summary */}
        <div className="pos-card h-fit sticky top-8 flex flex-col gap-4">
          <div className="border-b border-border/40 pb-4">
            <h3 className="font-semibold font-display text-xl flex items-center gap-2 tracking-tight">
              <Ticket size={20} className="text-secondary" />
              {editId ? `Ticket #${originalTicket}` : `Resumen Ticket #${state.nextTicket}`}
            </h3>
          </div>

          {orderItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center opacity-50">
              <ShoppingBag size={32} className="mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center font-medium">No hay productos seleccionados</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[40vh] pr-4 -mr-4">
              <div className="space-y-4">
                {orderItems.map(i => (
                  <div key={i.product.id} className="flex justify-between items-start text-sm group">
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-muted-foreground bg-muted w-8 h-6 rounded-md flex items-center justify-center text-xs shrink-0">{formatQty(i.quantity, i.product.soldByWeight)}</span>
                      <div className="flex flex-col">
                        <span className="font-medium group-hover:text-primary transition-colors">{i.product.name}</span>
                        {i.product.is_price_in_bs && (
                          <span className="text-[10px] text-muted-foreground/80 font-bold">{(i.product.price_bs || 0) * i.quantity} Bs</span>
                        )}
                        {i.product.soldByWeight && (
                          <span className="text-[10px] text-muted-foreground/80 font-medium">{formatUnitPrice(i.product.price, true)}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-medium mt-0.5 text-right whitespace-nowrap ml-4">${(i.product.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="border-t border-border/40 pt-4 mt-auto space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Final</span>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black font-display tracking-tight text-foreground leading-none">${totalUSD.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">USD (Dólares)</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 px-4 bg-muted/40 rounded-lg border border-border/10">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pago en Bs</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-display text-primary">{totalLocal.toFixed(2)}</span>
                <span className="text-[10px] font-black text-primary/80 uppercase">Bs</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-2 h-14 text-base tracking-wide uppercase font-bold shadow-md hover:shadow-lg transition-all"
            size="lg"
            onClick={handleSubmit}
            disabled={orderItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Confirmar Pedido')}
          </Button>
        </div>
      </div>
    </div>
  );
}

