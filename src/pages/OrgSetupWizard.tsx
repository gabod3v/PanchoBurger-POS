import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Store, UtensilsCrossed, Users, CheckCircle, ArrowRight, ArrowLeft, Loader2, Plus, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 'info', icon: Store, label: 'Restaurante' },
  { id: 'products', icon: UtensilsCrossed, label: 'Productos' },
  { id: 'team', icon: Users, label: 'Equipo' },
  { id: 'done', icon: CheckCircle, label: 'Listo' },
];

interface QuickProduct {
  name: string;
  category: string;
  price: string;
}

const SUGGESTED_PRODUCTS = [
  { name: 'Hamburguesa Clásica', category: 'Comida', suggested_price: 8 },
  { name: 'Hamburguesa Doble', category: 'Comida', suggested_price: 12 },
  { name: 'Papas Fritas', category: 'Comida', suggested_price: 4 },
  { name: 'Aros de Cebolla', category: 'Comida', suggested_price: 5 },
  { name: 'Refresco', category: 'Bebidas', suggested_price: 2 },
  { name: 'Agua', category: 'Bebidas', suggested_price: 1.5 },
  { name: 'Pollo a la Plancha', category: 'Comida', suggested_price: 10 },
  { name: 'Perro Caliente', category: 'Comida', suggested_price: 6 },
  { name: 'Nuggets', category: 'Comida', suggested_price: 7 },
  { name: 'Batido', category: 'Bebidas', suggested_price: 4 },
];

export default function OrgSetupWizard() {
  const navigate = useNavigate();
  const { tenant, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Restaurant info
  const [restaurantName, setRestaurantName] = useState(tenant?.name || '');
  const [restaurantAddress, setRestaurantAddress] = useState('');

  // Step 2: Products
  const [products, setProducts] = useState<QuickProduct[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');

  // Step 3: Team invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const addProduct = (name: string, category: string, price: string) => {
    if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
    setProducts([...products, { name, category, price }]);
  };

  const removeProduct = (name: string) => {
    setProducts(products.filter(p => p.name !== name));
  };

  const addInvitedEmail = () => {
    if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail) && !invitedEmails.includes(inviteEmail)) {
      setInvitedEmails([...invitedEmails, inviteEmail]);
      setInviteEmail('');
    }
  };

  const handleFinish = async () => {
    if (!tenant) return;
    setLoading(true);

    try {
      // 1. Update restaurant address
      if (restaurantAddress) {
        const { data: locations } = await supabase!
          .from('ubicaciones')
          .select('id')
          .eq('tenant_id', tenant.id)
          .limit(1);

        if (locations && locations.length > 0) {
          await supabase!
            .from('ubicaciones')
            .update({ address: restaurantAddress })
            .eq('id', locations[0].id);
        }
      }

      // 2. Update tenant name if changed
      if (restaurantName && restaurantName !== tenant.name) {
        await supabase!
          .from('inquilinos')
          .update({ name: restaurantName })
          .eq('id', tenant.id);
      }

      // 3. Create products
      for (const p of products) {
        const catId = crypto.randomUUID();
        // Create category if needed
        const { data: existingCat } = await supabase!
          .from('categorias')
          .select('id')
          .eq('name', p.category)
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        const categoryId = existingCat?.id || crypto.randomUUID();

        if (!existingCat) {
          await supabase!
            .from('categorias')
            .insert({ id: categoryId, name: p.category, tenant_id: tenant.id });
        }

        await supabase!
          .from('productos')
          .insert({
            id: crypto.randomUUID(),
            name: p.name,
            price: parseFloat(p.price),
            category: p.category,
            tenant_id: tenant.id,
          });
      }

      // 4. Send invites
      for (const email of invitedEmails) {
        const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase!
          .from('invitaciones')
          .insert({
            tenant_id: tenant.id,
            email,
            role: 'cashier',
            token,
            expires_at: expiresAt.toISOString(),
            created_by: profile!.id,
          });
      }

      await refreshProfile();
      toast.success('Restaurante configurado correctamente');
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
    }
    setLoading(false);
  };

  // If already set up, redirect to dashboard
  // (setup is tracked by having products — if none, show wizard)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-slide-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display tracking-tight">Configura tu Restaurante</h1>
          <p className="text-muted-foreground mt-1">En unos minutos estarás listo para operar</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' :
                  isDone ? 'bg-success/10 text-success' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon size={14} />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground/40" />
                )}
              </div>
            );
          })}
        </div>

        <Progress value={progress} className="mb-8 h-1.5" />

        <Card className="border-border/50 shadow-sm">
          {/* Step 1: Restaurant Info */}
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle className="font-display">Información del Restaurante</CardTitle>
                <CardDescription>Cuéntanos sobre tu negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rest-name">Nombre del Restaurante</Label>
                  <Input
                    id="rest-name"
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    placeholder="Pancho Burger"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rest-address">Dirección</Label>
                  <Input
                    id="rest-address"
                    value={restaurantAddress}
                    onChange={e => setRestaurantAddress(e.target.value)}
                    placeholder="Av. Principal, Local 3"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => setStep(1)} disabled={!restaurantName}>
                  Siguiente <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* Step 2: Products */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="font-display">Agrega tus Productos</CardTitle>
                <CardDescription>Selecciona de la lista o agrega los tuyos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick add form */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre del producto"
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Precio USD"
                    value={newProductPrice}
                    onChange={e => setNewProductPrice(e.target.value)}
                    className="w-28"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!newProductName || !newProductPrice}
                    onClick={() => {
                      addProduct(newProductName, 'Comida', newProductPrice);
                      setNewProductName('');
                      setNewProductPrice('');
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Suggested products */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Sugeridos:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PRODUCTS.filter(sp => !products.some(p => p.name === sp.name)).map(sp => (
                      <Badge
                        key={sp.name}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors text-xs"
                        onClick={() => addProduct(sp.name, sp.category, sp.suggested_price.toString())}
                      >
                        + {sp.name} (${sp.suggested_price})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Added products */}
                {products.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Tus productos:</p>
                    {products.map(p => (
                      <div key={p.name} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category} — ${parseFloat(p.price).toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeProduct(p.name)}>
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Agrega al menos un producto o presiona "Saltar"
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft size={16} className="mr-2" /> Atrás
                </Button>
                <Button onClick={() => setStep(2)}>
                  {products.length > 0 ? 'Siguiente' : 'Saltar'} <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* Step 3: Team */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="font-display">Invita a tu Equipo</CardTitle>
                <CardDescription>Agrega miembros para que te ayuden (opcional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addInvitedEmail()}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={addInvitedEmail} disabled={!inviteEmail}>
                    <Plus size={16} className="mr-1" /> Agregar
                  </Button>
                </div>

                {invitedEmails.length > 0 && (
                  <div className="space-y-1.5">
                    {invitedEmails.map(email => (
                      <div key={email} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card">
                        <span className="text-sm">{email}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setInvitedEmails(invitedEmails.filter(e => e !== email))}>
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {invitedEmails.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Puedes invitar a tu equipo después desde la sección "Equipo"
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} className="mr-2" /> Atrás
                </Button>
                <Button onClick={() => setStep(3)}>
                  Siguiente <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* Step 4: Done */}
          {step === 3 && (
            <>
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <CardTitle className="font-display">¡Todo Listo!</CardTitle>
                <CardDescription>
                  {products.length > 0
                    ? `Cargaste ${products.length} producto${products.length !== 1 ? 's' : ''}${invitedEmails.length > 0 ? ` e invitaste a ${invitedEmails.length} persona${invitedEmails.length !== 1 ? 's' : ''}` : ''}.`
                    : 'Ya puedes empezar a usar PedidoClaro.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Restaurante configurado', done: true },
                  { label: `${products.length} producto${products.length !== 1 ? 's' : ''} agregado${products.length !== 1 ? 's' : ''}`, done: products.length > 0 },
                  { label: `${invitedEmails.length} invitacione${invitedEmails.length !== 1 ? 's' : ''} enviada${invitedEmails.length !== 1 ? 's' : ''}`, done: invitedEmails.length > 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    {item.done ? (
                      <CheckCircle size={18} className="text-success shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? '' : 'text-muted-foreground'}`}>{item.label}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full font-semibold" onClick={handleFinish} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Ir al Dashboard'}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
