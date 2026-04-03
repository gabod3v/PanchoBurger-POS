import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MenuPage() {
  const { state, deleteProduct } = useApp();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Todas');

  const filteredProducts = state.products.filter(p => 
    activeCategory === 'Todas' || 
    p.category === activeCategory || 
    (!p.category && activeCategory === 'Otros')
  );

  return (
    <div className="animate-slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-4 border-b border-border/40">
        <h1 className="text-4xl font-bold font-display tracking-tight">Menú</h1>
        <Button onClick={() => navigate('/producto/nuevo')} className="gap-2 shrink-0 rounded-md font-semibold tracking-wide">
          <Plus size={18} />
          Nuevo Producto
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap mb-6 pb-3">
        <div className="flex w-max space-x-3">
          {['Todas', ...state.categories.map(c => c.name), 'Otros'].map(cat => {
            const isActive = activeCategory === cat;
            return (
              <Button
                key={cat}
                variant={isActive ? 'default' : 'outline'}
                className={`rounded-full px-6 transition-all duration-300 font-medium ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/50'}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {state.products.length === 0 ? (
        <div className="text-center py-20 pos-card">
          <Tag size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold font-display mb-2">No hay productos</h2>
          <p className="text-muted-foreground mb-6">El menú está vacío. Agrega tu primer producto.</p>
          <Button onClick={() => navigate('/producto/nuevo')}>Crear Producto</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredProducts.map(p => (
            <div key={p.id} className="pos-card hover:shadow-md transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shadow-sm shrink-0 border border-border/40" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/40">
                    <Tag className="text-muted-foreground/30" size={24} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-lg tracking-tight">{p.name}</p>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {p.category || 'Otros'}
                    </span>
                  </div>
                  <p className="font-medium text-secondary">${p.price.toFixed(2)} USD</p>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto border-t sm:border-t-0 border-border/30 pt-3 sm:pt-0 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => navigate(`/producto/editar/${p.id}`)} className="gap-2 flex-1 sm:flex-auto rounded-md">
                  <Pencil size={16} /> <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0 focus:ring-0" onClick={() => deleteProduct(p.id)}>
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
