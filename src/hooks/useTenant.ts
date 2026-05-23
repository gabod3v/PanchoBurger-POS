import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { PostgrestFilterBuilder } from '@supabase/supabase-js';

/**
 * Returns a tenant-scoped Supabase query builder for the given table.
 * Automatically adds `.eq('tenant_id', currentTenantId)` before returning,
 * so every query is scoped to the user's tenant.
 *
 * If the user is not authenticated or has no tenant, returns a regular query
 * (fails gracefully when RLS is off).
 *
 * @example
 * ```ts
 * const { fromTenant } = useTenant();
 * const { data } = await fromTenant('productos').select('*');
 * ```
 */
export function useTenant() {
  const { profile, tenant } = useAuth();

  function fromTenant<T extends Record<string, unknown>>(table: string) {
    if (tenant?.id) {
      return (supabase!.from(table) as unknown as PostgrestFilterBuilder<any, T, any>)
        .eq('tenant_id', tenant.id);
    }
    return supabase!.from(table) as unknown as PostgrestFilterBuilder<any, T, any>;
  }

  /**
   * Adds tenant_id to an insert payload.
   * Skips if no tenant is loaded yet.
   */
  function withTenant<T extends Record<string, unknown>>(payload: T): T & { tenant_id?: string } {
    if (tenant?.id) {
      return { ...payload, tenant_id: tenant.id };
    }
    return payload;
  }

  const isOwner = profile?.role === 'owner' || profile?.role === 'super_admin';

  return { fromTenant, withTenant, isOwner, tenantId: tenant?.id, tenant };
}
