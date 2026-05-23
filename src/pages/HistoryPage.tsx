import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronRight, DollarSign, Clock, CheckCircle2, Circle } from 'lucide-react';

export default function HistoryPage() {
  const { state } = useApp();
  const navigate = useNavigate();

  return (
    <div className="animate-slide-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Historial de Cierres</h1>
      </div>

      <div className="grid gap-4">
        {state.sessions.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed border-border/50 shadow-sm">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay registros</h3>
            <p className="text-muted-foreground">Los días cerrados aparecerán aquí.</p>
          </div>
        ) : (
          state.sessions.map((session) => (
            <Card 
              key={session.id} 
              className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-md group overflow-hidden"
              onClick={() => navigate(`/resumen/${session.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex items-center p-4">
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
                      Tasa: {session.exchangeRate} Bs/$ • {new Date(session.openedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="text-right mr-4 hidden sm:block">
                     <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Estado</p>
                     <p className="font-semibold">{session.isOpen ? 'En curso' : 'Finalizado'}</p>
                  </div>

                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
