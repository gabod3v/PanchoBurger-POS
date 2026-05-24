import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Location } from '@/types';

const STORAGE_KEY_PREFIX = 'active_branch_';

interface BranchContextType {
  branches: Location[];
  activeBranch: Location | null;
  activeBranchId: string | null;
  setActiveBranchId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { tenant, initialized } = useAuth();
  const tenantId = tenant?.id;
  const [branches, setBranches] = useState<Location[]>([]);
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
      const { data } = await supabase
        .from('ubicaciones')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      const activeBranches = (data || []).map(l => ({
        id: l.id,
        tenant_id: l.tenant_id,
        name: l.name,
        address: l.address,
        is_active: l.is_active,
      })) as Location[];

      setBranches(activeBranches as Location[]);

      // Auto-select first active branch if none saved
      const savedId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tenantId}`);
      if (!savedId || !activeBranches.find(b => b.id === savedId)) {
        const firstActive = activeBranches.find(b => b.is_active !== false) || activeBranches[0];
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
  }, [tenantId]);

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
