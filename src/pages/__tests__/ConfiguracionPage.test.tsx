import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/logo.png' } })),
      })),
    },
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock branding module
vi.mock('@/lib/branding', () => ({
  applyBranding: vi.fn(),
  saveBranding: vi.fn().mockResolvedValue(undefined),
  uploadLogo: vi.fn().mockResolvedValue('https://example.com/logo.png'),
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('ConfiguracionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form title and fields', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', role: 'owner', tenant_id: 'tenant-1' },
      tenant: {
        id: 'tenant-1',
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        logo_url: null,
        primary_color: null,
        accent_color: null,
        sidebar_color: null,
        owner_id: 'user-1',
      },
      refreshTenant: vi.fn(),
      loading: false,
      initialized: true,
    });

    const { default: ConfiguracionPage } = await import('../ConfiguracionPage');

    render(
      <TestWrapper>
        <ConfiguracionPage />
      </TestWrapper>
    );

    // Check the page title renders
    expect(screen.getByText('Configuración')).toBeTruthy();
    expect(screen.getByText('Personaliza la imagen de tu restaurante')).toBeTruthy();

    // Check form sections are present
    expect(screen.getByText('Información del Restaurante')).toBeTruthy();
    expect(screen.getByText('Colores de Marca')).toBeTruthy();

    // Check form field
    expect(screen.getByLabelText('Nombre del restaurante')).toBeTruthy();
    expect(screen.getByText('Guardar cambios')).toBeTruthy();
  });

  it('pre-fills the tenant name from context', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', role: 'owner', tenant_id: 'tenant-1' },
      tenant: {
        id: 'tenant-1',
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        logo_url: null,
        primary_color: null,
        accent_color: null,
        sidebar_color: null,
        owner_id: 'user-1',
      },
      refreshTenant: vi.fn(),
      loading: false,
      initialized: true,
    });

    const { default: ConfiguracionPage } = await import('../ConfiguracionPage');

    render(
      <TestWrapper>
        <ConfiguracionPage />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText('Nombre del restaurante') as HTMLInputElement;
    expect(nameInput.value).toBe('Mi Restaurante');
  });
});
