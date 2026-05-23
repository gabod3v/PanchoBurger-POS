import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, CreditCard, DollarSign, CheckCircle, XCircle, Loader2, Search, AlertTriangle, Cog, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  profile_count?: number;
  subscription_status?: string;
  subscription_plan?: string;
};

type PaymentRow = {
  id: string;
  tenant_id: string;
  plan: string;
  amount_usd: number;
  amount_bs: number;
  exchange_rate?: number;
  bank_origin?: string | null;
  reference_number: string | null;
  status: string;
  created_at: string;
  tenant_name?: string;
};

export default function AdminPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('overview');
  const [confirming, setConfirming] = useState<string | null>(null);

  // Payment config state
  const [payConfig, setPayConfig] = useState({
    bank_name: '',
    phone: '',
    rif: '',
    beneficiary_name: '',
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    loadTenants();
    loadPayments();
    loadPaymentConfig();
  }, []);

  const loadPaymentConfig = async () => {
    const { data } = await supabase!
      .from('configuracion_pago')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (data) {
      setPayConfig({
        bank_name: data.bank_name || '',
        phone: data.phone || '',
        rif: data.rif || '',
        beneficiary_name: data.beneficiary_name || '',
      });
    }
    setLoadingConfig(false);
  };

  const savePaymentConfig = async () => {
    setSavingConfig(true);
    const { error } = await supabase!
      .from('configuracion_pago')
      .upsert({
        bank_name: payConfig.bank_name,
        phone: payConfig.phone,
        rif: payConfig.rif,
        beneficiary_name: payConfig.beneficiary_name,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) toast.error('Error al guardar: ' + error.message);
    else toast.success('Configuración guardada');
    setSavingConfig(false);
  };

  const loadTenants = async () => {
    const { data } = await supabase!
      .from('inquilinos')
      .select(`
        *,
        profile_count:perfiles!inner(count)
      `)
      .order('created_at', { ascending: false });

    // Also get subscription info for each tenant
    if (data) {
      const tenantsWithSubs = await Promise.all(
        (data as any[]).map(async (t: any) => {
          const { data: sub } = await supabase!
            .from('suscripciones')
            .select('status, plan')
            .eq('tenant_id', t.id)
            .maybeSingle();
          return {
            ...t,
            profile_count: t.profile_count?.[0]?.count || 0,
            subscription_status: sub?.status,
            subscription_plan: sub?.plan,
          } as TenantRow;
        })
      );
      setTenants(tenantsWithSubs);
    }
    setLoadingTenants(false);
  };

  const loadPayments = async () => {
    const { data } = await supabase!
      .from('pagos_suscripcion')
      .select('*, inquilinos!inner(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setPayments((data as any[]).map(p => ({
        ...p,
        tenant_name: (p as any).inquilinos?.name,
      })));
    }
    setLoadingPayments(false);
  };

  const confirmPayment = async (paymentId: string) => {
    setConfirming(paymentId);
    const { data: { user } } = await supabase!.auth.getUser();
    const { error } = await supabase!
      .rpc('confirm_subscription_payment', {
        p_payment_id: paymentId,
        p_verified_by: user?.id,
      });

    if (error) {
      toast.error('Error al confirmar: ' + error.message);
    } else {
      toast.success('Pago confirmado. Suscripción activada por 30 días.');
      loadPayments();
      loadTenants();
    }
    setConfirming(null);
  };

  const rejectPayment = async (paymentId: string) => {
    const { error } = await supabase!
      .from('pagos_suscripcion')
      .update({ status: 'cancelled' })
      .eq('id', paymentId);

    if (error) toast.error('Error al rechazar');
    else {
      toast.success('Pago rechazado');
      loadPayments();
    }
  };

  if (!isSuperAdmin) return null;

  // Stats
  const activeSubscriptions = tenants.filter(t => t.subscription_status === 'active' || t.subscription_status === 'trial').length;
  const pendingPayments = payments.filter(p => p.status === 'pending_verification').length;
  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount_usd, 0);

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tenants, suscripciones y pagos</p>
        </div>
        <Badge variant="default" className="text-xs">Super Admin</Badge>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="payments">
            Pagos
            {pendingPayments > 0 && (
              <Badge variant="destructive" className="ml-2 text-[0.6rem] px-1.5 py-0">{pendingPayments}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Cog size={14} className="mr-1.5" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-primary" />
                  <span className="text-3xl font-bold">{tenants.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Suscripciones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-success" />
                  <span className="text-3xl font-bold">{activeSubscriptions}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className={pendingPayments > 0 ? 'text-destructive' : 'text-muted-foreground'} />
                  <span className="text-3xl font-bold">{pendingPayments}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-secondary" />
                  <span className="text-3xl font-bold">${totalRevenue}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent payments */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Pagos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={24} /></div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin pagos aún.</p>
              ) : (
                <div className="space-y-2">
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div>
                        <p className="text-sm font-medium">{p.tenant_name || '—'} — ${p.amount_usd}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('es-VE')}</p>
                      </div>
                      <Badge variant={
                        p.status === 'verified' ? 'success' :
                        p.status === 'pending_verification' ? 'outline' :
                        p.status === 'cancelled' ? 'destructive' : 'secondary'
                      }>
                        {p.status === 'verified' ? 'Verificado' :
                         p.status === 'pending_verification' ? 'Pendiente' :
                         p.status === 'cancelled' ? 'Rechazado' : p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants */}
        <TabsContent value="tenants" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tenant..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTenants ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline" size={20} /></TableCell></TableRow>
                  ) : filteredTenants.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin resultados</TableCell></TableRow>
                  ) : filteredTenants.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="capitalize">{t.subscription_plan || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          t.subscription_status === 'active' || t.subscription_status === 'trial' ? 'success' :
                          t.subscription_status === 'expired' ? 'destructive' : 'secondary'
                        }>
                          {t.subscription_status === 'trial' ? 'Prueba' :
                           t.subscription_status === 'active' ? 'Activo' :
                           t.subscription_status || 'Sin suscripción'}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.profile_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('es-VE')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Pagos Pendientes de Verificación</CardTitle>
              <CardDescription>Revisa y confirma los pagos realizados por Pago Móvil</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto USD</TableHead>
                    <TableHead>Monto Bs</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Banco Origen</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {loadingPayments ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="animate-spin inline" size={20} /></TableCell></TableRow>
                  ) : payments.filter(p => p.status === 'pending_verification').length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hay pagos pendientes.</TableCell></TableRow>
                  ) : payments.filter(p => p.status === 'pending_verification').map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.tenant_name || '—'}</TableCell>
                      <TableCell className="capitalize">{p.plan}</TableCell>
                      <TableCell>${p.amount_usd}</TableCell>
                      <TableCell>Bs {p.amount_bs.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">{p.reference_number || '—'}</TableCell>
                      <TableCell className="text-sm">{p.bank_origin || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="default" disabled={confirming === p.id} onClick={() => confirmPayment(p.id)}>
                            {confirming === p.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} className="mr-1" />}
                            Confirmar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectPayment(p.id)}>
                            <XCircle size={14} className="mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Verified payments history */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Historial de Pagos</CardTitle>
              <CardDescription>Todos los pagos registrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Bs Pagado | Bs Esperado | Diferencia</TableHead>
                    <TableHead>Banco Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.filter(p => p.status !== 'pending_verification').length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin historial.</TableCell></TableRow>
                  ) : payments.filter(p => p.status !== 'pending_verification').map(p => {
                    const expectedBs = p.amount_usd * (p.exchange_rate || 0);
                    const diff = p.amount_bs - expectedBs;
                    return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.tenant_name || '—'}</TableCell>
                      <TableCell className="capitalize">{p.plan}</TableCell>
                      <TableCell>${p.amount_usd}</TableCell>
                      <TableCell className="text-sm">
                        <span>Bs {p.amount_bs.toFixed(2)}</span>
                        {p.exchange_rate && p.exchange_rate > 0 ? (
                          <span className="text-muted-foreground ml-1">
                            | Bs {expectedBs.toFixed(2)}
                            <span className={diff !== 0 ? (diff > 0 ? ' text-amber-500' : ' text-red-500') : ' text-green-500'}>
                              {' | '}{diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground ml-1 text-xs">| Sin tasa</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{p.bank_origin || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          p.status === 'verified' ? 'success' :
                          p.status === 'cancelled' ? 'destructive' : 'secondary'
                        }>
                          {p.status === 'verified' ? 'Verificado' :
                           p.status === 'cancelled' ? 'Rechazado' : p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('es-VE')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Cog size={18} />
                Pago Móvil — Datos Bancarios
              </CardTitle>
              <CardDescription>
                Estos datos se muestran a los clientes cuando van a pagar su suscripción por Pago Móvil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 max-w-lg">
              {loadingConfig ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Banco</Label>
                    <Input
                      id="bank_name"
                      value={payConfig.bank_name}
                      onChange={e => setPayConfig({ ...payConfig, bank_name: e.target.value })}
                      placeholder="BANCO DE VENEZUELA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={payConfig.phone}
                      onChange={e => setPayConfig({ ...payConfig, phone: e.target.value })}
                      placeholder="04121234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rif">RIF</Label>
                    <Input
                      id="rif"
                      value={payConfig.rif}
                      onChange={e => setPayConfig({ ...payConfig, rif: e.target.value })}
                      placeholder="J-12345678-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiary">Beneficiario</Label>
                    <Input
                      id="beneficiary"
                      value={payConfig.beneficiary_name}
                      onChange={e => setPayConfig({ ...payConfig, beneficiary_name: e.target.value })}
                      placeholder="PedidoClaro C.A."
                    />
                  </div>

                  <Button onClick={savePaymentConfig} disabled={savingConfig} className="font-semibold">
                    {savingConfig ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="mr-1.5" />}
                    Guardar Configuración
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
