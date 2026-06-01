import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, ChevronRight, Clock, CheckCircle2, Search, Receipt, DollarSign, Circle } from 'lucide-react';
import RateDisplay from '@/components/RateDisplay';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import type { DaySession } from '@/types';

// --- Pure functions (exported for testing) ---

export interface SessionStats {
  sessionId: string;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenueUSD: number;
}

interface RawOrder {
  day_session_id: string;
  payment_status: string;
  total_usd: number;
}

export function computeSessionStats(orders: RawOrder[]): Record<string, SessionStats> {
  const statsMap: Record<string, SessionStats> = {};

  for (const order of orders) {
    if (!statsMap[order.day_session_id]) {
      statsMap[order.day_session_id] = {
        sessionId: order.day_session_id,
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        totalRevenueUSD: 0,
      };
    }

    const stat = statsMap[order.day_session_id];
    stat.totalOrders += 1;

    if (order.payment_status === 'paid') {
      stat.paidOrders += 1;
    } else {
      stat.pendingOrders += 1;
    }

    stat.totalRevenueUSD += Number(order.total_usd);
  }

  return statsMap;
}

export function filterSessionsByDate(sessions: DaySession[], dateFilter: string): DaySession[] {
  if (!dateFilter) return sessions;
  return sessions.filter(s => s.openedAt.startsWith(dateFilter));
}

// --- Component ---

export default function HistoryPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState('');
  const [sessionStats, setSessionStats] = useState<Record<string, SessionStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (state.sessions.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const sessionIds = state.sessions.map(s => s.id);
        const { data: ordersData } = await supabase!
          .from('pedidos')
          .select('day_session_id, payment_status, total_usd')
          .in('day_session_id', sessionIds);

        if (ordersData && ordersData.length > 0) {
          const stats = computeSessionStats(ordersData);
          setSessionStats(stats);
        } else {
          setSessionStats({});
        }
      } catch (e) {
        console.error('Error fetching session stats:', e);
        setSessionStats({});
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [state.sessions]);

  const filtered = filterSessionsByDate(state.sessions, dateFilter);

  return (
    <div className="animate-slide-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Historial de Cierres</h1>
      </div>

      {state.sessions.length > 0 && (
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-fit"
          />
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed border-border/50 shadow-sm">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay registros</h3>
            <p className="text-muted-foreground">Los días cerrados aparecerán aquí.</p>
          </div>
        ) : (
          filtered.map((session) => {
            const stats = sessionStats[session.id];

            return (
              <Card 
                key={session.id} 
                className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-md group overflow-hidden"
                onClick={() => navigate(`/resumen/${session.id}`)}
              >
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg mr-4 ${session.isOpen ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {session.isOpen ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{session.date}</h3>
                          {session.isOpen && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold uppercase tracking-wider">
                              Abierto
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <RateDisplay rate={session.exchangeRate} variant="badge" /> • {new Date(session.openedAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="text-right mr-4 hidden sm:block">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Estado</p>
                        <p className="font-semibold">{session.isOpen ? 'En curso' : 'Finalizado'}</p>
                      </div>

                      <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    {stats && (
                      <div className="mt-3 bg-muted/30 rounded-lg p-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Receipt size={14} />
                          {stats.totalOrders} {stats.totalOrders === 1 ? 'pedido' : 'pedidos'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          ${stats.totalRevenueUSD.toFixed(2)}
                        </span>
                        {stats.pendingOrders > 0 && (
                          <span className="flex items-center gap-1">
                            <Circle size={14} />
                            {stats.pendingOrders} {stats.pendingOrders === 1 ? 'pendiente' : 'pendientes'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
