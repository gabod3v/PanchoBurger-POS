import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Plus, Pencil, Trash2, Check, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Location } from '@/types';

export default function BranchManager() {
  const { tenant } = useAuth();
  const { branches, refresh } = useBranches();
  const [localBranches, setLocalBranches] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    setLocalBranches(branches);
    setLoading(false);
  }, [branches]);

  const handleAdd = async () => {
    if (!tenant || !newName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase!
        .from('ubicaciones')
        .insert({
          tenant_id: tenant.id,
          name: newName.trim(),
          address: newAddress.trim() || 'Por definir',
          is_active: true,
        });
      if (error) throw error;
      toast.success('Sucursal creada');
      setShowAddDialog(false);
      setNewName('');
      setNewAddress('');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear sucursal');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase!
        .from('ubicaciones')
        .update({ name: editName.trim(), address: editAddress.trim() || 'Por definir' })
        .eq('id', id);
      if (error) throw error;
      toast.success('Sucursal actualizada');
      setEditingId(null);
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (branch: Location) => {
    try {
      const { error } = await supabase!
        .from('ubicaciones')
        .update({ is_active: !branch.is_active })
        .eq('id', branch.id);
      if (error) throw error;
      toast.success(branch.is_active ? 'Sucursal desactivada' : 'Sucursal activada');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div>;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Building2 size={18} />
              Sucursales
            </CardTitle>
            <CardDescription>Gestiona las sucursales de tu restaurante</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="font-semibold"><Plus size={14} className="mr-1" /> Agregar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Nueva Sucursal</DialogTitle>
                <DialogDescription>Agrega una nueva sucursal a tu restaurante.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Nombre</Label>
                  <Input id="branch-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Sucursal Centro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-address">Dirección</Label>
                  <Input id="branch-address" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Dirección física (opcional)" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                <Button onClick={handleAdd} disabled={saving || !newName.trim()}>
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} className="mr-1" />}
                  Crear Sucursal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {localBranches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay sucursales. Creá la primera.</p>
        ) : (
          <div className="space-y-2">
            {localBranches.map(b => (
              <div key={b.id} className={`flex items-center justify-between p-3 rounded-lg border ${b.is_active === false ? 'border-border/30 opacity-60' : 'border-border/50'}`}>
                {editingId === b.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" placeholder="Nombre" />
                      <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} className="h-8 text-sm" placeholder="Dirección" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleUpdate(b.id)} disabled={saving}>
                        <Check size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {b.is_active !== false ? (
                        <Badge variant="success" className="text-[0.6rem]">Activa</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[0.6rem]">Inactiva</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditingId(b.id); setEditName(b.name); setEditAddress(b.address); }}>
                        <Pencil size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{b.is_active !== false ? 'Desactivar' : 'Activar'} sucursal</AlertDialogTitle>
                            <AlertDialogDescription>
                              {b.is_active !== false
                                ? `"${b.name}" dejará de estar disponible en el selector de sucursales. Los datos históricos se conservan.`
                                : `"${b.name}" volverá a estar disponible en el selector de sucursales.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleActive(b)}>
                              {b.is_active !== false ? 'Desactivar' : 'Activar'}
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
        )}
      </CardContent>
    </Card>
  );
}
