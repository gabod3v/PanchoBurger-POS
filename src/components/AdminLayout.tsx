import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const initials = (profile?.full_name || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple top bar */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-primary" />
          <span className="font-bold font-display text-sm uppercase tracking-tight">PedidoClaro — Admin</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span>{profile?.full_name || 'Super Admin'}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} title="Cerrar Sesión">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
