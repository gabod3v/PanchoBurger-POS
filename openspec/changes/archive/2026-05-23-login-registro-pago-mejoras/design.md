# Design: Login/Registro/Pago — UX Redesign & Fiscal Data

## Technical Approach

Cuatro cambios independientes pero que tocan los mismos archivos de auth. Se implementan como commits separados para facilitar rollback. El patrón general es: UI con Tailwind/shadcn + lógica con `react-hook-form` + zod (solo Register, login mantiene `useState`) + persistencia vía `raw_user_meta_data` → trigger DB.

---

## Architecture Decisions

### Decision: react-hook-form + zod SÓLO en RegisterPage

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| react-hook-form en Login y Register | Login tiene 2 campos, no justifica dependencia extra | Login mantiene `useState` actual |
| useState en Register | Validación cruzada (documento, RIF) se vuelve verbosa | Register migra a react-hook-form + zod |

### Decision: Datos fiscales via `raw_user_meta_data`, no tabla separada

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Tabla `datos_fiscales` separada | JOIN extra, más migraciones, sync con auth.users | Columnas directas en `perfiles` |
| Solo `raw_user_meta_data` | Datos solo en auth.users, no consultables vía SQL | `handle_new_user()` extrae y persiste en `perfiles` |

### Decision: Bank origin como `Select` + "Otro" (input libre)

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Solo input libre | Usuario debe tipear, posible inconsistencia | Select fijo + input "Otro" |
| Solo select fijo | Bancos nuevos quedan fuera | Select predefinido + opción "Otro" muestra input |

### Decision: `signUp()` recibe objeto de metadata opcional

La firma actual `signUp(email, password, fullName, tenantName)` se extiende con un 5to parámetro `metadata?: Record<string, string>`. Esto evita romper llamadas existentes.

---

## Data Flow

```
RegisterPage (react-hook-form + zod)
  │  validación cliente
  ▼
AuthContext.signUp(email, password, fullName, tenantName, { document_id, phone, rif })
  │
  ▼
supabase.auth.signUp({ email, password, options: { data: { full_name, tenant_name, document_id, phone, rif } } })
  │
  ▼
Trigger handle_new_user()  ←  raw_user_meta_data
  │  extrae: document_id, phone, rif
  │  persiste en: perfiles (nuevas columnas)
  │  mantiene: tenant + trial + ubicación existentes
  ▼
perfiles (document_id, phone, rif poblados)

SuscripcionPage → Dialog
  │  exchange_rate (de sesiones_dia)
  │  amount_bs editable (default = plan.price * exchange_rate)
  │  bank_origin (Select)
  ▼
pagos_suscripcion.insert({ amount_bs: user_input, bank_origin, ... })
```

---

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `src/pages/LoginPage.tsx` | Modificar | Layout split grid 50/50 + ilustración SVG decorativa. Misma lógica, mismo estado |
| `src/pages/RegisterPage.tsx` | Modificar | Migrar a react-hook-form + zod. +3 secciones. Campos: document_id, phone (con código país), RIF |
| `src/pages/LandingPage.tsx` | Modificar | 6x "PedidoClaro" → "PanchoPOS". Logo "PC" → "PP" |
| `src/pages/SuscripcionPage.tsx` | Modificar | Diálogo: sección "Esperado" + "Pagado" (Bs editable, banco origen, teléfono). Diferencia visual |
| `src/pages/AdminPage.tsx` | Modificar | Tabla pagos: columna banco origen, diferencia Bs pagado vs esperado. Actualizar `PaymentRow` type |
| `src/contexts/AuthContext.tsx` | Modificar | `signUp()` acepta 5to parámetro `metadata` opcional |
| `supabase/migrations/..._add_fiscal_columns.sql` | Crear | `ALTER TABLE perfiles ADD COLUMN document_id text, phone text, rif text` |
| `supabase/migrations/..._update_trigger.sql` | Crear | Actualizar `handle_new_user()` para extraer document_id, phone, rif de `raw_user_meta_data` |
| `src/components/ui/select.tsx` | Sin cambios | Ya existe. Usar para código de país y banco origen |
| `src/types/index.ts` | Modificar | Profile: +`document_id?`, `phone?`, `rif?` |

---

## Interfaces / Contracts

```typescript
// AuthContext - nueva firma
signUp: (
  email: string,
  password: string,
  fullName: string,
  tenantName: string,
  metadata?: { document_id?: string; phone?: string; rif?: string }
) => Promise<{ error: AuthError | null; user: User | null }>;

// Profile extendido
interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  document_id?: string;  // nuevo
  phone?: string;         // nuevo
  rif?: string;           // nuevo
  created_at: string;
  updated_at: string;
}

// Zod schema para registro
const registerSchema = z.object({
  fullName: z.string().min(1, "Nombre requerido"),
  tenantName: z.string().min(1, "Nombre del restaurante requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
  docType: z.enum(["V", "E", "P"]),
  docNumber: z.string().min(6),
  phoneCode: z.string().default("+58"),
  phoneNumber: z.string().min(7),
  rif: z.string().regex(/^[JGVEP]-\d{7,9}-\d$/, "Formato: J-XXXXXXXX-X"),
}).refine(d => d.password === d.confirmPassword, { message: "Contraseñas no coinciden", path: ["confirmPassword"] });

// Country codes compartidos
const COUNTRY_CODES = [
  { code: "+58", country: "VE", flag: "🇻🇪", label: "Venezuela (+58)" },
  { code: "+1", country: "US", flag: "🇺🇸", label: "Estados Unidos (+1)" },
  // ...
];

// Venezuelan banks
const VENEZUELAN_BANKS = [
  "BANCO DE VENEZUELA",
  "BANCO MERCANTIL",
  "BANCO PROVINCIAL",
  "BANCO NACIONAL DE CRÉDITO",
  "BANESCO",
  "BBVA PROVINCIAL",
  "BANCO OCCIDENTAL DE DESCUENTO",
  // ...
];
```

---

## Route Changes

Sin cambios de ruta. Todas las URLs existentes se mantienen. El redirect post-login (`/dashboard` o `/admin`) no se modifica.

---

## DB Changes

### Migración 1: `add_fiscal_columns_to_perfiles`

```sql
ALTER TABLE perfiles
  ADD COLUMN document_id text,
  ADD COLUMN phone text,
  ADD COLUMN rif text;
```

### Migración 2: `update_handle_new_user_trigger`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_name text;
  v_tenant_slug text;
  v_tenant_id uuid;
BEGIN
  v_tenant_name := COALESCE(NEW.raw_user_meta_data ->> 'tenant_name', 'Mi Restaurante');
  v_tenant_slug := lower(regexp_replace(
    regexp_replace(v_tenant_name, '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g'
  ));
  IF length(v_tenant_slug) < 3 THEN
    v_tenant_slug := v_tenant_slug || '-' || substr(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.inquilinos (name, slug, owner_id)
  VALUES (v_tenant_name, v_tenant_slug, NEW.id)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.perfiles (id, tenant_id, full_name, role, document_id, phone, rif)
  VALUES (
    NEW.id,
    v_tenant_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    'owner',
    NEW.raw_user_meta_data ->> 'document_id',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'rif'
  );

  INSERT INTO public.suscripciones (tenant_id, plan, status, expires_at)
  VALUES (v_tenant_id, 'professional', 'trial', NOW() + INTERVAL '30 days');

  INSERT INTO public.ubicaciones (tenant_id, name, address)
  VALUES (v_tenant_id, 'Sucursal Principal', 'Por definir');

  RETURN NEW;
END;
$$;
```

No se requiere migración en `pagos_suscripcion` — `bank_origin` y `amount_bs` ya existen.

---

## Testing Strategy

| Capa | Qué probar | Cómo |
|------|------------|------|
| Unit | Zod schema registro (campos requeridos, formato RIF, documento) | Tests directos de `registerSchema.parse()` con casos válidos/inválidos |
| Unit | `signUp()` con metadata | Mock `supabase.auth.signUp()`, verificar que pasa `options.data` correcto |
| Integration | Trigger `handle_new_user()` | Insert en `auth.users` con `raw_user_meta_data` y verificar `perfiles` poblado |
| Visual | Login split layout, responsive | Test de componente con viewport resize |
| E2E | Flujo completo registro → login → pago | Playwright/Cypress |

---

## Migration / Rollout

Por commit atómico por feature. Orden sugerido:
1. Rebranding LandingPage (sin riesgo)
2. DB migrations (columnas + trigger)
3. AuthContext + RegisterPage (campos fiscales)
4. LoginPage split layout
5. SuscripcionPage + AdminPage (pago mejorado)

Rollback: `git revert <commit>` por feature. DB: `ALTER TABLE perfiles DROP COLUMN` si se requiere revertir schema.

---

## Open Questions

- [ ] ¿La ilustración SVG del login la incluimos inline o como asset importado? Recomiendo inline para evitar request extra.
- [ ] ¿El selector de banco origen debe persistir una opción "Otro" con input? Sí, como fallback para bancos no listados.
