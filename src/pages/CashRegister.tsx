import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function CashRegister() {
  const { state, openDay, closeDay } = useApp();
  const [rate, setRate] = useState('');
  const { currentDay } = state;

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(rate);
    if (r > 0) {
      openDay(r);
      setRate('');
    }
  };

  return (
    <div className="animate-slide-in">
      <h1 className="text-3xl font-bold font-display mb-6">Caja del Día</h1>

      {!currentDay || !currentDay.isOpen ? (
        <div className="pos-card max-w-md mx-auto text-center">
          <Unlock size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold font-display mb-2">Abrir Caja</h2>
          <p className="text-muted-foreground text-sm mb-6">Ingresa la tasa del día para comenzar a tomar pedidos.</p>
          <form onSubmit={handleOpen} className="flex gap-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Tasa USD → Bs"
              value={rate}
              onChange={e => setRate(e.target.value)}
              className="flex-1 text-lg"
            />
            <Button type="submit" size="lg">Abrir</Button>
          </form>
        </div>
      ) : (
        <div className="pos-card max-w-md mx-auto text-center">
          <Lock size={48} className="mx-auto text-success mb-4" />
          <h2 className="text-xl font-semibold font-display mb-2">Caja Abierta</h2>
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
          <Button variant="destructive" size="lg" className="w-full gap-2" onClick={closeDay}>
            <AlertTriangle size={18} />
            Cerrar Caja
          </Button>
        </div>
      )}
    </div>
  );
}
