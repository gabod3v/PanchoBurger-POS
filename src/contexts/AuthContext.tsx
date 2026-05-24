import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Tenant, Subscription, UserRole } from '@/types';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { applyBranding, resetBranding } from '@/lib/branding';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  subscription: Subscription | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, tenantName: string, metadata?: Record<string, string>) => Promise<{ error: AuthError | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    tenant: null,
    subscription: null,
    loading: true,
    initialized: false,
  });
  const loadingRef = useRef(false);

  // Load session on mount
  useEffect(() => {
    if (!supabase) {
      console.warn('Auth: Supabase no configurado, skipping auth init');
      setState(prev => ({ ...prev, loading: false, initialized: true }));
      return;
    }

    let cancelled = false;

    console.log('Auth: getSession...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      console.log('Auth: getSession done', session?.user?.email);
      if (session?.user) {
        loadUserData(session.user, session);
      } else {
        setState(prev => ({ ...prev, loading: false, initialized: true }));
      }
    }).catch(e => {
      console.warn('Auth init error:', e);
      if (!cancelled) setState(prev => ({ ...prev, loading: false, initialized: true }));
    });

    // Listen for auth changes AFTER init (SIGNED_IN from login, SIGNED_OUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      console.log('Auth: state change', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserData(session.user, session);
      } else if (event === 'SIGNED_OUT') {
        loadingRef.current = false;
        setState({
          user: null,
          session: null,
          profile: null,
          tenant: null,
          subscription: null,
          loading: false,
          initialized: true,
        });
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async (user: User, session: Session | null) => {
    // Deduplicate: if already loading, skip (StrictMode double-mount guard)
    if (loadingRef.current) {
      console.log('Auth: loadUserData already in progress, skipping');
      return;
    }
    loadingRef.current = true;

    setState(prev => ({ ...prev, user, session, loading: true, initialized: false }));
    console.log('Auth: loadUserData start', user.email);

    try {
      // Get profile — use maybeSingle to avoid 406 errors for missing profiles
      console.log('Auth: fetching profile...');
      const { data: profile, error: profileErr } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      console.log('Auth: profile fetched', profile?.role, profileErr?.message);

      let tenant = null;
      let subscription = null;

      // super_admin doesn't need tenant/subscription lookups
      if (profile && profile.role !== 'super_admin') {
        console.log('Auth: fetching tenant...');
        const { data: tenantData } = await supabase
          .from('inquilinos')
          .select('*')
          .eq('id', profile.tenant_id)
          .maybeSingle();
        tenant = tenantData;
        console.log('Auth: tenant fetched', tenant?.name);

        console.log('Auth: fetching subscription...');
        const { data: subData } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .maybeSingle();
        subscription = subData;
        console.log('Auth: subscription fetched', subscription?.status);
      }

      loadingRef.current = false;
      setState({
        user,
        session,
        profile: (profile ?? null) as unknown as Profile,
        tenant: tenant as unknown as Tenant,
        subscription: subscription as unknown as Subscription,
        loading: false,
        initialized: true,
      });

      // Apply tenant branding colors
      applyBranding(tenant as unknown as Tenant);
      console.log('Auth: initialized complete');
    } catch (e) {
      console.warn('Error loading user data:', e);
      loadingRef.current = false;
      setState(prev => ({
        ...prev,
        user,
        session,
        loading: false,
        initialized: true,
      }));
      console.log('Auth: initialized complete (via catch)');
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase no está configurado') as unknown as AuthError };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) toast.success('Sesión iniciada correctamente');
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, tenantName: string, metadata?: Record<string, string>) => {
    if (!supabase) return { error: new Error('Supabase no está configurado') as unknown as AuthError, user: null };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tenant_name: tenantName,
          ...(metadata || {}),
        },
      },
    });

    if (!error && data.user) {
      toast.success('Cuenta creada. Revisa tu email para confirmar.');
    }

    return { error, user: data.user };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    resetBranding();
    toast.success('Sesión cerrada');
  };

  const refreshProfile = async () => {
    if (!supabase || !state.user) return;
    // Reset loading ref so refresh actually runs
    loadingRef.current = false;
    await loadUserData(state.user, state.session);
  };

  const refreshTenant = async () => {
    if (!supabase || !state.user || !state.profile) return;
    const { data: tenantData } = await supabase
      .from('inquilinos')
      .select('*')
      .eq('id', state.profile.tenant_id)
      .maybeSingle();
    if (tenantData) {
      setState(prev => ({ ...prev, tenant: tenantData as unknown as Tenant }));
      applyBranding(tenantData as unknown as Tenant);
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!state.profile) return false;
    return roles.includes(state.profile.role);
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      refreshTenant,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
