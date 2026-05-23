import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Clock, ArrowRight, Loader2, AlertTriangle, Copy, CheckCheck, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRY_CODES, VENEZUELAN_BANKS } from '@/lib/register-schema';

const PLANS = [
  { id: 'basic' as const, name: 'Basic', price: 29, popular: false },
  { id: 'professional' as const, name: 'Professional', price: 59, popular: true },
  { id: 'enterprise' as const, name: 'Enterprise', price: 99, popular: false },
];

type PaymentRecord = {
  id: string;
  plan: string;
  amount_usd: number;
  amount_bs: number;
  exchange_rate: number;
  bank_origin?: string;
  reference_number: string | null;
  status: string;
  created_at: string;
  verified_at: string | null;
};

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' }> = {
  active: { label: 'Activa', variant: 'success' },
  trial: { label: 'Prueba', variant: 'secondary' },
  expired: { label: 'Vencida', variant: 'destructive' },
  pending_verification: { label: 'Pendiente', variant: 'outline' },
};

// Pago Móvil info — loaded from configuracion_pago table (settable via Admin panel)
const DEFAULT_PAGO_INFO = {
  bank_name: 'BANCO DE VENEZUELA',
  phone: '04121234567',
  rif: 'J-12345678-9',
  beneficiary_name: 'PedidoClaro C.A.',
};

export default function SuscripcionPage() {
  const { subscription, tenant, refreshProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [phoneOrigin, setPhoneOrigin] = useState('');
  const [phoneOriginCode, setPhoneOriginCode] = useState('+58');
  const [submitBsAmount, setSubmitBsAmount] = useState<number>(0);
  const [bankOrigin, setBankOrigin] = useState('');
  const [otherBankOrigin, setOtherBankOrigin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pagoInfo, setPagoInfo] = useState(DEFAULT_PAGO_INFO);

  useEffect(() => {
    loadPayments();
    loadExchangeRate();
    loadPagoConfig();
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (showPayDialog && selectedPlan) {
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (plan) {
        setSubmitBsAmount(Math.round(plan.price * exchangeRate * 100) / 100);
      }
      setBankOrigin('');
      setOtherBankOrigin('');
      setPhoneOriginCode('+58');
      setPhoneOrigin('');
      setReferenceNumber('');
    }
  }, [showPayDialog, selectedPlan]);

  const loadPagoConfig = async () => {
    const { data } = await supabase!
      .from('configuracion_pago')
      .select('bank_name, phone, rif, beneficiary_name')
      .limit(1)
      .maybeSingle();
    if (data) {
      setPagoInfo({
        bank_name: data.bank_name || DEFAULT_PAGO_INFO.bank_name,
        phone: data.phone || DEFAULT_PAGO_INFO.phone,
        rif: data.rif || DEFAULT_PAGO_INFO.rif,
        beneficiary_name: data.beneficiary_name || DEFAULT_PAGO_INFO.beneficiary_name,
      });
    }
  };

  const loadPayments = async () => {
    if (!tenant) return;
    const { data } = await supabase!
      .from('pagos_suscripcion')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    if (data) setPayments(data as PaymentRecord[]);
    setLoading(false);
  };

  const loadExchangeRate = async () => {
    const { data } = await supabase!
      .from('sesiones_dia')
      .select('exchange_rate')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setExchangeRate(parseFloat(data.exchange_rate));
  };

  const handlePay = async () => {
    if (!selectedPlan || !tenant || !referenceNumber) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    setSubmitting(true);

    const finalBankOrigin = bankOrigin === 'Otro' ? otherBankOrigin : bankOrigin;
    const finalPhoneOrigin = phoneOrigin ? `${phoneOriginCode}${phoneOrigin}` : null;

    const { error } = await supabase!
      .from('pagos_suscripcion')
      .insert({
        tenant_id: tenant.id,
        subscription_id: subscription?.id,
        plan: selectedPlan,
        amount_usd: plan.price,
        amount_bs: Math.round(submitBsAmount * 100) / 100,
        exchange_rate: exchangeRate,
        reference_number: referenceNumber,
        phone_origin: finalPhoneOrigin,
        bank_origin: finalBankOrigin || null,
        status: 'pending_verification',
      });

    if (error) {
      toast.error('Error al registrar el pago: ' + error.message);
    } else {
      toast.success('Pago registrado. Estamos verificando tu transferencia.');
      setShowPayDialog(false);
      setReferenceNumber('');
      setPhoneOrigin('');
      setSelectedPlan(null);
      loadPayments();
      refreshProfile();
    }
    setSubmitting(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = subscription?.status === 'expired';
  const daysLeft = subscription?.expires_at
    ? Math.max(0, Math.floor((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Suscripción</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu plan y método de pago</p>
      </div>

      {/* Current Plan */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="font-display">Plan Actual</CardTitle>
            <CardDescription>Tu suscripción activa</CardDescription>
          </div>
          {subscription?.status && (
            <Badge variant={STATUS_MAP[subscription.status]?.variant || 'outline'}>
              {STATUS_MAP[subscription.status]?.label || subscription.status}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display capitalize">{subscription.plan}</span>
                <span className="text-muted-foreground">
                  {subscription.status === 'trial' && '(Prueba Gratis)'}
                </span>
              </div>
              {subscription.expires_at && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock size={14} />
                  {isExpired
                    ? 'Suscripción vencida'
                    : `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`
                  }
                  {!isExpired && ` — vence ${new Date(subscription.expires_at).toLocaleDateString('es-VE')}`}
                </p>
              )}
              {isExpired && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
                  <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">Suscripción vencida</p>
                    <p className="text-muted-foreground mt-1">Renueva tu plan para seguir usando PedidoClaro.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No tienes una suscripción activa.</p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold font-display mb-4">
          {subscription ? 'Cambiar de Plan' : 'Elige tu Plan'}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = subscription?.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative border-2 cursor-pointer transition-all hover:shadow-md ${
                  plan.popular ? 'border-primary' : 'border-border/50 hover:border-border'
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setShowPayDialog(true);
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="text-[0.6rem] uppercase tracking-wider">Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-display">{plan.name}</CardTitle>
                  <CardContent className="p-0 pt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </CardContent>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Historial de Pagos</CardTitle>
          <CardDescription>Registro de tus pagos con Pago Móvil</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay pagos registrados aún.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card">
                  <div>
                    <p className="font-medium capitalize text-sm">{p.plan} — ${p.amount_usd}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {p.reference_number && ` — Ref: ${p.reference_number}`}
                    </p>
                    {p.bank_origin && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Banco origen: {p.bank_origin}
                        {p.amount_bs > 0 && ` — Bs ${p.amount_bs.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                  <Badge variant={
                    p.status === 'verified' ? 'success' :
                    p.status === 'pending_verification' ? 'outline' :
                    'secondary'
                  }>
                    {p.status === 'verified' ? 'Verificado' :
                     p.status === 'pending_verification' ? 'Pendiente' : p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Pagar con Pago Móvil</DialogTitle>
            <DialogDescription>
              Realiza la transferencia y registra los datos del pago.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (() => {
            const plan = PLANS.find(p => p.id === selectedPlan)!;
            const expectedBs = plan.price * exchangeRate;
            const difference = submitBsAmount - expectedBs;

            return (
              <div className="space-y-5">
                {/* Bank Info */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-2">
                  <p className="text-sm font-semibold">Datos para el Pago Móvil</p>
                  {[
                    { label: 'Banco', value: pagoInfo.bank_name, key: 'bank' },
                    { label: 'Teléfono', value: pagoInfo.phone, key: 'phone' },
                    { label: 'RIF', value: pagoInfo.rif, key: 'rif' },
                    { label: 'Beneficiario', value: pagoInfo.beneficiary_name, key: 'beneficiary' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.value}</span>
                        <button
                          onClick={() => copyToClipboard(item.value, item.key)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied === item.key ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section: Esperado */}
                <div className="p-4 rounded-xl border border-border/50 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign size={14} />
                    Monto esperado
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">USD</span>
                  </div>
                  {exchangeRate > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      ≈ Bs {expectedBs.toFixed(2)} <span className="text-xs">(tasa BCV: Bs {exchangeRate}/USD)</span>
                    </p>
                  ) : (
                    <p className="text-sm text-destructive">Tasa BCV no disponible. Contacta al administrador.</p>
                  )}
                </div>

                {/* Section: Pagado */}
                <div className="p-4 rounded-xl border border-border/50 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Check size={14} />
                    Datos del pago realizado
                  </p>

                  {/* Amount Bs editable */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bsAmount">Monto en Bs que pagaste</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Bs</span>
                      <Input
                        id="bsAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-9"
                        value={submitBsAmount}
                        onChange={e => setSubmitBsAmount(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  {/* Difference indicator */}
                  {exchangeRate > 0 && submitBsAmount > 0 && (
                    <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                      Math.abs(difference) < 0.01
                        ? 'bg-green-500/10 text-green-600'
                        : difference > 0
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}>
                      {Math.abs(difference) < 0.01 ? (
                        <>Monto exacto — sin diferencia</>
                      ) : difference > 0 ? (
                        <>Pagaste Bs {difference.toFixed(2)} adicionales</>
                      ) : (
                        <>Faltan Bs {Math.abs(difference).toFixed(2)}</>
                      )}
                    </div>
                  )}

                  {/* Bank Origin */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bankOrigin">Banco de origen</Label>
                    <Select value={bankOrigin} onValueChange={setBankOrigin}>
                      <SelectTrigger id="bankOrigin">
                        <SelectValue placeholder="Selecciona un banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {VENEZUELAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bankOrigin === 'Otro' && (
                      <Input
                        placeholder="Especifica el banco"
                        value={otherBankOrigin}
                        onChange={e => setOtherBankOrigin(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Phone Origin */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneOrigin">Teléfono de origen (opcional)</Label>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <Select value={phoneOriginCode} onValueChange={setPhoneOriginCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Código" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_CODES.map((cc) => (
                            <SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phoneOrigin"
                        placeholder="4121234567"
                        value={phoneOrigin}
                        onChange={e => setPhoneOrigin(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Reference */}
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Número de Referencia</Label>
                  <Input
                    id="reference"
                    placeholder="Ej: 123456789"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>

                <Button
                  className="w-full font-semibold"
                  disabled={submitting || !referenceNumber || !bankOrigin}
                  onClick={handlePay}
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Pago'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Una vez realizada la transferencia, tu suscripción se activará automáticamente al recibir la notificación SMS, o un administrador la confirmará manualmente.
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
