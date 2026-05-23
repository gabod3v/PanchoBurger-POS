import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, Wallet, PlusCircle, ClipboardList, BarChart3,
  ShoppingBag, DollarSign, Clock, CheckCircle2, TrendingUp,
  Package, Banknote, CreditCard, Smartphone, Coins, AlertCircle,
  AlertTriangle, History, Calendar, ArrowUp, ArrowDown, List,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import RateDisplay from '@/components/RateDisplay';
import { PaymentMethod } from '@/types';

const statusConfig = {
  pending: { label: 'Pendiente', classes: 'bg-warning/15 text-warning border-warning/20' },
  ready: { label: 'Listo', classes: 'bg-primary/15 text-primary border-primary/20' },
  completed: { label: 'Completado', classes: 'bg-success/15 text-success border-success/20' },
};

const paymentMethodLabels: Record<PaymentMethod, { label: string; color: string }> = {
  pagomovil: { label: 'Pagomóvil', color: 'text-accent' },
  efectivo_bs: { label: 'Efectivo Bs', color: 'text-success' },
  efectivo_usd: { label: 'Efectivo $', color: 'text-primary' },
  punto: { label: 'Punto', color: 'text-secondary' },
};

const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
  pagomovil: Smartphone,
  efectivo_bs: Coins,
  efectivo_usd: Banknote,
  punto: CreditCard,
};

export default function Dashboard() {
  const { state, fetchOrdersBySession } = useApp();
  const { currentDay, orders, products } = state;

  const [previousSessions, setPreviousSessions] = useState<{ date: string; totalUSD: number }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ── Computed: today's orders ──────────────────────────────
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingPaymentOrders = completedOrders.filter(o => o.paymentStatus === 'pending');

  const totalUSD = completedOrders.reduce((s, o) => s + o.totalUSD, 0);
  const totalLocal = completedOrders.reduce((s, o) => s + o.totalLocal, 0);

  // ── Top 5 productos más vendidos ──────────────────────────
  const topProducts = completedOrders
    .reduce((acc, o) => {
      o.items.forEach(item => {
        const existing = acc.find(p => p.id === item.product.id);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenueUSD += item.product.price * item.quantity;
        } else {
          acc.push({
            id: item.product.id,
            name: item.product.name,
            qty: item.quantity,
            revenueUSD: item.product.price * item.quantity,
          });
        }
      });
      return acc;
    }, [] as { id: string; name: string; qty: number; revenueUSD: number }[])
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const totalQtySold = topProducts.reduce((s, p) => s + p.qty, 0);

  // ── Desglose por método de pago ───────────────────────────
  const paymentsByMethod = completedOrders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((acc, o) => {
      if (o.paymentMethod) {
        acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalUSD;
      }
      return acc;
    }, {} as Record<PaymentMethod, number>);

  const totalPaidUSD = Object.values(paymentsByMethod).reduce((s, v) => s + v, 0);
  const totalPendingUSD = pendingPaymentOrders.reduce((s, o) => s + o.totalUSD, 0);

  // ── Últimos 5 pedidos ────────────────────────────────────
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // ── Historial de días anteriores ──────────────────────────
  useEffect(() => {
    const closed = state.sessions.filter(s => !s.isOpen).slice(0, 5);
    if (closed.length === 0) {
      setLoadingHistory(false);
      return;
    }

    let cancelled = false;
    Promise.all(closed.map(s => fetchOrdersBySession(s.id)))
      .then(results => {
        if (cancelled) return;
        const data = results.map((sessionOrders, i) => ({
          date: closed[i].date,
          totalUSD: sessionOrders
            .filter(o => o.status === 'completed')
            .reduce((s, o) => s + o.totalUSD, 0),
        }));
        setPreviousSessions(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => { cancelled = true; };
  }, [state.sessions, fetchOrdersBySession]);

  const avgPreviousUSD = previousSessions.length > 0
    ? previousSessions.reduce((s, d) => s + d.totalUSD, 0) / previousSessions.length
    : 0;

  const vsAverage = avgPreviousUSD > 0
    ? ((totalUSD - avgPreviousUSD) / avgPreviousUSD * 100)
    : null;

  // ── Alertas ──────────────────────────────────────────────
  const hasAlerts = pendingOrders.length > 0 || pendingPaymentOrders.length > 0;

  return (
    <div className="animate-slide-in space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {currentDay?.isOpen
              ? `Caja abierta — ${currentDay.date}`
              : 'Caja cerrada. Abre la caja para comenzar.'}
          </p>
        </div>
        {currentDay?.isOpen && (
          <Link
            to="/nuevo-pedido"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 font-semibold hover:opacity-90 transition-all active:scale-[0.97] shadow-sm"
          >
            <PlusCircle size={18} />
            Nuevo Pedido
          </Link>
        )}
      </div>

      {/* ── Tasa de Cambio (destacada) ──────────────────────── */}
      {currentDay?.isOpen && (
        <RateDisplay rate={currentDay.exchangeRate} date={currentDay.date} openedAt={currentDay.openedAt} />
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pendientes" value={pendingOrders.length} icon={Clock} />
        <StatCard label="Listos" value={readyOrders.length} icon={CheckCircle2} />
        <StatCard label="Completados" value={completedOrders.length} icon={ShoppingBag} />
        <StatCard label="Vendido (USD)" value={`$${totalUSD.toFixed(2)}`} icon={TrendingUp} />
      </div>

      {/* ── Main grid: Top Products + Payment Breakdown ────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="pos-card p-6">
          <h2 className="font-bold text-base font-display mb-4 flex items-center gap-2">
            <Package className="text-primary" size={18} />
            Productos Más Vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              {currentDay?.isOpen ? 'Aún no hay ventas hoy' : 'Sin ventas en este turno'}
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => {
                const pct = totalQtySold > 0 ? ((p.qty / totalQtySold) * 100).toFixed(0) : '0';
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-sm truncate">{p.name}</span>
                        <span className="text-sm font-bold ml-2">{p.qty.toFixed(p.qty % 1 === 0 ? 0 : 2)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cobros por método */}
        <div className="pos-card p-6">
          <h2 className="font-bold text-base font-display mb-4 flex items-center gap-2">
            <Banknote className="text-success" size={18} />
            Cobros del Día
          </h2>
          {totalPaidUSD === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              {currentDay?.isOpen ? 'Aún no hay cobros registrados' : 'Sin cobros en este turno'}
            </p>
          ) : (
            <div className="space-y-3">
              {(Object.entries(paymentMethodLabels) as [PaymentMethod, typeof paymentMethodLabels[PaymentMethod]][])
                .filter(([method]) => (paymentsByMethod[method] || 0) > 0)
                .map(([method, { label, color }]) => {
                  const Icon = paymentIcons[method];
                  const amount = paymentsByMethod[method] || 0;
                  const pct = ((amount / totalPaidUSD) * 100).toFixed(0);
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className={`flex items-center gap-2 ${color}`}>
                          <Icon size={16} />
                          <span className="font-medium">{label}</span>
                        </div>
                        <span className="font-bold">${amount.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${color.replace('text', 'bg')}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              <div className="flex items-center justify-between pt-3 border-t border-border/50 font-bold text-sm">
                <span>Total Cobrado</span>
                <span className="text-success">${totalPaidUSD.toFixed(2)}</span>
              </div>
              {totalPendingUSD > 0 && (
                <div className="flex items-center justify-between text-sm text-destructive font-medium">
                  <span>Pendiente por cobrar</span>
                  <span>${totalPendingUSD.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Últimos Pedidos ────────────────────────────────── */}
      {recentOrders.length > 0 && (
        <div className="pos-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base font-display flex items-center gap-2">
              <List className="text-muted-foreground" size={18} />
              Últimos Pedidos
            </h2>
            <Link to="/pedidos" className="text-sm text-primary font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground font-bold text-xs">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">Productos</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => {
                  const cfg = statusConfig[o.status];
                  const itemSummary = o.items.map(i =>
                    `${i.quantity.toFixed(i.product.soldByWeight ? 1 : 0)} ${i.product.name}`
                  ).join(', ');
                  return (
                    <tr key={o.id} className="border-b border-border/20">
                      <td className="py-3 pr-4 font-bold text-primary">{o.ticketNumber}</td>
                      <td className="py-3 pr-4 font-medium truncate max-w-[120px]">{o.customerName}</td>
                      <td className="py-3 pr-4 text-muted-foreground truncate max-w-[200px] hidden sm:table-cell">
                        {itemSummary}
                      </td>
                      <td className="py-3 pr-4 font-bold text-success">${o.totalUSD.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Progreso vs días anteriores + Alertas ──────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Progreso */}
        <div className="pos-card p-6">
          <h2 className="font-bold text-base font-display mb-4 flex items-center gap-2">
            <History className="text-muted-foreground" size={18} />
            Progreso vs Días Anteriores
          </h2>
          {loadingHistory ? (
            <p className="text-muted-foreground text-sm py-4 text-center animate-pulse">Cargando histórico...</p>
          ) : previousSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No hay suficientes datos. Completá al menos un día de ventas.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Comparativa */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                  <p className="text-2xl font-bold font-display">${totalUSD.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Promedio últimos {previousSessions.length} días</p>
                  <p className="text-2xl font-bold font-display">${avgPreviousUSD.toFixed(2)}</p>
                </div>
              </div>

              {vsAverage !== null && (
                <div className={`flex items-center gap-2 justify-center py-3 rounded-lg font-bold text-sm ${
                  vsAverage >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {vsAverage >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                  {Math.abs(vsAverage).toFixed(1)}% vs promedio
                </div>
              )}

              {/* Últimos cierres */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cierres recientes</p>
                {previousSessions.map(s => (
                  <div key={s.date} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} />
                      <span>{s.date}</span>
                    </div>
                    <span className="font-bold">${s.totalUSD.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="pos-card p-6">
          <h2 className="font-bold text-base font-display mb-4 flex items-center gap-2">
            <AlertCircle className="text-destructive" size={18} />
            Alertas
          </h2>
          {!hasAlerts ? (
            <p className="text-muted-foreground text-sm py-4 text-center flex flex-col items-center gap-2">
              <CheckCircle2 size={24} className="text-success" />
              Todo en orden
            </p>
          ) : (
            <div className="space-y-3">
              {pendingOrders.length > 0 && (
                <Link
                  to="/pedidos"
                  className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 hover:bg-warning/15 transition-colors"
                >
                  <Clock size={18} className="text-warning shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{pendingOrders.length} pedido{pendingOrders.length !== 1 ? 's' : ''} pendiente{pendingOrders.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Esperando preparación</p>
                  </div>
                  <ArrowUp size={16} className="text-muted-foreground rotate-90 shrink-0" />
                </Link>
              )}
              {pendingPaymentOrders.length > 0 && (
                <Link
                  to="/pendientes"
                  className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors"
                >
                  <AlertTriangle size={18} className="text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{pendingPaymentOrders.length} cobro{pendingPaymentOrders.length !== 1 ? 's' : ''} pendiente{pendingPaymentOrders.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">${totalPendingUSD.toFixed(2)} por cobrar</p>
                  </div>
                  <ArrowUp size={16} className="text-muted-foreground rotate-90 shrink-0" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones rápidas ───────────────────────────────── */}
      <div>
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
    </div>
  );
}
