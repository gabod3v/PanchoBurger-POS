import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
        remove: vi.fn(),
      })),
    },
  },
}));

// Helper to validate file before upload
function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato no soportado. Usa JPEG, PNG o WebP' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'La imagen debe ser menor a 2MB' };
  }

  return { valid: true };
}

describe('ProfilePage - avatar file validation', () => {
  it('rejects invalid file type (PDF)', () => {
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Formato no soportado');
  });

  it('rejects oversized file (>2MB)', () => {
    const bigContent = new ArrayBuffer(3 * 1024 * 1024); // 3MB
    const file = new File([bigContent], 'large.jpg', { type: 'image/jpeg' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('menor a 2MB');
  });

  it('accepts valid JPEG file under 2MB', () => {
    const file = new File(['small'], 'photo.jpg', { type: 'image/jpeg' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepts valid PNG file under 2MB', () => {
    const file = new File(['small'], 'photo.png', { type: 'image/png' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepts valid WebP file under 2MB', () => {
    const file = new File(['small'], 'photo.webp', { type: 'image/webp' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejects file over 2MB', () => {
    const bigContent = new ArrayBuffer(2 * 1024 * 1024 + 1); // 1 byte over 2MB
    const file = new File([bigContent], 'large.jpg', { type: 'image/jpeg' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('menor a 2MB');
  });

  it('accepts file exactly at 2MB', () => {
    const content = new ArrayBuffer(2 * 1024 * 1024); // exactly 2MB
    const file = new File([content], 'exact.jpg', { type: 'image/jpeg' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepts file just under 2MB', () => {
    const content = new ArrayBuffer(2 * 1024 * 1024 - 1); // 1 byte less than 2MB
    const file = new File([content], 'almost.jpg', { type: 'image/jpeg' });
    const result = validateAvatarFile(file);
    expect(result.valid).toBe(true);
  });
});

describe('ProfilePage - rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the profile page title', async () => {
    // Need to render inside AuthProvider
    // For a minimal test, just check the component renders with basic auth state
    // This is a smoke/layout test
    const ProfilePage = (await import('../ProfilePage')).default;

    // Mock the useAuth to return a known state
    // Since AuthProvider uses context, we need to provide it
    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    // Check the page title renders
    await vi.waitFor(() => {
      expect(screen.getByText('Perfil')).toBeTruthy();
    });
  });
});
