import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { BranchProvider, useBranches } from '../BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile } from '@/types';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockBranches = [
  { id: 'branch-1', tenant_id: 'tenant-1', name: 'Sucursal Centro', address: 'Centro', is_active: true },
  { id: 'branch-2', tenant_id: 'tenant-1', name: 'Sucursal Norte', address: 'Norte', is_active: true },
  { id: 'branch-3', tenant_id: 'tenant-1', name: 'Sucursal Sur', address: 'Sur', is_active: false },
];

const OWNER_PROFILE: Profile = {
  id: 'user-1', tenant_id: 'tenant-1', full_name: 'Owner', role: 'owner',
  is_active: true, created_at: '', updated_at: '',
};

const CASHIER_PROFILE: Profile = {
  id: 'user-2', tenant_id: 'tenant-1', full_name: 'Cashier', role: 'cashier',
  is_active: true, created_at: '', updated_at: '',
};

function setupUseAuth(profile: Profile | null = OWNER_PROFILE) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    tenant: { id: 'tenant-1' },
    initialized: true,
    profile,
  });
}

function mockSupabaseFrom(data: Record<string, any>) {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    if (table === 'ubicaciones') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: data.ubicaciones ?? [], error: null }),
      } as any;
    }
    if (table === 'perfiles_ubicaciones') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: data.perfiles_ubicaciones ?? [], error: null }),
      } as any;
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
  });
}

import { supabase } from '@/lib/supabase';

describe('BranchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('owner sees all branches even without perfiles_ubicaciones', async () => {
    setupUseAuth(OWNER_PROFILE);
    mockSupabaseFrom({
      ubicaciones: mockBranches,
      perfiles_ubicaciones: [], // no assignments
    });

    let branches: any = null;
    function TestConsumer() {
      const ctx = useBranches();
      if (!branches && ctx.branches.length > 0) {
        branches = ctx.branches;
      }
      return null;
    }

    render(
      <BranchProvider>
        <TestConsumer />
      </BranchProvider>
    );

    await vi.waitFor(() => {
      expect(branches).not.toBeNull();
    });

    // Owner sees all branches (including inactive; active filtering is component-level)
    expect(branches).toHaveLength(3);
    expect(branches.map((b: any) => b.id).sort()).toEqual(['branch-1', 'branch-2', 'branch-3']);
  });

  it('cashier sees only assigned active branches', async () => {
    setupUseAuth(CASHIER_PROFILE);
    mockSupabaseFrom({
      ubicaciones: mockBranches,
      perfiles_ubicaciones: [
        { id: 'pu-1', user_id: 'user-2', ubicacion_id: 'branch-1', role: 'staff', is_active: true },
      ],
    });

    let branches: any = null;
    function TestConsumer() {
      const ctx = useBranches();
      if (!branches && ctx.branches.length > 0) {
        branches = ctx.branches;
      }
      return null;
    }

    render(
      <BranchProvider>
        <TestConsumer />
      </BranchProvider>
    );

    await vi.waitFor(() => {
      expect(branches).not.toBeNull();
    });

    // Cashier sees only assigned branch
    expect(branches).toHaveLength(1);
    expect(branches[0].id).toBe('branch-1');
  });

  it('fallback to all branches when no permission rows exist', async () => {
    setupUseAuth(CASHIER_PROFILE);
    mockSupabaseFrom({
      ubicaciones: mockBranches,
      perfiles_ubicaciones: [], // no assignments → fallback
    });

    let branches: any = null;
    function TestConsumer() {
      const ctx = useBranches();
      if (!branches && ctx.branches.length > 0) {
        branches = ctx.branches;
      }
      return null;
    }

    render(
      <BranchProvider>
        <TestConsumer />
      </BranchProvider>
    );

    await vi.waitFor(() => {
      expect(branches).not.toBeNull();
    });

    // Fallback: cashier with no permissions sees all branches (backward compatible)
    expect(branches).toHaveLength(3);
    expect(branches.map((b: any) => b.id).sort()).toEqual(['branch-1', 'branch-2', 'branch-3']);
  });

  it('exposes userPermissions as empty array when no assignments', async () => {
    setupUseAuth(CASHIER_PROFILE);
    mockSupabaseFrom({
      ubicaciones: mockBranches,
      perfiles_ubicaciones: [],
    });

    let userPermissions: any = null;
    function TestConsumer() {
      const ctx = useBranches();
      if (ctx.loading === false && !userPermissions) {
        userPermissions = ctx.userPermissions;
      }
      return null;
    }

    render(
      <BranchProvider>
        <TestConsumer />
      </BranchProvider>
    );

    await vi.waitFor(() => {
      expect(userPermissions).not.toBeNull();
    });

    expect(userPermissions).toEqual([]);
  });

  it('exposes userPermissions with permission rows when assigned', async () => {
    setupUseAuth(CASHIER_PROFILE);
    mockSupabaseFrom({
      ubicaciones: mockBranches,
      perfiles_ubicaciones: [
        { id: 'pu-1', user_id: 'user-2', ubicacion_id: 'branch-1', role: 'staff', is_active: true },
      ],
    });

    let userPermissions: any = null;
    function TestConsumer() {
      const ctx = useBranches();
      if (ctx.loading === false && !userPermissions) {
        userPermissions = ctx.userPermissions;
      }
      return null;
    }

    render(
      <BranchProvider>
        <TestConsumer />
      </BranchProvider>
    );

    await vi.waitFor(() => {
      expect(userPermissions).not.toBeNull();
    });

    expect(userPermissions).toHaveLength(1);
    expect(userPermissions[0].ubicacion_id).toBe('branch-1');
    expect(userPermissions[0].role).toBe('staff');
  });
});
