import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

/**
 * Check if the user's role grants multi-branch access.
 * Owner, manager, admin, and super_admin can access all branches.
 */
export function hasMultiBranchAccess(profile: Profile | null): boolean {
  if (!profile) return false;
  return ['owner', 'manager', 'super_admin'].includes(profile.role);
}

/**
 * Check if the user can manage other users (invite, change roles, assign branches).
 * Only owner and super_admin can manage users.
 */
export function canManageUsers(profile: Profile | null): boolean {
  if (!profile) return false;
  return ['owner', 'super_admin'].includes(profile.role);
}

/**
 * Fetch the branch IDs the user is assigned to via perfiles_ubicaciones.
 * Returns empty array if no assignments or on error.
 */
export async function getBranchIdsForUser(
  userId: string,
  tenantId: string
): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('perfiles_ubicaciones')
      .select('ubicacion_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((row: { ubicacion_id: string }) => row.ubicacion_id);
  } catch {
    return [];
  }
}
