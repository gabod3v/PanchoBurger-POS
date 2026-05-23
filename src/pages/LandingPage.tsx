import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Menu as MenuIcon, X, Play } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 29,
    description: 'Para empezar tu negocio',
    features: ['1 sucursal', '2 usuarios', 'Menú digital', 'Toma de pedidos', 'Reportes del día', 'Soporte por correo'],
    popular: false,
  },
  {
    name: 'Professional',
    price: 59,
    description: 'Para hacer crecer tu negocio',
    features: ['Hasta 3 sucursales', '10 usuarios', 'Todo lo de Basic', 'Pantalla de cocina', 'Pago Móvil + Punto de Venta', 'Reportes avanzados', 'Soporte prioritario'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'Para cadenas y grandes volúmenes',
    features: ['Sucursales ilimitadas', 'Usuarios ilimitados', 'Todo lo de Professional', 'Conexión con otras apps', 'Múltiples menús', 'Panel de control ejecutivo', 'Soporte 24/7', 'Asesoría personalizada'],
    popular: false,
  },
];

/* ── Scroll-reveal hook ── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, revealed };
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} ${revealed ? 'animate-fade-up' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  if (user && initialized) {
    if (profile?.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  return (
    <div className="bg-background grain-overlay">
      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.08]">
              <span className="text-primary-foreground text-xs font-bold tracking-tight">PC</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">PedidoClaro</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              ['features', 'Características'],
              ['demo', 'Demo'],
              ['pricing', 'Planes'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-200
                  after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[1px]
                  after:bg-foreground after:scale-x-0 hover:after:scale-x-100
                  after:transition-transform after:duration-300 after:origin-left"
              >
                {label}
              </button>
            ))}
            <Link
              to="/login"
              className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200
                after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[1px]
                after:bg-foreground after:scale-x-0 hover:after:scale-x-100
                after:transition-transform after:duration-300 after:origin-left"
            >
              Iniciar Sesión
            </Link>
            <Button onClick={() => navigate('/register')} size="sm" className="font-semibold text-xs h-9 px-5">
              Empezar Gratis
            </Button>
          </nav>

          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menú">
            {mobileMenu ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-border/40 bg-background px-6 py-5 space-y-4 animate-fade-up">
            <button onClick={() => scrollTo('features')} className="block w-full text-left py-3 text-sm min-h-[44px]">Características</button>
            <button onClick={() => scrollTo('demo')} className="block w-full text-left py-3 text-sm min-h-[44px]">Demo</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left py-3 text-sm min-h-[44px]">Planes</button>
            <Link to="/login" className="block py-3 text-sm font-medium min-h-[44px]">Iniciar Sesión</Link>
            <Button onClick={() => navigate('/register')} className="w-full font-semibold min-h-[44px]">Empezar Gratis</Button>
          </div>
        )}
      </header>

      {/* ===== 01 HERO ===== */}
      <section className="pt-28 pb-24 sm:pt-36 sm:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="animate-fade-up delay-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.04] border border-primary/[0.08] text-xs text-muted-foreground mb-6 tracking-wide uppercase">
                Para restaurantes y cafeterías
              </div>
            </div>
            <div className="animate-fade-up delay-100">
              <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold font-display tracking-[-0.03em] leading-[1.05] text-balance">
                Gestiona tu restaurante<br />
                <span className="text-secondary">sin complicaciones</span>
              </h1>
            </div>
            <div className="animate-fade-up delay-200">
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Tomá pedidos, cobrá en USD o Bs, y mantené todo funcionando
                aunque falle el internet. Sin papel, sin filas, sin dolor de cabeza.
              </p>
            </div>
            <div className="animate-fade-up delay-300">
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/register')} className="font-semibold text-sm h-11 px-7 group">
                  Prueba Gratis 30 Días <ArrowRight size={16} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo('demo')} className="font-semibold text-sm h-11 px-7">
                  Ver Demo
                </Button>
              </div>
            </div>
            <div className="animate-fade-up delay-400">
              <p className="mt-3 text-xs text-muted-foreground">Sin tarjeta de crédito. Sin compromiso.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 02 FEATURES ===== */}
      <section id="features" className="py-24 sm:py-32 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-2xl mb-16">
              <p className="text-xs text-muted-foreground tracking-wide uppercase mb-3">01 / Características</p>
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold font-display tracking-[-0.02em] leading-[1.1]">
                Todo lo que necesitas para operar
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Desde la apertura de caja hasta el cierre del día. PedidoClaro cubre cada etapa de tu operación.
              </p>
            </div>
          </Reveal>

          {/* Primary features — editorial layout */}
          <div className="grid lg:grid-cols-2 gap-x-16 gap-y-14 mb-16">
            {[
              { title: 'Sin internet, sin problema', desc: 'Si se va el internet, el sistema sigue funcionando igual. Todos los pedidos se guardan solos y cuando vuelve la conexión todo está al día. El negocio nunca se detiene.', tag: 'core' },
              { title: 'Tasa BCV al día', desc: 'Vendés en USD y el precio en Bs se calcula solo al rate BCV del día. Sin tener que revisar el dólar cada mañana, sin errores al convertir.', tag: 'core' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group cursor-default">
                  <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground/40 font-mono tracking-wider uppercase mb-4">
                    <span className="w-6 h-px bg-border/60 inline-block" />
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Secondary features — compact, two-column */}
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {[
              { title: 'Se instala en tu celular', desc: 'Agregás PedidoClaro a la pantalla de tu tablet o teléfono como si fuera una app de verdad. Ocupa poquito espacio.' },
              { title: 'Varias sucursales', desc: 'Manejás todos tus locales desde un solo lugar. Cada sucursal con su propio equipo y su propia caja.' },
              { title: 'Menú digital', desc: 'Cargás tus productos con foto, precio y categoría. Vendés por peso o por unidad, en Bs o USD. Todo como vos quieras.' },
              { title: 'Pantalla de cocina', desc: 'Los pedidos llegan solitos a la cocina en una pantalla. Se acabó el papel y los gritos.' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 60 + 200}>
                <div className="group flex items-start gap-4">
                  <span className="text-xs font-mono text-muted-foreground/20 mt-0.5 shrink-0 transition-colors duration-300 group-hover:text-secondary">
                    {String(i + 3).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 03 DEMO ===== */}
      <section id="demo" className="py-24 sm:py-32 bg-muted/30 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-xl mb-14">
              <p className="text-xs text-muted-foreground tracking-wide uppercase mb-3">02 / Demo</p>
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold font-display tracking-[-0.02em] leading-[1.1]">
                Velo en acción
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Así se ve PedidoClaro en el día a día de un restaurante.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="max-w-4xl">
              <div className="group relative rounded-2xl overflow-hidden border border-border/50 bg-muted/80 aspect-video cursor-pointer transition-shadow duration-500 hover:shadow-lg">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-background/80 border border-border/50 flex items-center justify-center mb-4 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:bg-background/95 group-hover:shadow-md">
                    <Play size={22} className="text-foreground ml-0.5 transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Video demo</p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">Acá va el video de demostración</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-14">
              <p className="text-xs text-muted-foreground/50 tracking-wide uppercase mb-5">Capturas</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Resumen del día', desc: 'Ventas, tickets y lo que importa de un vistazo' },
                  { label: 'Tomar pedido', desc: 'Elegís productos, ponés cantidades y cobrás al toque' },
                  { label: 'Pantalla de cocina', desc: 'Los pedidos llegan solos a la cocina, en orden' },
                ].map((shot, i) => (
                  <div key={i} className="group relative aspect-[4/3] rounded-xl border border-border/40 bg-muted/60 overflow-hidden transition-all duration-500 hover:border-border/60 hover:shadow-sm">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-500 group-hover:scale-[1.02]">
                      <div className="w-20 h-20 rounded-xl bg-muted/80 border border-border/30 flex items-center justify-center mb-3 transition-all duration-500 group-hover:scale-110 group-hover:border-border/50">
                        <span className="text-muted-foreground/20 text-2xl font-mono font-bold">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/80">{shot.label}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">{shot.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-muted-foreground/40 mt-4">
                Reemplazá estos cuadros grises con las capturas de tu pantalla
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 04 PRICING ===== */}
      <section id="pricing" className="py-24 sm:py-32 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-xl mb-16">
              <p className="text-xs text-muted-foreground tracking-wide uppercase mb-3">03 / Planes</p>
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold font-display tracking-[-0.02em] leading-[1.1]">
                Precios simples, sin sorpresas
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Precios en USD. Pagas con Pago Móvil a la tasa BCV del día.
                <br />Empieza con 30 días de prueba gratuita.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl">
            {plans.map((plan, i) => (
              <Reveal key={i} delay={i * 120}>
                <div
                  className={`relative rounded-2xl border p-8 transition-all duration-500 ${
                    plan.popular
                      ? 'border-primary shadow-sm bg-primary/[0.02] hover:shadow-md hover:-translate-y-0.5'
                      : 'border-border/50 bg-card hover:border-border/70 hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-[13px] left-6">
                      <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold uppercase tracking-wider animate-fade-up">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-xs text-muted-foreground tracking-wide uppercase mb-1">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-[2rem] font-bold tracking-tight">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <Check size={14} className="text-secondary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => navigate('/register')}
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full font-semibold text-sm h-10 group"
                  >
                    {plan.popular ? 'Empezar Prueba Gratis' : 'Seleccionar'}
                    {plan.popular && (
                      <ArrowRight size={14} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={400}>
            <p className="text-center text-sm text-muted-foreground/70 mt-8">
              ¿Dudas?{' '}
              <a href="mailto:soporte@pedidoclaro.com" className="text-foreground hover:text-secondary transition-colors duration-300 font-medium">
                Contáctanos
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 border-t border-border/40 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-xs text-muted-foreground tracking-wide uppercase mb-4">Comienza hoy</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold font-display tracking-[-0.02em] leading-[1.1] text-balance max-w-xl mx-auto">
              Listo para poner tu restaurante al día?
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
              30 días gratis. Sin compromisos. Configura tu menú en minutos.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-8">
              <Button size="lg" onClick={() => navigate('/register')} className="font-semibold text-sm h-11 px-8 group">
                Crear Cuenta Gratis <ArrowRight size={16} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <span className="text-primary-foreground text-[10px] font-bold">PC</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">PedidoClaro</span>
          </Link>
          <p className="text-[11px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} PedidoClaro. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
