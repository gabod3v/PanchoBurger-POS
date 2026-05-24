import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Users, Mail, Trash2, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole, BranchPermission } from '@/types';

type TeamMember = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  email?: string;
};

type Invitation = {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Dueño',
  manager: 'Gerente',
  cashier: 'Cajero',
  kitchen_staff: 'Cocina',
  super_admin: 'Super Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cashier: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  kitchen_staff: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const INVITE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'manager', label: 'Gerente' },
  { value: 'cashier', label: 'Cajero' },
  { value: 'kitchen_staff', label: 'Cocina' },
];

/**
 * Check if the current user can assign branches to the target user.
 */
function canAssignBranches(currentUserRole: string, targetUserRole: string): boolean {
  if (!['owner', 'super_admin'].includes(currentUserRole)) return false;
  if (targetUserRole === 'owner' || targetUserRole === 'super_admin') return false;
  return true;
}

export { canAssignBranches };

export default function TeamSection() {
  const { tenant, profile } = useAuth();
  const { branches } = useBranches();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [memberAssignments, setMemberAssignments] = useState<Record<string, BranchPermission[]>>({});
  const [savingBranch, setSavingBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('cashier');
  const [inviting, setInviting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const isOwner = profile?.role === 'owner' || profile?.role === 'super_admin';
  const activeBranches = branches.filter(b => b.is_active !== false);

  useEffect(() => {
    if (tenant) {
      loadMembers();
      loadInvitations();
      loadBranchAssignments();
    }
  }, [tenant]);

  const loadMembers = async () => {
    const { data } = await supabase!
      .from('perfiles')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: true });
    if (data) {
      const membersWithEmail = await Promise.all(
        (data as TeamMember[]).map(async (m) => {
          const { data: userData } = await supabase!.auth.admin.getUserById(m.id);
          return { ...m, email: (userData as any)?.user?.email || undefined };
        })
      );
      setMembers(membersWithEmail);
    }
    setLoading(false);
  };

  const loadInvitations = async () => {
    const { data } = await supabase!
      .from('invitaciones')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: false });
    if (data) setInvitations(data as Invitation[]);
  };

  const loadBranchAssignments = async () => {
    if (!tenant) return;
    const { data } = await supabase!
      .from('perfiles_ubicaciones')
      .select('*');
    if (data) {
      const assignments: Record<string, BranchPermission[]> = {};
      for (const row of data as BranchPermission[]) {
        if (!assignments[row.user_id]) assignments[row.user_id] = [];
        assignments[row.user_id].push(row);
      }
      setMemberAssignments(assignments);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !tenant) return;
    setInviting(true);
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { error } = await supabase!
      .from('invitaciones')
      .insert({
        tenant_id: tenant.id,
        email: inviteEmail,
        role: inviteRole,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: profile!.id,
      });
    if (error) {
      toast.error('Error al invitar: ' + error.message);
    } else {
      toast.success(`Invitación enviada a ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteDialog(false);
      loadInvitations();
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!tenant || memberId === profile?.id) return;
    const { error } = await supabase!
      .from('perfiles')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('tenant_id', tenant.id);
    if (error) {
      toast.error('Error al desactivar usuario');
    } else {
      toast.success('Usuario desactivado');
      loadMembers();
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!tenant) return;
    const { error } = await supabase!
      .from('perfiles')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('tenant_id', tenant.id);
    if (error) {
      toast.error('Error al cambiar rol');
    } else {
      toast.success('Rol actualizado');
      loadMembers();
    }
  };

  const handleBranchToggle = async (memberId: string, branchId: string, currentlyAssigned: boolean) => {
    if (!tenant || !profile) return;
    setSavingBranch(memberId);

    try {
      if (currentlyAssigned) {
        // Remove assignment
        const existing = memberAssignments[memberId]?.find(
          (p: BranchPermission) => p.ubicacion_id === branchId
        );
        if (existing) {
          const { error } = await supabase!
            .from('perfiles_ubicaciones')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
        }
      } else {
        // Add assignment
        const { error } = await supabase!
          .from('perfiles_ubicaciones')
          .insert({
            user_id: memberId,
            ubicacion_id: branchId,
            role: 'staff',
            is_active: true,
          });
        if (error) throw error;
      }

      await loadBranchAssignments();
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar asignación');
    } finally {
      setSavingBranch(null);
    }
  };

  const getMemberBranchIds = (memberId: string): string[] => {
    return (memberAssignments[memberId] || [])
      .filter((p: BranchPermission) => p.is_active)
      .map((p: BranchPermission) => p.ubicacion_id);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Users size={18} />
              Equipo ({members.length})
            </CardTitle>
            <CardDescription>Gestiona los miembros de tu restaurante</CardDescription>
          </div>
          {isOwner && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="font-semibold"><UserPlus size={14} className="mr-1" /> Invitar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Invitar Miembro</DialogTitle>
                  <DialogDescription>Envía una invitación por email para unirse a tu restaurante.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ts-email">Email</Label>
                    <Input id="ts-email" type="email" placeholder="correo@ejemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ts-role">Rol</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                      <SelectTrigger id="ts-role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INVITE_ROLES.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancelar</Button>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                    {inviting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} className="mr-1" />}
                    Enviar Invitación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sucursales</TableHead>
              <TableHead>Estado</TableHead>
              {isOwner && <TableHead className="w-20 text-right">Acción</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin inline" size={20} /></TableCell></TableRow>
            ) : members.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin miembros aún.</TableCell></TableRow>
            ) : members.map(m => {
              const assignedBranchIds = getMemberBranchIds(m.id);
              const canAssign = isOwner && m.id !== profile?.id && canAssignBranches(profile?.role || '', m.role);
              return (
                <TableRow key={m.id} className={!m.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{m.full_name}</p>
                        {m.id === profile?.id && <p className="text-[0.65rem] text-muted-foreground">(tú)</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.email || '—'}</TableCell>
                  <TableCell>
                    {isOwner && m.id !== profile?.id ? (
                      <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v as UserRole)}>
                        <SelectTrigger className={`h-7 text-xs px-2 border-0 ${ROLE_COLORS[m.role]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVITE_ROLES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {canAssign ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {activeBranches.map(b => {
                          const isAssigned = assignedBranchIds.includes(b.id);
                          const isLoading = savingBranch === m.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleBranchToggle(m.id, b.id, isAssigned)}
                              disabled={isLoading}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium border transition-colors ${
                                isAssigned
                                  ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                                  : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50'
                              }`}
                            >
                              <MapPin size={10} />
                              {b.name}
                            </button>
                          );
                        })}
                        {activeBranches.length === 0 && (
                          <span className="text-xs text-muted-foreground">Sin sucursales activas</span>
                        )}
                      </div>
                    ) : assignedBranchIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {activeBranches
                          .filter(b => assignedBranchIds.includes(b.id))
                          .map(b => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-medium bg-primary/10 text-primary border border-primary/30"
                            >
                              <MapPin size={10} />
                              {b.name}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Todas</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.is_active ? (
                      <Badge variant="success" className="text-[0.6rem]">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[0.6rem]">Inactivo</Badge>
                    )}
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-right">
                      {m.id !== profile?.id && m.role !== 'owner' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Desactivar miembro</AlertDialogTitle>
                              <AlertDialogDescription>
                                {m.full_name} perderá acceso al sistema. Podés reactivarlo después.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveMember(m.id)} className="bg-destructive hover:bg-destructive/90">
                                Desactivar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {invitations.length > 0 && (
        <div className="border-t border-border/50">
          <div className="px-6 py-3">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail size={14} />
              Invitaciones Pendientes ({invitations.filter(i => !i.accepted_at).length})
            </p>
          </div>
          <div className="px-6 pb-4 space-y-2">
            {invitations.filter(i => !i.accepted_at).map(inv => (
              <div key={inv.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-md bg-muted/30">
                <span className="font-medium">{inv.email}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[inv.role]}`}>
                    {ROLE_LABELS[inv.role]}
                  </span>
                  <Badge variant="outline" className="text-[0.6rem]">Pendiente</Badge>
                  <span className="text-xs text-muted-foreground">vence {new Date(inv.expires_at).toLocaleDateString('es-VE')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
