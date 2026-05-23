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
});
