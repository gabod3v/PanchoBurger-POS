import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/types';

export const DEFAULT_BRANDING = {
  '--primary': '0 0% 9%',
  '--accent': '217 91% 60%',
  '--sidebar-background': '0 0% 98%',
  '--background': '0 0% 100%',
} as const;

/**
 * Apply tenant branding colors as CSS custom properties on :root.
 * Falls back to :root defaults when a value is null/undefined.
 */
export function applyBranding(tenant: Pick<Tenant, 'primary_color' | 'accent_color' | 'sidebar_color'> | null): void {
  const root = document.documentElement;
  if (!root) return;

  if (!tenant) {
    resetBranding();
    return;
  }

  const vars: Record<string, string | null | undefined> = {
    '--primary': tenant.primary_color,
    '--accent': tenant.accent_color,
    '--sidebar-background': tenant.sidebar_color,
  };

  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      root.style.setProperty(key, value);
    } else {
      root.style.removeProperty(key);
    }
  }
}

/**
 * Reset branding CSS variables back to :root defaults.
 */
export function resetBranding(): void {
  const root = document.documentElement;
  if (!root) return;

  for (const key of Object.keys(DEFAULT_BRANDING)) {
    root.style.removeProperty(key);
  }
}

/**
 * Upload a logo file to Supabase Storage and return the public URL.
 * File path: tenant-assets/{tenantId}/{timestamp}-{filename}
 */
export async function uploadLogo(
  tenantId: string,
  file: File
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const ext = file.name.split('.').pop() || 'png';
  const timestamp = Date.now();
  const filePath = `${tenantId}/${timestamp}-logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('tenant-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('tenant-assets')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Save branding data to the inquilinos table.
 */
export async function saveBranding(
  tenantId: string,
  data: {
    name?: string;
    logo_url?: string;
    primary_color?: string;
    accent_color?: string;
    sidebar_color?: string;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const updateData: Record<string, string> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
  if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
  if (data.accent_color !== undefined) updateData.accent_color = data.accent_color;
  if (data.sidebar_color !== undefined) updateData.sidebar_color = data.sidebar_color;

  const { error } = await supabase
    .from('inquilinos')
    .update(updateData)
    .eq('id', tenantId);

  if (error) {
    throw error;
  }
}
