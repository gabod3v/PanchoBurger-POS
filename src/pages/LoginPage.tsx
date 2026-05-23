import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

function LoginIllustration() {
  return (
    <div className="hidden lg:block relative w-[45%] xl:w-[42%] overflow-hidden bg-primary/90">
      <img
        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />
      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
    </div>
  );
}

export default function LoginPage() {
  const { signIn, user, profile, initialized } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  // Redirect based on role once auth is ready after login
  useEffect(() => {
    console.log('LoginPage: redirect check', { loggedIn, user: user?.email, initialized, role: profile?.role });
    if (loggedIn && user && initialized) {
      if (profile?.role === 'super_admin') {
        console.log('LoginPage: redirecting to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('LoginPage: redirecting to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loggedIn, user, initialized, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : signInError.message
      );
    } else {
      setLoggedIn(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm animate-slide-in">
          {/* Logo / Brand */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground shadow-sm mb-5">
              <UtensilsCrossed size={22} />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight">
              Iniciar sesión
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Ingresá tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Iniciar Sesión'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — Illustration (hidden on mobile) */}
      <LoginIllustration />
    </div>
  );
}
