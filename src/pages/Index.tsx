import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, Wallet, PlusCircle, ClipboardList, BarChart3,
  ShoppingBag, DollarSign, Clock, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';

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
        <StatCard label="Pendientes" value={pendingOrders} icon={Clock} />
        <StatCard label="Listos" value={readyOrders} icon={CheckCircle2} />
        <StatCard label="Completados" value={completedOrders} icon={ShoppingBag} />
        <StatCard label="Vendido (USD)" value={`$${totalUSD.toFixed(2)}`} icon={TrendingUp} />
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
          { to: '/nuevo-pedido', icon: PlusCircle, label: 'Nuevo Pedido' },
          { to: '/pedidos', icon: ClipboardList, label: 'Ver Pedidos' },
          { to: '/caja', icon: Wallet, label: 'Caja' },
          { to: '/menu', icon: UtensilsCrossed, label: 'Menú' },
          { to: '/resumen', icon: BarChart3, label: 'Resumen del Día' },
        ].map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="bg-card border border-border/50 hover:bg-muted rounded-lg p-5 flex flex-col items-center gap-3 text-center font-medium text-foreground transition-all hover:scale-[1.03] active:scale-[0.98] shadow-sm"
          >
            <Icon size={28} className="text-muted-foreground" />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
