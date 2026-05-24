import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyBranding, resetBranding, saveBranding, uploadLogo } from '../branding';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

describe('applyBranding', () => {
  beforeEach(() => {
    // Clear any inline styles on :root
    document.documentElement.removeAttribute('style');
  });

  it('sets CSS variables on document.documentElement', () => {
    applyBranding({
      primary_color: '0 72% 51%',
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('0 72% 51%');
    expect(root.style.getPropertyValue('--accent')).toBe('217 91% 60%');
    expect(root.style.getPropertyValue('--sidebar-background')).toBe('0 0% 98%');
  });

  it('removes CSS variable when value is null (falls back to :root)', () => {
    // First set some values
    applyBranding({
      primary_color: '0 72% 51%',
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });

    // Now set with null for primary
    applyBranding({
      primary_color: null,
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('');
    expect(root.style.getPropertyValue('--accent')).toBe('217 91% 60%');
  });

  it('calls resetBranding when tenant is null', () => {
    applyBranding({
      primary_color: '0 72% 51%',
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });

    applyBranding(null);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('');
    expect(root.style.getPropertyValue('--accent')).toBe('');
    expect(root.style.getPropertyValue('--sidebar-background')).toBe('');
  });

  it('handles partial branding with some null values', () => {
    applyBranding({
      primary_color: '0 72% 51%',
      accent_color: undefined,
      sidebar_color: null,
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('0 72% 51%');
    expect(root.style.getPropertyValue('--accent')).toBe('');
    expect(root.style.getPropertyValue('--sidebar-background')).toBe('');
  });
});

describe('resetBranding', () => {
  it('clears all branding CSS variables', () => {
    applyBranding({
      primary_color: '0 72% 51%',
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });

    resetBranding();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('');
    expect(root.style.getPropertyValue('--accent')).toBe('');
    expect(root.style.getPropertyValue('--sidebar-background')).toBe('');
  });
});

describe('saveBranding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.from("inquilinos").update with correct payload', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate.mockReturnValue({ eq: mockEq }),
    } as any);

    await saveBranding('tenant-123', {
      name: 'Mi Restaurante',
      primary_color: '0 72% 51%',
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });

    expect(supabase.from).toHaveBeenCalledWith('inquilinos');
    // The implementation calls .update().eq(), so let's check update was called correctly
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Mi Restaurante',
      primary_color: '0 72% 51%',
      accent_color: '217 91% 60%',
      sidebar_color: '0 0% 98%',
    });
  });

  it('only includes defined fields in the update payload', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate.mockReturnValue({ eq: mockEq }),
    } as any);

    await saveBranding('tenant-123', {
      name: 'Mi Restaurante',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Mi Restaurante',
    });
  });
});
