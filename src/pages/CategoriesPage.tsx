import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const { state, addCategory, updateCategory, deleteCategory } = useApp();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    toast.success('Categoría añadida');
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleUpdate = () => {
    if (!editingId || !editingName.trim()) return;
    updateCategory(editingId, editingName.trim());
    setEditingId(null);
    toast.success('Categoría actualizada');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      deleteCategory(id);
      toast.success('Categoría eliminada');
    }
  };

  return (
    <div className="animate-slide-in space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Gestionar Categorías</h1>
      </div>

      <div className="flex gap-3 max-w-md">
        <Input
          placeholder="Nueva categoría..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd}>
          <Plus size={18} className="mr-2" /> Agregar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.categories.length === 0 ? (
          <p className="text-muted-foreground col-span-full py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border/50 shadow-sm">
            No hay categorías registradas.
          </p>
        ) : (
          state.categories.map((cat) => (
            <Card key={cat.id} className="overflow-hidden border-border/50 hover:border-primary/20 transition-all shadow-sm hover:shadow-md">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 py-0"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={handleUpdate}>
                      <Check size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-lg">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEditing(cat.id, cat.name)}>
                        <Pencil size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
