import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ShoppingBag, Ticket } from 'lucide-react';
import { OrderItem } from '@/types';
import { toast } from 'sonner';

export default function NewOrder() {
  const { state, addOrder } = useApp();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<Record<string, number>>({});

  const { currentDay, products } = state;

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

  if (products.length === 0) {
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
    product: products.find(p => p.id === id)!,
    quantity: qty,
  }));

  const totalUSD = orderItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalLocal = totalUSD * currentDay.exchangeRate;

  const handleSubmit = () => {
    if (!customerName.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    addOrder(customerName.trim(), orderItems);
    toast.success(`Pedido #${state.nextTicket} creado`, {
      description: `Cliente: ${customerName.trim()}`,
    });
    setCustomerName('');
    setItems({});
  };

  return (
    <div className="animate-slide-in">
      <h1 className="text-3xl font-bold font-display mb-6">Nuevo Pedido</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Nombre del cliente"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="mb-4 text-lg"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {products.map(p => {
              const qty = items[p.id] || 0;
              return (
                <div key={p.id} className={`pos-card flex items-center justify-between transition-colors ${qty > 0 ? 'ring-2 ring-primary/30' : ''}`}>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">${p.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQty(p.id, -1)} disabled={qty === 0}>
                      <Minus size={16} />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">{qty}</span>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQty(p.id, 1)}>
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="pos-card h-fit sticky top-8">
          <h3 className="font-semibold font-display text-lg mb-4 flex items-center gap-2">
            <Ticket size={20} className="text-primary" />
            Ticket #{state.nextTicket}
          </h3>
          {orderItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Selecciona productos</p>
          ) : (
            <div className="space-y-2 mb-4">
              {orderItems.map(i => (
                <div key={i.product.id} className="flex justify-between text-sm">
                  <span>{i.quantity}x {i.product.name}</span>
                  <span className="font-medium">${(i.product.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between font-bold text-lg">
              <span>Total USD</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Bs</span>
              <span>{totalLocal.toFixed(2)} Bs</span>
            </div>
          </div>
          <Button className="w-full mt-4" size="lg" onClick={handleSubmit} disabled={orderItems.length === 0}>
            Confirmar Pedido
          </Button>
        </div>
      </div>
    </div>
  );
}
