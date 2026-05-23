import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, COUNTRY_CODES, type RegisterFormData } from '@/lib/register-schema';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      tenantName: '',
      email: '',
      password: '',
      confirmPassword: '',
      docType: 'V',
      docNumber: '',
      phoneCode: '+58',
      phoneNumber: '',
      rif: '',
    },
  });

  const docType = watch('docType');
  const phoneCode = watch('phoneCode');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);

    const fullName = `${data.firstName} ${data.lastName}`;
    const documentId = `${data.docType}-${data.docNumber}`;
    const phone = data.phoneNumber ? `${data.phoneCode}${data.phoneNumber}` : '';
    const metadata: Record<string, string> = {
      document_id: documentId,
    };
    if (phone) metadata.phone = phone;
    if (data.rif) metadata.rif = data.rif;

    const { error: signUpError } = await signUp(
      data.email,
      data.password,
      fullName,
      data.tenantName,
      metadata
    );

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
      setSuccessEmail(data.email);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
        <Card className="max-w-md w-full border-border/50 shadow-sm animate-slide-in">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 text-success mx-auto mb-2">
              <UtensilsCrossed size={28} />
            </div>
            <CardTitle className="text-xl">¡Registro exitoso!</CardTitle>
            <CardDescription>
              Hemos enviado un enlace de confirmación a <strong>{successEmail}</strong>.
              Revisa tu bandeja de entrada para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')} className="mt-2">
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4 py-8">
      <div className="w-full max-w-lg animate-slide-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
            <UtensilsCrossed size={32} />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Crear Cuenta</h1>
          <p className="text-muted-foreground mt-1">Comienza tu prueba gratuita</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display">Registro</CardTitle>
            <CardDescription>Crea tu restaurante en PedidoClaro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Section: Datos del dueño */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Datos del dueño
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documento de Identidad */}
              <div>
                <Label>Documento de Identidad</Label>
                <div className="grid grid-cols-[120px_1fr] gap-2 mt-1.5">
                  <Select
                    value={docType}
                    onValueChange={(v) => setValue('docType', v as 'V' | 'E' | 'P')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="V">V-</SelectItem>
                      <SelectItem value="E">E-</SelectItem>
                      <SelectItem value="P">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={docType === 'P' ? 'AB123456' : '12345678'}
                    {...register('docNumber')}
                  />
                </div>
                {errors.docType && (
                  <p className="text-xs text-destructive mt-1">{errors.docType.message}</p>
                )}
                {errors.docNumber && (
                  <p className="text-xs text-destructive mt-1">{errors.docNumber.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Teléfono (opcional)</Label>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <Select
                    value={phoneCode}
                    onValueChange={(v) => setValue('phoneCode', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Código" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>
                          {cc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneNumber"
                    placeholder="4121234567"
                    {...register('phoneNumber')}
                  />
                </div>
                {errors.phoneCode && (
                  <p className="text-xs text-destructive mt-1">{errors.phoneCode.message}</p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Section: Datos de la empresa */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Datos de la empresa
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="tenantName">Nombre del restaurante</Label>
                    <Input
                      id="tenantName"
                      placeholder="Ej: Pancho Burger"
                      {...register('tenantName')}
                    />
                    {errors.tenantName && (
                      <p className="text-xs text-destructive">{errors.tenantName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rif">RIF</Label>
                    <Input
                      id="rif"
                      placeholder="J-12345678-9"
                      {...register('rif')}
                    />
                    {errors.rif && (
                      <p className="text-xs text-destructive">{errors.rif.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Section: Credenciales */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Credenciales
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite la contraseña"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Iniciar Sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
