import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Tag, Settings2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function MenuPage() {
  const { state, deleteProduct, addCategory, updateCategory, deleteCategory } = useApp();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const filteredProducts = state.products.filter(p => 
    activeCategory === 'Todas' || 
    p.category === activeCategory || 
    (!p.category && activeCategory === 'Otros')
  );

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
    toast.success(`Categoría "${newCatName.trim()}" creada`);
  };

  const handleUpdateCategory = () => {
    if (!editingCat || !editCatName.trim()) return;
    updateCategory(editingCat.id, editCatName.trim());
    setEditingCat(null);
    setEditCatName('');
    toast.success('Categoría actualizada');
  };

  const handleDeleteCategory = (id: string, name: string) => {
    deleteCategory(id);
    toast.success(`Categoría "${name}" eliminada`);
  };

  return (
    <div className="animate-slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-4 border-b border-border/40">
        <h1 className="text-4xl font-bold font-display tracking-tight">Menú</h1>
        <div className="flex gap-2">
          <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0 rounded-md font-semibold tracking-wide">
                <Settings2 size={18} />
                Categorías
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Gestionar Categorías</DialogTitle>
                <DialogDescription>Creá, renombrá o eliminá categorías del menú.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Add new category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la categoría"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} disabled={!newCatName.trim()} size="sm">
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Category list */}
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {state.categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin categorías aún.</p>
                  ) : state.categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 group">
                      {editingCat?.id === cat.id ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <Input
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" className="h-8 text-success" onClick={handleUpdateCategory}>
                            <Pencil size={14} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <Tag size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">{cat.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({state.products.filter(p => p.category === cat.name).length})
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditingCat(cat); setEditCatName(cat.name); }}>
                              <Pencil size={13} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 size={13} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Los productos con la categoría "{cat.name}" pasarán a "Otros". ¿Eliminar?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(cat.id, cat.name)} className="bg-destructive hover:bg-destructive/90">
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => navigate('/producto/nuevo')} className="gap-2 shrink-0 rounded-md font-semibold tracking-wide">
            <Plus size={18} />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap mb-6 pb-3">
        <div className="flex w-max space-x-3">
          {['Todas', ...state.categories.map(c => c.name).filter(c => c !== 'Otros'), 'Otros'].map(cat => {
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
                    {p.soldByWeight && (
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/20">
                        kg
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {p.category || 'Otros'}
                    </span>
                  </div>
                  <p className="font-medium text-secondary">{p.soldByWeight ? `$${p.price.toFixed(2)} /kg` : `$${p.price.toFixed(2)} USD`}</p>
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
