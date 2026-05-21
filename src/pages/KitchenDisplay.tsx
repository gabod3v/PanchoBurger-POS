import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { OrderStatus } from '@/types';
import { formatQty } from '@/lib/format';

export default function KitchenDisplay() {
    const { state, updateOrderStatus } = useApp();

    // En cocina solo nos importan pendientes y listos (no completados)
    const pendingOrders = state.orders.filter(o => o.status === 'pending');
    const readyOrders = state.orders.filter(o => o.status === 'ready');

    const renderOrder = (o: typeof state.orders[0]) => (
        <div key={o.id} className="bg-card rounded-xl border-2 border-border shadow-md p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                    <span className="text-4xl font-bold font-display text-primary block leading-none">#{o.ticketNumber}</span>
                    <span className="text-xl font-semibold mt-2 block">{o.customerName}</span>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${o.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'
                    }`}>
                    {o.status === 'pending' ? 'Pendiente' : 'Listo'}
                </span>
            </div>

            <div className="flex-1">
                <ul className="space-y-3">
                    {o.items.map((i, idx) => (
                        <li key={idx} className="text-2xl font-medium flex items-center gap-3">
                            <span className="w-auto min-w-[3rem] h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 px-3">
                                {formatQty(i.quantity, i.product.soldByWeight)}
                            </span>
                            <span>{i.product.name}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pt-4 border-t border-border mt-auto">
                {o.status === 'pending' && (
                    <Button
                        size="lg"
                        className="w-full text-lg h-14 gap-2"
                        onClick={() => updateOrderStatus(o.id, 'ready')}
                    >
                        Marcar Listo <ChevronRight size={24} />
                    </Button>
                )}
                {o.status === 'ready' && (
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full text-lg h-14"
                        onClick={() => updateOrderStatus(o.id, 'completed')}
                    >
                        Entregado / Completar
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-display">Pantalla de Cocina</h1>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-card rounded-lg border border-border shadow-sm">
                        <span className="text-muted-foreground mr-2">Pendientes:</span>
                        <span className="text-xl font-bold text-warning">{pendingOrders.length}</span>
                    </div>
                    <div className="px-4 py-2 bg-card rounded-lg border border-border shadow-sm">
                        <span className="text-muted-foreground mr-2">Listos:</span>
                        <span className="text-xl font-bold text-info">{readyOrders.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {pendingOrders.map(renderOrder)}
                {readyOrders.map(renderOrder)}

                {pendingOrders.length === 0 && readyOrders.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <p className="text-2xl font-medium">Sin pedidos en cocina</p>
                        <p className="mt-2">Todo al día</p>
                    </div>
                )}
            </div>
        </div>
    );
}
