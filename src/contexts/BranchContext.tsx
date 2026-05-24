import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Location, BranchPermission } from '@/types';

const STORAGE_KEY_PREFIX = 'active_branch_';

interface BranchContextType {
  branches: Location[];
  activeBranch: Location | null;
  activeBranchId: string | null;
  setActiveBranchId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  userPermissions: BranchPermission[];
}

const BranchContext = createContext<BranchContextType | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { tenant, initialized, profile } = useAuth();
  const tenantId = tenant?.id;
  const [branches, setBranches] = useState<Location[]>([]);
  const [userPermissions, setUserPermissions] = useState<BranchPermission[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load active branch from localStorage on mount
  useEffect(() => {
    if (!tenantId) return;
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tenantId}`);
    if (saved) {
      setActiveBranchIdState(saved);
    }
  }, [tenantId]);

  const fetchBranches = useCallback(async () => {
    if (!supabase || !tenantId) {
      setBranches([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all branches for the tenant
      const { data: ubicacionesData } = await supabase
        .from('ubicaciones')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      const allBranches = (ubicacionesData || []).map(l => ({
        id: l.id,
        tenant_id: l.tenant_id,
        name: l.name,
        address: l.address,
        is_active: l.is_active,
      })) as Location[];

      // Fetch user's branch-level permissions
      const { data: permissionData } = await supabase
        .from('perfiles_ubicaciones')
        .select('*')
        .eq('user_id', profile?.id);

      const permissions = (permissionData || []) as BranchPermission[];
      setUserPermissions(permissions);

      // Determine which branches this user can see
      const isElevatedRole = profile && ['owner', 'manager', 'super_admin'].includes(profile.role);
      let resultBranches: Location[];

      if (isElevatedRole || permissions.length === 0) {
        // Elevated roles (owner/manager/super_admin) see all active branches
        // No permission rows = fallback: show all active branches (backward compatible)
        resultBranches = allBranches;
      } else {
        // Staff see only branches they're assigned to
        const assignedBranchIds = new Set(
          permissions
            .filter(p => p.is_active)
            .map(p => p.ubicacion_id)
        );
        resultBranches = allBranches.filter(b => assignedBranchIds.has(b.id));
      }

      setBranches(resultBranches);

      // Auto-select first active branch if none saved or saved is no longer valid
      const savedId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tenantId}`);
      if (!savedId || !resultBranches.find(b => b.id === savedId)) {
        const firstActive = resultBranches.find(b => b.is_active !== false) || resultBranches[0];
        if (firstActive) {
          setActiveBranchIdState(firstActive.id);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${tenantId}`, firstActive.id);
        }
      }
    } catch (e) {
      console.warn('Error fetching branches:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId, profile?.id]);

  useEffect(() => {
    if (initialized) {
      fetchBranches();
    }
  }, [initialized, fetchBranches]);

  const setActiveBranchId = useCallback((id: string) => {
    setActiveBranchIdState(id);
    if (tenantId) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${tenantId}`, id);
    }
  }, [tenantId]);

  const activeBranch = branches.find(b => b.id === activeBranchId) || null;

  return (
    <BranchContext.Provider value={{
      branches,
      activeBranch,
      activeBranchId,
      setActiveBranchId,
      loading,
      refresh: fetchBranches,
      userPermissions,
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranches() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranches must be used within BranchProvider');
  return ctx;
}
