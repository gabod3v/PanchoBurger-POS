import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Wallet, PlusCircle, ClipboardList, BarChart3, Menu, ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Tags, History, Clock, CreditCard, Shield, Users, User, LogOut, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menú' },
  { to: '/categorias', icon: Tags, label: 'Categorías' },
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/pendientes', icon: Clock, label: 'Pendientes' },
  { to: '/caja', icon: Wallet, label: 'Caja' },
  { to: '/nuevo-pedido', icon: PlusCircle, label: 'Nuevo Pedido' },
  { to: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/resumen', icon: BarChart3, label: 'Resumen' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { state } = useApp();
  const { profile, tenant: userTenant, hasRole, subscription, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isExpired = subscription?.status === 'expired';
  const isSuperAdmin = hasRole('super_admin');

  const SyncIndicator = () => {
    const { syncStatus, pendingActions } = state;
    if (syncStatus === 'offline') return <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-destructive px-2 py-0.5 bg-destructive/10 rounded-full animate-pulse border border-destructive/20 uppercase tracking-tighter"><WifiOff size={10} /> Offline</div>;
    if (syncStatus === 'syncing') return <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-secondary px-2 py-0.5 bg-secondary/10 rounded-full animate-spin-slow border border-secondary/20 uppercase tracking-tighter"><RefreshCw size={10} /> Sincronizando ({pendingActions.length})</div>;
    return <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-success px-2 py-0.5 bg-success/10 rounded-full border border-success/20 uppercase tracking-tighter"><Wifi size={10} /> Online</div>;
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => {
    const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
    <>
      <div className="p-4 border-b border-sidebar-border shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <Link to="/perfil" className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-[0.65rem] text-sidebar-foreground/50 truncate flex items-center gap-1">
                  <img src={userTenant?.logo_url || '/default-logo.svg'} alt="Logo" className="w-3.5 h-3.5 rounded object-cover inline-block" />
                  {userTenant?.name || 'PedidoClaro'}
                </p>
              </div>
            )}
          </Link>
        </div>
        {!collapsed && <SyncIndicator />}
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${collapsed ? 'justify-center px-0' : 'px-4'} ${active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
            >
              <Icon size={20} />
              {!collapsed && <span className="flex-1">{label}</span>}
              {to === '/caja' && (
                <span className={`w-2.5 h-2.5 rounded-full absolute ${collapsed ? 'top-2 right-2' : 'relative'} ${state.currentDay?.isOpen ? 'bg-success' : 'bg-destructive'}`} />
              )}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3 border-t border-sidebar-border" />

        {/* Subscription link */}
        <Link
          to="/suscripcion"
          title={collapsed ? 'Suscripción' : undefined}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${collapsed ? 'justify-center px-0' : 'px-4'} ${
            pathname === '/suscripcion'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
        >
          <CreditCard size={20} />
          {!collapsed && (
            <>
              <span className="flex-1">Suscripción</span>
              {isExpired && (
                <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              )}
            </>
          )}
        </Link>

        {/* Admin link (super_admin only) */}
          {isSuperAdmin && (
            <Link
              to="/admin"
              title={collapsed ? 'Admin' : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${collapsed ? 'justify-center px-0' : 'px-4'} ${
                pathname === '/admin'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Shield size={20} />
              {!collapsed && <span className="flex-1">Admin</span>}
            </Link>
          )}

          {/* Team */}
          <Link
            to="/equipo"
            title={collapsed ? 'Equipo' : undefined}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${collapsed ? 'justify-center px-0' : 'px-4'} ${
              pathname === '/equipo'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Users size={20} />
            {!collapsed && <span className="flex-1">Equipo</span>}
          </Link>

          {/* Configuración (owner/manager only) */}
          {hasRole('owner', 'manager') && (
          <Link
            to="/configuracion"
            title={collapsed ? 'Configuración' : undefined}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${collapsed ? 'justify-center px-0' : 'px-4'} ${
              pathname === '/configuracion'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Settings size={20} />
            {!collapsed && <span className="flex-1">Configuración</span>}
          </Link>
          )}

          {/* Profile */}
          <Link
            to="/perfil"
            title={collapsed ? 'Perfil' : undefined}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 py-3 rounded-md text-sm font-medium transition-all duration-300 relative ${collapsed ? 'justify-center px-0' : 'px-4'} ${
              pathname === '/perfil'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <User size={20} />
            {!collapsed && <span className="flex-1">Perfil</span>}
          </Link>
        </nav>
      {/* Sign out */}
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={`w-full flex items-center gap-3 py-3 rounded-md text-sm font-medium text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all ${collapsed ? 'justify-center px-0' : 'px-4'}`}
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
          {!collapsed && <span className="flex-1 text-left">Cerrar Sesión</span>}
        </Button>
      </div>

      {/* Desktop Collapse Toggle */}
      <div className={`hidden md:flex p-3 border-t border-sidebar-border ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={() => setIsCollapsed(!collapsed)}
          title={collapsed ? "Expandir" : "Contraer"}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
    </>
  );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-sidebar text-sidebar-foreground hidden md:flex flex-col border-r border-sidebar-border shrink-0`}>
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden h-16 border-b border-border bg-card flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col">
                <SidebarContent collapsed={false} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <img src={userTenant?.logo_url || '/default-logo.svg'} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold font-display text-[1.1rem] uppercase tracking-tight">{userTenant?.name || 'PedidoClaro'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
