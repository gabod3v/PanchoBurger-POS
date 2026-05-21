import { Order } from '@/types';
import { formatQty } from '@/lib/format';

interface Props {
    order: Order | null;
}

const paymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
        pagomovil: 'Pagomóvil',
        efectivo_bs: 'Efectivo Bs',
        efectivo_usd: 'Efectivo USD',
        punto: 'Punto',
    };
    return labels[method] || method;
};

export default function PrintTicket({ order }: Props) {
    if (!order) return null;

    const date = new Date(order.createdAt).toLocaleString('es-VE');

    return (
        <div id="print-section" className="hidden p-4 w-[80mm] mx-auto text-black bg-white font-mono text-sm leading-tight">
            <div className="text-center mb-4">
                <h1 className="font-bold text-xl uppercase mb-1">Pancho Burger</h1>
                <p>RIF: J-12345678-9</p>
                <p>Av. Principal, Local 1</p>
                <p>--------------------------------</p>
            </div>

            <div className="mb-4">
                <p className="font-bold text-lg mb-1">TICKET #{order.ticketNumber}</p>
                <p>FECHA: {date}</p>
                <p>CLIENTE: <span className="font-bold uppercase">{order.customerName}</span></p>
                <p>ESTADO: {order.paymentStatus === 'paid' ? 'PAGADO' : 'PENDIENTE'}</p>
                {order.paymentMethod && (
                    <p>PAGO: {paymentMethodLabel(order.paymentMethod)}{order.paymentMethod === 'pagomovil' && order.paymentReference ? ` Ref: ${order.paymentReference}` : ''}</p>
                )}
                <p>--------------------------------</p>
            </div>

            <table className="w-full mb-4 text-left">
                <thead>
                    <tr className="border-b border-black">
                        <th className="font-bold pb-1 w-8">CANT</th>
                        <th className="font-bold pb-1 text-left">DESCRIPCION</th>
                        <th className="font-bold pb-1 text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((i, idx) => (
                        <tr key={idx}>
                            <td className="pt-2 align-top">{formatQty(i.quantity, i.product.soldByWeight)}</td>
                            <td className="pt-2 align-top break-words max-w-[120px]">{i.product.name}</td>
                            <td className="pt-2 align-top text-right">${(i.product.price * i.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-black pt-2 mb-6">
                <div className="flex justify-between font-bold text-lg mb-1">
                    <span>TOTAL USD:</span>
                    <span>${order.totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                    <span>TOTAL BS:</span>
                    <span>Bs {order.totalLocal.toFixed(2)}</span>
                </div>
            </div>

            <div className="text-center font-bold">
                <p>¡GRACIAS POR SU COMPRA!</p>
                <p className="font-normal text-xs mt-2">Visítanos en @panchoburger</p>
            </div>
        </div>
    );
}
