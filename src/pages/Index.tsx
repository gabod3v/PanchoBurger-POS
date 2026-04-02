import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Wallet, PlusCircle, ClipboardList, BarChart3, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { state } = useApp();
  const { currentDay, orders, products } = state;

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalUSD = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalUSD, 0);
  const totalLocal = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalLocal, 0);

  return (
    <div className="animate-slide-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {currentDay?.isOpen
            ? `Caja abierta — ${currentDay.date} — Tasa: ${currentDay.exchangeRate} Bs/$`
            : 'Caja cerrada. Abre la caja para comenzar.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="pos-stat">
          <span className="text-xs text-muted-foreground font-medium">Pendientes</span>
          <span className="text-2xl font-bold font-display text-warning">{pendingOrders}</span>
        </div>
        <div className="pos-stat">
          <span className="text-xs text-muted-foreground font-medium">Listos</span>
          <span className="text-2xl font-bold font-display text-info">{readyOrders}</span>
        </div>
        <div className="pos-stat">
          <span className="text-xs text-muted-foreground font-medium">Completados</span>
          <span className="text-2xl font-bold font-display text-success">{completedOrders}</span>
        </div>
        <div className="pos-stat">
          <span className="text-xs text-muted-foreground font-medium">Vendido (USD)</span>
          <span className="text-2xl font-bold font-display">${totalUSD.toFixed(2)}</span>
        </div>
      </div>

      {currentDay?.isOpen && totalLocal > 0 && (
        <div className="pos-card mb-8 flex items-center gap-4">
          <DollarSign className="text-primary" size={24} />
          <div>
            <p className="text-sm text-muted-foreground">Total vendido en Bs</p>
            <p className="text-xl font-bold font-display">{totalLocal.toFixed(2)} Bs</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold font-display mb-4">Acciones rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { to: '/nuevo-pedido', icon: PlusCircle, label: 'Nuevo Pedido', color: 'bg-primary text-primary-foreground' },
          { to: '/pedidos', icon: ClipboardList, label: 'Ver Pedidos', color: 'bg-info text-info-foreground' },
          { to: '/caja', icon: Wallet, label: 'Caja', color: 'bg-warning text-warning-foreground' },
          { to: '/menu', icon: UtensilsCrossed, label: 'Menú', color: 'bg-accent text-accent-foreground' },
          { to: '/resumen', icon: BarChart3, label: 'Resumen del Día', color: 'bg-success text-success-foreground' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className={`${color} rounded-xl p-5 flex flex-col items-center gap-3 text-center font-medium transition-transform hover:scale-[1.03] active:scale-[0.98]`}
          >
            <Icon size={28} />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
