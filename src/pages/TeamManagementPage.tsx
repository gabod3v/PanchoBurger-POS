import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { UserPlus, Users, Mail, Trash2, Shield, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

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

export default function TeamManagementPage() {
  const { tenant, profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('cashier');
  const [inviting, setInviting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = profile?.role === 'owner' || profile?.role === 'super_admin';

  useEffect(() => {
    if (tenant) {
      loadMembers();
      loadInvitations();
    }
  }, [tenant]);

  const loadMembers = async () => {
    const { data } = await supabase!
      .from('perfiles')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('created_at', { ascending: true });

    if (data) {
      // Try to get emails from auth.users (may not work depending on RLS)
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
    setRemovingId(memberId);

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
    setRemovingId(null);
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

  if (!tenant) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Equipo</h1>
          <p className="text-muted-foreground mt-1">Gestiona los miembros de tu restaurante</p>
        </div>
        {isOwner && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="font-semibold"><UserPlus size={16} className="mr-2" /> Invitar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Invitar Miembro</DialogTitle>
                <DialogDescription>Envía una invitación por email para unirse a tu restaurante.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Rol</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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

      {/* Team Members */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users size={18} />
            Miembros ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                {isOwner && <TableHead className="text-right">Acción</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline" size={20} /></TableCell></TableRow>
              ) : members.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin miembros aún.</TableCell></TableRow>
              ) : members.map(m => (
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
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleRoleChange(m.id, v as UserRole)}
                      >
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
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Desactivar miembro</AlertDialogTitle>
                              <AlertDialogDescription>
                                {m.full_name} perderá acceso al sistema. Puedes reactivarlo después.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(m.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Desactivar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invitations */}
      {invitations.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Mail size={18} />
              Invitaciones Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.filter(i => !i.accepted_at).map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[inv.role]}`}>
                        {ROLE_LABELS[inv.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[0.6rem]">Pendiente</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString('es-VE')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
