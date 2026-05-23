import { z } from 'zod';

export const COUNTRY_CODES = [
  { code: '+58', country: 'VE', label: 'Venezuela (+58)' },
  { code: '+1', country: 'US', label: 'Estados Unidos (+1)' },
  { code: '+34', country: 'ES', label: 'España (+34)' },
  { code: '+54', country: 'AR', label: 'Argentina (+54)' },
  { code: '+57', country: 'CO', label: 'Colombia (+57)' },
  { code: '+52', country: 'MX', label: 'México (+52)' },
  { code: '+56', country: 'CL', label: 'Chile (+56)' },
  { code: '+51', country: 'PE', label: 'Perú (+51)' },
  { code: '+593', country: 'EC', label: 'Ecuador (+593)' },
] as const;

export const VENEZUELAN_BANKS = [
  'BANCO DE VENEZUELA',
  'BANCO MERCANTIL',
  'BANCO PROVINCIAL',
  'BBVA PROVINCIAL',
  'BANESCO',
  'BANCO NACIONAL DE CRÉDITO',
  'BANCO OCCIDENTAL DE DESCUENTO',
  'BANCO EXTERIOR',
  'BANCO DEL TESORO',
  'BANCO BICENTENARIO',
  'BANCO SOFITASA',
  'BANCO BANCARIBE',
  'BANCO PLAZA',
  'BANFANB',
  '100% BANCO',
  'BANCO ACTIVO',
  'BANCO AGRÍCOLA',
  'BANCO CARONÍ',
  'BANCO FONDO COMÚN',
  'BANCO GUAYANA',
  'BANCO INTERNACIONAL DE DESARROLLO',
  'BANCO J. P. MORGAN',
  'BANCO MIRANDA',
  'BANCO VENEZOLANO DE CRÉDITO',
  'BANGENTE',
  'BANPLUS',
  'DELTA BANCO',
  'BANCO DE COMERCIO EXTERIOR',
  'BANCO DEL PUEBLO SOBERANO',
  'INSTITUTO MUNICIPAL DE CRÉDITO POPULAR',
  'BANCO DE LA MUJER',
  'BANCO NACIONAL DE VIVIENDA Y HÁBITAT',
  'Otro',
] as const;

export const registerSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  tenantName: z.string().min(1, 'Nombre del restaurante requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  docType: z.enum(['V', 'E', 'P'], { required_error: 'Selecciona un tipo de documento' }),
  docNumber: z.string().min(6, 'Debe tener al menos 6 caracteres'),
  phoneCode: z.string().default('+58'),
  phoneNumber: z.string().optional().default(''),
  rif: z.string().regex(/^[JGVEP]-\d{7,9}-\d$/, 'El RIF debe tener formato: J-XXXXXXXX-X'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
