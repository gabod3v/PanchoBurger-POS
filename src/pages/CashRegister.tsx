import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, AlertTriangle, Clock, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import RateDisplay from '@/components/RateDisplay';
import { Order, PaymentMethod } from '@/types';
import { toast } from 'sonner';

export default function CashRegister() {
  const { state, openDay, closeDay, fetchOrdersBySession, registerPayment } = useApp();
  const navigate = useNavigate();
  const [rate, setRate] = useState('');
  const [step, setStep] = useState(1); // 1: Tasa, 2: Precios en Bs, 3: Pendientes
  const [bsPrices, setBsPrices] = useState<Record<string, number>>({});
  const [pendingFromPreviousDays, setPendingFromPreviousDays] = useState<Order[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const { currentDay, products, sessions } = state;

  const [fetchingRate, setFetchingRate] = useState(false);

  // Auto-fetch BCV rate on mount
  useEffect(() => {
    const fetchRate = async () => {
      if (rate) return; // don't overwrite if user already typed
      setFetchingRate(true);
      try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res.json();
        if (data?.promedio && data.promedio > 0) {
          setRate(data.promedio.toString());
        }
      } catch (e) {
        console.warn('No se pudo obtener la tasa BCV', e);
      } finally {
        setFetchingRate(false);
      }
    };
    fetchRate();
  }, []);

  const bsProducts = products.filter(p => p.is_price_in_bs);

  // Cargar pedidos pendientes de días anteriores al intentar abrir caja
  const loadPendingFromPreviousDays = async () => {
    const allPending: Order[] = [];
    const previousSessions = sessions.filter(s => s.id !== currentDay?.id);
    
    for (const session of previousSessions) {
      const orders = await fetchOrdersBySession(session.id);
      const pending = orders.filter(o => o.paymentStatus === 'pending');
      allPending.push(...pending);
    }
    
    setPendingFromPreviousDays(allPending);
    if (allPending.length > 0) {
      setShowPendingModal(true);
    }
  };

  const startOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(rate);
    if (r <= 0) return;

    // Verificar si hay pendientes de días anteriores
    loadPendingFromPreviousDays();
    
    if (bsProducts.length > 0) {
      const initialPrices: Record<string, number> = {};
      bsProducts.forEach(p => initialPrices[p.id] = p.price_bs || 0);
      setBsPrices(initialPrices);
      setStep(2);
    } else {
      if (pendingFromPreviousDays.length > 0) {
        setShowPendingModal(true);
      } else {
        openDay(r);
        setRate('');
      }
    }
  };

  const handleOpenWithPendingCheck = () => {
    if (pendingFromPreviousDays.length > 0) {
      setShowPendingModal(true);
    } else {
      openDay(parseFloat(rate), bsPrices);
      setRate('');
      setStep(1);
    }
  };

  const handleFinalOpen = () => {
    openDay(parseFloat(rate), bsPrices);
    setRate('');
    setStep(1);
  };

  return (
    <div className="animate-slide-in max-w-2xl mx-auto pt-4">
      <div className="mb-8 border-b border-border/40 pb-4 text-center">
        <h1 className="text-4xl font-bold font-display tracking-tight">Caja del Día</h1>
      </div>

      {!currentDay || !currentDay.isOpen ? (
        <div className="pos-card mx-auto text-center p-12 transition-all">
          {step === 1 ? (
            <>
              <Unlock size={56} className="mx-auto text-muted-foreground/60 mb-6" strokeWidth={1} />
              <h2 className="text-2xl font-bold font-display mb-2 tracking-tight">Caja Cerrada</h2>
              <p className="text-muted-foreground font-medium mb-8">Ingresa la tasa de cambio del día para comenzar a tomar pedidos.</p>
              {fetchingRate && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 animate-pulse">
                  <Loader2 className="animate-spin" size={16} />
                  Consultando tasa BCV...
                </div>
              )}
              {!fetchingRate && rate && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                  <span>💰 Tasa BCV actual</span>
                  <button 
                    type="button" 
                    onClick={async () => {
                      setFetchingRate(true);
                      try {
                        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
                        const data = await res.json();
                        if (data?.promedio && data.promedio > 0) setRate(data.promedio.toString());
                      } catch (e) { console.warn(e); }
                      setFetchingRate(false);
                    }}
                    className="text-primary hover:text-primary/80 transition-colors"
                    title="Actualizar tasa"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}
              <form onSubmit={startOpen} className="flex gap-3 bg-card border border-border/50 rounded-lg p-3 shadow-sm">
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder={fetchingRate ? 'Consultando...' : 'Ej: 36.5412'}
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  className="flex-1 text-lg py-6 text-center font-bold tracking-widest bg-background border-border/30 focus-visible:ring-1 focus-visible:ring-primary/50"
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  className="px-8 font-bold tracking-wide transition-all shadow-sm"
                  onClick={() => {
                    if (pendingFromPreviousDays.length > 0) {
                      setShowPendingModal(true);
                    }
                  }}
                >
                  Abrir Caja
                </Button>
              </form>

              {/* Modal de pendientes de días anteriores */}
              <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <Clock className="text-warning" size={24} />
                      Pedidos Pendientes
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground mb-4">
                    Tienes {pendingFromPreviousDays.length} pedido{pendingFromPreviousDays.length !== 1 ? 's' : ''} pendiente{pendingFromPreviousDays.length !== 1 ? 's' : ''} de días anteriores.
                  </p>
                  
                  <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
                    {pendingFromPreviousDays.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
                        <div>
                          <p className="font-semibold">Ticket #{order.ticketNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('es-VE')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-warning">${order.totalUSD.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{order.totalLocal.toFixed(2)} Bs</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowPendingModal(false)} className="flex-1">
                      Después
                    </Button>
                    <Button onClick={() => {
                      setShowPendingModal(false);
                      window.location.href = '/pendientes';
                    }} className="flex-1">
                      Registrar Pagos
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold font-display mb-2 tracking-tight">Precios en Bs</h2>
                <p className="text-muted-foreground font-medium">Confirma el precio en Bolívares de estos productos para hoy.</p>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {bsProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border/50 shadow-sm">
                    <span className="font-semibold text-left">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24 text-right font-bold"
                        value={bsPrices[p.id]}
                        onChange={e => setBsPrices({...bsPrices, [p.id]: parseFloat(e.target.value) || 0})}
                      />
                      <span className="text-sm font-bold text-muted-foreground">Bs</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                <Button onClick={handleFinalOpen} className="flex-[2] font-bold">Abrir Caja Ahora</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pos-card mx-auto text-center p-8 transition-all">
          <Lock size={48} className="mx-auto text-success/80 mb-4" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold font-display mb-1 tracking-tight text-success">Caja Activa</h2>
          <p className="text-muted-foreground font-medium mb-8">La caja está recibiendo transacciones.</p>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-card rounded-lg border border-border/50 p-4 flex flex-col items-center gap-1 shadow-sm">
              <span className="text-xs text-muted-foreground font-medium">Fecha</span>
              <span className="font-bold text-lg">{currentDay.date}</span>
            </div>
            <div className="bg-card rounded-lg border border-border/50 p-4 flex flex-col items-center shadow-sm">
              <span className="text-xs text-muted-foreground font-medium mb-2">Tasa</span>
              <RateDisplay rate={currentDay.exchangeRate} variant="badge" />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border/50 p-6 flex flex-col items-center gap-1 mb-6 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Pedidos del día</span>
            <span className="text-3xl font-bold font-display">{state.orders.length}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" className="w-full gap-2">
                <AlertTriangle size={18} />
                Cerrar Caja
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de cerrar la caja?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto finalizará el día de ventas. Solo tienes {state.orders.filter(o => o.status !== 'completed').length} pedidos pendientes.
                  Asegúrate de haber cobrado todo antes de cerrar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { 
                  const sessionId = state.currentDay?.id;
                  closeDay();
                  if (sessionId) navigate(`/resumen/${sessionId}`);
                }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sí, Cerrar Caja
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
