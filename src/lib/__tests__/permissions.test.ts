import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasMultiBranchAccess, canManageUsers, getBranchIdsForUser } from '../permissions';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function makeProfile(role: UserRole | null): Profile | null {
  if (!role) return null;
  return {
    id: 'user-1',
    tenant_id: 'tenant-1',
    full_name: 'Test User',
    role,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };
}

describe('hasMultiBranchAccess', () => {
  it('returns true for owner role', () => {
    expect(hasMultiBranchAccess(makeProfile('owner'))).toBe(true);
  });

  it('returns true for super_admin role', () => {
    expect(hasMultiBranchAccess(makeProfile('super_admin'))).toBe(true);
  });

  it('returns true for manager role', () => {
    expect(hasMultiBranchAccess(makeProfile('manager'))).toBe(true);
  });

  it('returns false for cashier role', () => {
    expect(hasMultiBranchAccess(makeProfile('cashier'))).toBe(false);
  });

  it('returns false for kitchen_staff role', () => {
    expect(hasMultiBranchAccess(makeProfile('kitchen_staff'))).toBe(false);
  });

  it('returns false when profile is null', () => {
    expect(hasMultiBranchAccess(null)).toBe(false);
  });
});

describe('canManageUsers', () => {
  it('returns true for owner role', () => {
    expect(canManageUsers(makeProfile('owner'))).toBe(true);
  });

  it('returns true for super_admin role', () => {
    expect(canManageUsers(makeProfile('super_admin'))).toBe(true);
  });

  it('returns false for manager role', () => {
    expect(canManageUsers(makeProfile('manager'))).toBe(false);
  });

  it('returns false for cashier role', () => {
    expect(canManageUsers(makeProfile('cashier'))).toBe(false);
  });

  it('returns false for kitchen_staff role', () => {
    expect(canManageUsers(makeProfile('kitchen_staff'))).toBe(false);
  });

  it('returns false when profile is null', () => {
    expect(canManageUsers(null)).toBe(false);
  });
});

describe('getBranchIdsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns array of branch IDs when user has assignments', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            { ubicacion_id: 'branch-1' },
            { ubicacion_id: 'branch-2' },
          ],
          error: null,
        }),
      }),
    } as any);

    const result = await getBranchIdsForUser('user-1', 'tenant-1');
    expect(result).toEqual(['branch-1', 'branch-2']);
    expect(supabase.from).toHaveBeenCalledWith('perfiles_ubicaciones');
  });

  it('returns empty array when user has no assignments', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    } as any);

    const result = await getBranchIdsForUser('user-1', 'tenant-1');
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    } as any);

    const result = await getBranchIdsForUser('user-1', 'tenant-1');
    expect(result).toEqual([]);
  });
});
