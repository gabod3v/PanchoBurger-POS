import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Building2, Shield, Calendar, Loader2, Save, Upload, Camera, X, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Dueño',
  manager: 'Gerente',
  cashier: 'Cajero',
  kitchen_staff: 'Cocina',
  super_admin: 'Super Admin',
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato no soportado. Usa JPEG, PNG o WebP' };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { valid: false, error: 'La imagen debe ser menor a 2MB' };
  }

  return { valid: true };
}

export default function ProfilePage() {
  const { user, profile, tenant, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [documentId, setDocumentId] = useState(profile?.document_id || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      // Reset input so user can re-select
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!profile || !user) return;
    setUploading(true);

    try {
      // Upload to avatars/{user_id}/{timestamp}-{filename}
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase!
        .storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase!
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save to profile
      const { error: updateError } = await supabase!
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Foto de perfil actualizada');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile || !user) return;
    setUploading(true);

    try {
      // Delete from storage if we have an avatar_url
      if (profile.avatar_url) {
        // Extract path from URL (avatars/{user_id}/{filename})
        const urlParts = profile.avatar_url.split('/avatars/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          await supabase!
            .storage
            .from('avatars')
            .remove([storagePath]);
        }
      }

      // Set avatar_url to null in profile
      const { error } = await supabase!
        .from('perfiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Foto de perfil eliminada');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !fullName.trim()) return;
    setSaving(true);

    const { error } = await supabase!
      .from('perfiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        document_id: documentId.trim() || null,
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Error al guardar');
    } else {
      toast.success('Perfil actualizado');
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-1">Tu información personal</p>
      </div>

      {/* Avatar + Upload */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Overlay on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Cambiar foto"
              >
                {uploading ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.role && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {ROLE_LABELS[profile.role] || profile.role}
                </Badge>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload size={14} className="mr-1" />
                  Subir foto
                </Button>
                {profile?.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="text-destructive hover:text-destructive"
                  >
                    <X size={14} className="mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <p className="text-[0.65rem] text-muted-foreground">JPEG, PNG o WebP. Máximo 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Información Personal</CardTitle>
          <CardDescription>Actualizá tus datos personales</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+58 412 123 4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentId">Documento de identidad</Label>
            <Input
              id="documentId"
              value={documentId}
              onChange={e => setDocumentId(e.target.value)}
              placeholder="V-12345678"
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !fullName.trim()}>
            {saving ? <Loader2 className="animate-spin mr-1" size={16} /> : <Save size={16} className="mr-1" />}
            Guardar cambios
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
