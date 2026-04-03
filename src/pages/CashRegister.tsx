import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
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

export default function CashRegister() {
  const { state, openDay, closeDay } = useApp();
  const [rate, setRate] = useState('');
  const [step, setStep] = useState(1); // 1: Tasa, 2: Precios en Bs
  const [bsPrices, setBsPrices] = useState<Record<string, number>>({});
  const { currentDay, products } = state;

  const bsProducts = products.filter(p => p.is_price_in_bs);

  const startOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(rate);
    if (r <= 0) return;

    if (bsProducts.length > 0) {
      const initialPrices: Record<string, number> = {};
      bsProducts.forEach(p => initialPrices[p.id] = p.price_bs || 0);
      setBsPrices(initialPrices);
      setStep(2);
    } else {
      openDay(r);
      setRate('');
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
              <form onSubmit={startOpen} className="flex gap-3">
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Ej: 36.5412"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  className="flex-1 text-lg py-6 text-center font-bold tracking-widest bg-muted/30"
                />
                <Button type="submit" size="lg" className="px-8 font-bold tracking-wide transition-all shadow-sm">Abrir Caja</Button>
              </form>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold font-display mb-2 tracking-tight">Precios en Bs</h2>
                <p className="text-muted-foreground font-medium">Confirma el precio en Bolívares de estos productos para hoy.</p>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {bsProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
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
            <div className="pos-stat items-center">
              <span className="text-xs text-muted-foreground">Fecha</span>
              <span className="font-bold">{currentDay.date}</span>
            </div>
            <div className="pos-stat items-center">
              <span className="text-xs text-muted-foreground">Tasa</span>
              <span className="font-bold">{currentDay.exchangeRate} Bs/$</span>
            </div>
          </div>
          <div className="pos-stat items-center mb-6">
            <span className="text-xs text-muted-foreground">Pedidos del día</span>
            <span className="text-2xl font-bold font-display">{state.orders.length}</span>
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
                <AlertDialogAction onClick={closeDay} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
