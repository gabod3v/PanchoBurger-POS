import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Building2, Shield, Calendar, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Dueño',
  manager: 'Gerente',
  cashier: 'Cajero',
  kitchen_staff: 'Cocina',
  super_admin: 'Super Admin',
};

export default function ProfilePage() {
  const { user, profile, tenant, subscription } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || !fullName.trim()) return;
    setSaving(true);

    const { error } = await supabase!
      .from('perfiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id);

    if (error) {
      toast.error('Error al guardar');
    } else {
      toast.success('Nombre actualizado');
    }
    setSaving(false);
  };

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-1">Tu información personal</p>
      </div>

      {/* Avatar + Name */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold font-display">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.role && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {ROLE_LABELS[profile.role] || profile.role}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Información Personal</CardTitle>
          <CardDescription>Actualiza tu nombre</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !fullName.trim() || fullName === profile?.full_name}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="mr-1" />}
            Guardar
          </Button>
        </CardContent>
      </Card>

      {/* Account details */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Detalles de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <Separator />
          <div className="flex items-center gap-3 text-sm">
            <Shield size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Rol:</span>
            <span className="font-medium">{profile?.role ? ROLE_LABELS[profile.role] : '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center gap-3 text-sm">
            <Building2 size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Restaurante:</span>
            <span className="font-medium">{tenant?.name || '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Miembro desde:</span>
            <span className="font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
