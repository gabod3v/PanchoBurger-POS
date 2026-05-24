import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

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
  },
}));

describe('AuthContext - signUp metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass metadata as options.data when metadata is provided', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: { id: '123', email: 'test@test.com' } },
      error: null,
    });
    vi.mocked(supabase.auth.signUp).mockImplementation(mockSignUp);

    // Dynamically import so we get the module with mocked supabase
    const { useAuth, AuthProvider } = await import('./AuthContext');

    let result: any;
    function TestConsumer() {
      const ctx = useAuth();
      // Call signUp with metadata
      result = ctx.signUp('test@test.com', '123456', 'Juan Pérez', 'Mi Restaurante', {
        document_id: 'V-12345678',
        phone: '+584121234567',
        rif: 'J-12345678-9',
      });
      return null;
    }

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for the effect to run
    await vi.waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Juan Pérez',
          tenant_name: 'Mi Restaurante',
          document_id: 'V-12345678',
          phone: '+584121234567',
          rif: 'J-12345678-9',
        },
      },
    });
  });

  it('should not include metadata when not provided', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: { id: '123', email: 'test@test.com' } },
      error: null,
    });
    vi.mocked(supabase.auth.signUp).mockImplementation(mockSignUp);

    const { useAuth, AuthProvider } = await import('./AuthContext');

    function TestConsumer() {
      const ctx = useAuth();
      ctx.signUp('test@test.com', '123456', 'Juan Pérez', 'Mi Restaurante');
      return null;
    }

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await vi.waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Juan Pérez',
          tenant_name: 'Mi Restaurante',
        },
      },
    });
  });

  it('should pass partial metadata correctly', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: { id: '123', email: 'test@test.com' } },
      error: null,
    });
    vi.mocked(supabase.auth.signUp).mockImplementation(mockSignUp);

    const { useAuth, AuthProvider } = await import('./AuthContext');

    function TestConsumer() {
      const ctx = useAuth();
      ctx.signUp('test@test.com', '123456', 'Juan Pérez', 'Mi Restaurante', {
        rif: 'J-12345678-9',
      });
      return null;
    }

    const { render } = await import('@testing-library/react');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await vi.waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Juan Pérez',
          tenant_name: 'Mi Restaurante',
          rif: 'J-12345678-9',
        },
      },
    });
  });

  describe('AuthContext - branding integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('calls applyBranding with tenant data after loadUserData', async () => {
      // Mock a session to trigger loadUserData
      const mockSession = {
        user: { id: 'user-1', email: 'test@test.com' },
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock the perfiles query to return a profile
      const mockPerfilesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            tenant_id: 'tenant-1',
            full_name: 'Test User',
            role: 'owner',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          error: null,
        }),
      };

      // Mock the inquilinos query to return a tenant with branding fields
      const mockInquilinosQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'tenant-1',
            name: 'Mi Restaurante',
            slug: 'mi-restaurante',
            logo_url: 'https://example.com/logo.png',
            primary_color: '0 72% 51%',
            accent_color: '217 91% 60%',
            sidebar_color: '0 0% 98%',
            owner_id: 'user-1',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          error: null,
        }),
      };

      // Mock suscripciones query
      const mockSuscripcionesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Chain .from() calls
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'perfiles') return mockPerfilesQuery as any;
        if (table === 'inquilinos') return mockInquilinosQuery as any;
        if (table === 'suscripciones') return mockSuscripcionesQuery as any;
        return {} as any;
      });

      const { useAuth, AuthProvider } = await import('./AuthContext');

      let authState: any = null;
      function TestConsumer() {
        const ctx = useAuth();
        // Store state for assertions
        if (ctx.initialized && !authState) {
          authState = { tenant: ctx.tenant, initialized: ctx.initialized };
        }
        return null;
      }

      const { render } = await import('@testing-library/react');
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for the auth to initialize
      await vi.waitFor(() => {
        expect(authState?.initialized).toBe(true);
      });

      // The tenant should include all the branding fields
      expect(authState?.tenant?.primary_color).toBe('0 72% 51%');
      expect(authState?.tenant?.accent_color).toBe('217 91% 60%');
      expect(authState?.tenant?.sidebar_color).toBe('0 0% 98%');

      // Verify the CSS vars were set by applyBranding
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--primary')).toBe('0 72% 51%');
      expect(root.style.getPropertyValue('--accent')).toBe('217 91% 60%');
      expect(root.style.getPropertyValue('--sidebar-background')).toBe('0 0% 98%');
    });
  });
});
