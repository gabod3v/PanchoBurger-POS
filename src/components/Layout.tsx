import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Wallet, PlusCircle, ClipboardList, BarChart3, Menu, ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Tags, History } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menú' },
  { to: '/categorias', icon: Tags, label: 'Categorías' },
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/caja', icon: Wallet, label: 'Caja' },
  { to: '/nuevo-pedido', icon: PlusCircle, label: 'Nuevo Pedido' },
  { to: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/resumen', icon: BarChart3, label: 'Resumen' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const SyncIndicator = () => {
    const { syncStatus, pendingActions } = state;
    if (syncStatus === 'offline') return <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-destructive px-2 py-0.5 bg-destructive/10 rounded-full animate-pulse border border-destructive/20 uppercase tracking-tighter"><WifiOff size={10} /> Offline</div>;
    if (syncStatus === 'syncing') return <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-secondary px-2 py-0.5 bg-secondary/10 rounded-full animate-spin-slow border border-secondary/20 uppercase tracking-tighter"><RefreshCw size={10} /> Sincronizando ({pendingActions.length})</div>;
    return <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-success px-2 py-0.5 bg-success/10 rounded-full border border-success/20 uppercase tracking-tighter"><Wifi size={10} /> Online</div>;
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      <div className="p-6 border-b border-sidebar-border h-24 flex flex-col items-center justify-center shrink-0 gap-3">
        <div className="flex items-center gap-3 w-full">
          <img src="/logo.png" alt="Pancho Burger Logo" className={`rounded-xl object-cover transition-all ${collapsed ? 'w-10 h-10 mx-auto' : 'w-8 h-8'}`} />
          {!collapsed && (
            <h1 className="text-[1.1rem] font-bold font-display tracking-tight text-sidebar-foreground uppercase shrink-0">
              Pancho Burger
            </h1>
          )}
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
      </nav>
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
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold font-display text-[1.1rem] uppercase tracking-tight">Pancho Burger</span>
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
