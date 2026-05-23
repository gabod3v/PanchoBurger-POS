import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, UtensilsCrossed } from 'lucide-react';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { OrderStatus } from '@/types';
import { formatQty } from '@/lib/format';

export default function KitchenDisplay() {
    const { state, updateOrderStatus } = useApp();

    // En cocina solo nos importan pendientes y listos (no completados)
    const pendingOrders = state.orders.filter(o => o.status === 'pending');
    const readyOrders = state.orders.filter(o => o.status === 'ready');

    const renderOrder = (o: typeof state.orders[0]) => (
        <div
            key={o.id}
            className="bg-amber-50 border border-amber-200/60 shadow-sm rounded-b-lg overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col"
        >
            {/* Top dashed perforation */}
            <div className="border-t-2 border-dashed border-amber-300" />

            <div className="p-6 flex flex-col gap-4 flex-1">
                {/* Header: ticket number + customer + status */}
                <div className="flex justify-between items-start border-b border-dashed border-amber-300/50 pb-4">
                    <div>
                        <span className="text-4xl font-bold font-mono text-primary block leading-none tracking-tighter">
                            #{o.ticketNumber}
                        </span>
                        <span className="text-xl font-semibold mt-2 block text-foreground">
                            {o.customerName}
                        </span>
                    </div>
                    <OrderStatusBadge status={o.status} className="text-sm px-4 py-2 shrink-0" />
                </div>

                {/* Items list */}
                <div className="flex-1">
                    <ul className="space-y-3">
                        {o.items.map((i, idx) => (
                            <li key={idx} className="text-2xl font-medium flex items-center gap-3">
                                <span className="text-amber-700 font-bold text-lg min-w-[4rem] shrink-0">
                                    {formatQty(i.quantity, i.product.soldByWeight)}
                                </span>
                                <span className="text-foreground/90">{i.product.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t border-dashed border-amber-300/50 mt-auto">
                    {o.status === 'pending' && (
                        <Button
                            size="lg"
                            className="w-full text-lg h-14 gap-2 shadow-sm"
                            onClick={() => updateOrderStatus(o.id, 'ready')}
                        >
                            Marcar Listo <ChevronRight size={24} />
                        </Button>
                    )}
                    {o.status === 'ready' && (
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full text-lg h-14 border-amber-200/60"
                            onClick={() => updateOrderStatus(o.id, 'completed')}
                        >
                            Entregado / Completar
                        </Button>
                    )}
                </div>
            </div>

            {/* Bottom dashed perforation */}
            <div className="border-b-2 border-dashed border-amber-300" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-display">Pantalla de Cocina</h1>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-card rounded-lg border border-border/50 shadow-sm">
                        <span className="text-muted-foreground mr-2">Pendientes:</span>
                        <span className="text-xl font-bold text-warning">{pendingOrders.length}</span>
                    </div>
                    <div className="px-4 py-2 bg-card rounded-lg border border-border/50 shadow-sm">
                        <span className="text-muted-foreground mr-2">Listos:</span>
                        <span className="text-xl font-bold text-info">{readyOrders.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {pendingOrders.map(renderOrder)}
                {readyOrders.map(renderOrder)}

                {pendingOrders.length === 0 && readyOrders.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-amber-300/50 rounded-lg">
                        <UtensilsCrossed size={40} className="mb-3 text-amber-300/50" strokeWidth={1} />
                        <p className="text-2xl font-medium">Sin pedidos en cocina</p>
                        <p className="mt-2">Todo al día</p>
                    </div>
                )}
            </div>
        </div>
    );
}
