import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function MenuPage() {
  const { state, addProduct, updateProduct, deleteProduct } = useApp();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    if (editingId) {
      updateProduct(editingId, name.trim(), parseFloat(price));
      setEditingId(null);
    } else {
      addProduct(name.trim(), parseFloat(price));
    }
    setName('');
    setPrice('');
  };

  const startEdit = (id: string) => {
    const p = state.products.find(p => p.id === id);
    if (p) {
      setEditingId(id);
      setName(p.name);
      setPrice(p.price.toString());
    }
  };

  return (
    <div className="animate-slide-in">
      <h1 className="text-3xl font-bold font-display mb-6">Menú de Productos</h1>

      <form onSubmit={handleSubmit} className="pos-card mb-6 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Nombre del producto"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1"
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Precio USD"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-32"
        />
        <Button type="submit" className="gap-2">
          <Plus size={18} />
          {editingId ? 'Actualizar' : 'Agregar'}
        </Button>
        {editingId && (
          <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName(''); setPrice(''); }}>
            Cancelar
          </Button>
        )}
      </form>

      {state.products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No hay productos. Agrega uno arriba.</p>
      ) : (
        <div className="grid gap-3">
          {state.products.map(p => (
            <div key={p.id} className="pos-card flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">${p.price.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => startEdit(p.id)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct(p.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
