import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { formatQty } from '@/lib/format';
import type { Order, PaymentMethod } from '@/types';

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: () => void;
}

const paymentMethodLabels: Record<PaymentMethod, { label: string }> = {
  pagomovil: { label: 'Pago Móvil' },
  efectivo_bs: { label: 'Efectivo Bs' },
  efectivo_usd: { label: 'Efectivo USD' },
  punto: { label: 'Punto de Venta' },
};

export function OrderDetailModal({ order, open, onOpenChange, onPaymentComplete }: OrderDetailModalProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { state, registerPayment } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo_bs');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customRate, setCustomRate] = useState(state.currentDay?.exchangeRate || 0);
  const [customBsAmount, setCustomBsAmount] = useState(0);

  useEffect(() => {
    if (order && state.currentDay) {
      const rate = state.currentDay.exchangeRate;
      setCustomRate(rate);
      setCustomBsAmount(order.totalUSD * rate);
    }
  }, [order]);

  if (!order || !open) return null;

  const handlePayOrder = async () => {
    if (!order || isProcessing) return;
    if (paymentMethod === 'pagomovil' && !paymentReference) {
      toast.error('Ingresa la referencia');
      return;
    }
    setIsProcessing(true);
    try {
      await registerPayment(
        order.id,
        paymentMethod,
        paymentMethod === 'pagomovil' ? paymentReference : undefined,
        customBsAmount,
      );
      toast.success('Pago registrado');
      onPaymentComplete?.();
      onOpenChange(false);
    } catch {
      toast.error('Error al registrar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const showRevalued = order.paymentStatus === 'pending' && state.currentDay;
  const revaluedLocal = showRevalued ? order.totalUSD * state.currentDay!.exchangeRate : 0;
  const hasRevaluation = showRevalued && Math.abs(revaluedLocal - order.totalLocal) > 0.01;

  const content = (
    <div className="space-y-4 px-4 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Ticket #{order.ticketNumber}</h2>
          <p className="text-lg font-semibold">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('es-VE', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Separator />

      {/* Items */}
      <div className="space-y-2">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-1 text-sm">
            <span>
              <span className="font-semibold">
                {formatQty(item.quantity, item.product.soldByWeight)}
                {!item.product.soldByWeight && '×'}
              </span>
              {' '}
              <span>{item.product.name}</span>
            </span>
            <span className="font-medium tabular-nums">
              ${(item.product.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total USD</span>
          <span className="text-lg font-bold">${order.totalUSD.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Local</span>
          <div className="text-right">
            <span className={hasRevaluation ? 'text-muted-foreground line-through' : ''}>
              {order.totalLocal.toFixed(2)} Bs
            </span>
            {hasRevaluation && (
              <p className="text-warning text-sm">
                ↻ {revaluedLocal.toFixed(2)} Bs (tasa actual)
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Payment Section */}
      {order.paymentStatus === 'paid' ? (
        <div className="bg-muted/50 rounded-lg p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Pagado</p>
          {order.paymentMethod && (
            <p className="font-semibold">{paymentMethodLabels[order.paymentMethod]?.label}</p>
          )}
          {order.paymentMethod === 'pagomovil' && order.paymentReference && (
            <p className="text-sm text-muted-foreground">Ref: {order.paymentReference}</p>
          )}
          {order.paidAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(order.paidAt).toLocaleDateString('es-VE', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-destructive font-medium">Sin pagar</p>

          {showRevalued && (
            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Configurar pago
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tasa Bs/USD</label>
                  <Input
                    type="number"
                    value={customRate}
                    onChange={e => {
                      const r = parseFloat(e.target.value) || 0;
                      setCustomRate(r);
                      setCustomBsAmount(order.totalUSD * r);
                    }}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Total Bs</label>
                  <Input
                    type="number"
                    value={customBsAmount.toFixed(2)}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setCustomBsAmount(val);
                      setCustomRate(val > 0 ? val / order.totalUSD : 0);
                    }}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              Método de Pago
            </label>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </div>
          {paymentMethod === 'pagomovil' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Referencia (últimos 4 dígitos)
              </label>
              <Input
                placeholder="Ej: 1234"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-32"
              />
            </div>
          )}
          <Button className="w-full" size="lg" onClick={handlePayOrder} disabled={isProcessing}>
            {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate(`/nuevo-pedido?edit=${order.id}`)}
        >
          Editar Pedido
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onOpenChange(false)}
        >
          Cerrar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalle del Pedido</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle del Pedido</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
