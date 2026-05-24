import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadLogo, saveBranding, applyBranding } from '@/lib/branding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Convert a hex color (e.g. "#ef4444") to an HSL string ("0 72% 51%").
 */
function hexToHsl(hex: string): string {
  // Remove the hash
  hex = hex.replace(/^#/, '');

  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hue = Math.round(h * 360);
  const sat = Math.round(s * 100);
  const light = Math.round(l * 100);

  return `${hue} ${sat}% ${light}%`;
}

/**
 * Convert an HSL string (e.g. "0 72% 51%") to a hex color ("#ef4444").
 */
function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return '#000000';

  const h = parseInt(parts[0]) / 360;
  const s = parseInt(parts[1]) / 100;
  const l = parseInt(parts[2]) / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, '0').repeat(3)}`;
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Presentable HSL swatches with nice defaults
const COLOR_PRESETS = [
  { label: 'Neutral oscuro', hsl: '0 0% 9%' },
  { label: 'Rojo', hsl: '0 72% 51%' },
  { label: 'Azul', hsl: '217 91% 60%' },
  { label: 'Verde', hsl: '142 76% 36%' },
  { label: 'Naranja', hsl: '24 95% 53%' },
  { label: 'Violeta', hsl: '270 70% 50%' },
  { label: 'Rosado', hsl: '330 80% 50%' },
  { label: 'Teal', hsl: '180 70% 40%' },
];

// Owners and managers can access this page
type ConfigField = 'name' | 'logo_url' | 'primary_color' | 'accent_color' | 'sidebar_color';

export default function ConfiguracionPage() {
  const { tenant, refreshTenant, profile } = useAuth();
  const [tenantName, setTenantName] = useState(tenant?.name || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [primaryHex, setPrimaryHex] = useState(
    tenant?.primary_color ? hslToHex(tenant.primary_color) : hslToHex('0 0% 9%')
  );
  const [accentHex, setAccentHex] = useState(
    tenant?.accent_color ? hslToHex(tenant.accent_color) : hslToHex('217 91% 60%')
  );
  const [sidebarHex, setSidebarHex] = useState(
    tenant?.sidebar_color ? hslToHex(tenant.sidebar_color) : '#ffffff'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync from tenant if it changes
  useEffect(() => {
    if (tenant) {
      setTenantName(tenant.name);
      setLogoPreview(tenant.logo_url || null);
      if (tenant.primary_color) setPrimaryHex(hslToHex(tenant.primary_color));
      if (tenant.accent_color) setAccentHex(hslToHex(tenant.accent_color));
      if (tenant.sidebar_color) setSidebarHex(hslToHex(tenant.sidebar_color));
    }
  }, [tenant]);

  // Live preview as user changes colors
  useEffect(() => {
    applyBranding({
      primary_color: hexToHsl(primaryHex),
      accent_color: hexToHsl(accentHex),
      sidebar_color: hexToHsl(sidebarHex),
    });
  }, [primaryHex, accentHex, sidebarHex]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    // Validate type
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Solo PNG, JPG o WebP');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!tenant || !profile) return;

    if (!tenantName.trim()) {
      toast.error('El nombre del restaurante es requerido');
      return;
    }

    setSaving(true);

    try {
      let logoUrl = tenant.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        logoUrl = await uploadLogo(tenant.id, logoFile);
      }

      const primaryColor = hexToHsl(primaryHex);
      const accentColor = hexToHsl(accentHex);
      const sidebarColor = hexToHsl(sidebarHex);

      await saveBranding(tenant.id, {
        name: tenantName.trim(),
        logo_url: logoUrl,
        primary_color: primaryColor,
        accent_color: accentColor,
        sidebar_color: sidebarColor,
      });

      // Re-apply branding from the saved values
      applyBranding({
        primary_color: primaryColor,
        accent_color: accentColor,
        sidebar_color: sidebarColor,
      });

      await refreshTenant();
      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const hexInputStyle = (hex: string) => ({
    width: 40,
    height: 40,
    borderRadius: 8,
    border: '2px solid hsl(var(--border))',
    background: hex,
    cursor: 'pointer',
    padding: 0,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">Personaliza la imagen de tu restaurante</p>
      </div>

      {/* Tenant Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Información del Restaurante</CardTitle>
          <CardDescription>Nombre y logo de tu negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant name */}
          <div className="space-y-2">
            <Label htmlFor="tenantName">Nombre del restaurante</Label>
            <Input
              id="tenantName"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
              placeholder="Mi Restaurante"
            />
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <Image size={24} className="text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-1" />
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                </Button>
                <p className="text-[0.65rem] text-muted-foreground">
                  PNG, JPG o WebP. Máximo 2MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Colores de Marca</CardTitle>
          <CardDescription>Personaliza los colores de tu interfaz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-3">
            <Label>Color primario</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryHex}
                onChange={e => setPrimaryHex(e.target.value)}
                style={hexInputStyle(primaryHex)}
              />
              <span className="text-sm text-muted-foreground font-mono">{primaryHex}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.hsl}
                  type="button"
                  title={p.label}
                  onClick={() => setPrimaryHex(hslToHex(p.hsl))}
                  className="w-7 h-7 rounded-md border border-border/50 hover:scale-110 transition-transform"
                  style={{ background: hslToHex(p.hsl) }}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Accent Color */}
          <div className="space-y-3">
            <Label>Color de acento</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentHex}
                onChange={e => setAccentHex(e.target.value)}
                style={hexInputStyle(accentHex)}
              />
              <span className="text-sm text-muted-foreground font-mono">{accentHex}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.hsl}
                  type="button"
                  title={p.label}
                  onClick={() => setAccentHex(hslToHex(p.hsl))}
                  className="w-7 h-7 rounded-md border border-border/50 hover:scale-110 transition-transform"
                  style={{ background: hslToHex(p.hsl) }}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Sidebar/Background Color */}
          <div className="space-y-3">
            <Label>Color de la barra lateral</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={sidebarHex}
                onChange={e => setSidebarHex(e.target.value)}
                style={hexInputStyle(sidebarHex)}
              />
              <span className="text-sm text-muted-foreground font-mono">{sidebarHex}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.hsl}
                  type="button"
                  title={p.label}
                  onClick={() => setSidebarHex(hslToHex(p.hsl))}
                  className="w-7 h-7 rounded-md border border-border/50 hover:scale-110 transition-transform"
                  style={{ background: hslToHex(p.hsl) }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !tenantName.trim()} size="lg">
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
