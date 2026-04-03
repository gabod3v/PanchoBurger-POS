# 🍔 Pancho Burger — Arquitectura del Sistema POS

> Documento de diseño funcional y técnico para el sistema de punto de venta.  
> Generado: 2026-04-02 | Basado en el repositorio `quick-bite-ops`

---

## 1. Arquitectura General del Sistema

### Visión de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (SPA)                          │
│                                                             │
│   ┌─────────────┐    ┌──────────────────────────────────┐  │
│   │   Sidebar   │    │         Área Principal           │  │
│   │  Navegación │    │  (Páginas / Vistas)              │  │
│   │             │◄───┤                                  │  │
│   │  Dashboard  │    │  Dashboard / Menú / Caja /       │  │
│   │  Menú       │    │  Nuevo Pedido / Pedidos /        │  │
│   │  Caja       │    │  Resumen del Día                 │  │
│   │  Pedidos    │    │                                  │  │
│   │  Resumen    │    └──────────────────────────────────┘  │
│   └─────────────┘                    │                      │
│                                      ▼                      │
│              ┌────────────────────────────────┐             │
│              │      AppContext (useReducer)   │             │
│              │   Estado global de la app      │             │
│              └────────────┬───────────────────┘             │
│                           │                                 │
│              ┌────────────▼───────────────────┐             │
│              │       localStorage              │             │
│              │  Persistencia entre sesiones    │             │
│              └────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Capas de la Aplicación

| Capa | Responsabilidad | Tecnología actual |
|------|-----------------|-------------------|
| **Presentación** | UI, componentes visuales, navegación | React 18 + Tailwind + shadcn/ui |
| **Estado Global** | Gestión centralizada del estado con actions | React Context + useReducer |
| **Persistencia** | Almacenamiento local entre recargas | `localStorage` (clave: `pos-fast-food`) |
| **Tipos / Contratos** | Interfaces TypeScript compartidas | `src/types/index.ts` |
| **Enrutamiento** | Navegación entre módulos sin recargar | React Router v6 |

### Patrón Arquitectónico

La aplicación sigue el patrón **Flux unidireccional**:

```
UI (componente)  →  dispatch(Action)  →  reducer(state, action)  →  nuevo state  →  re-render
                                                                          ↓
                                                                    localStorage
```

---

## 2. Modelo de Datos

### Entidades y relaciones

```
┌──────────────┐         ┌──────────────────┐         ┌────────────────┐
│   Product    │         │     OrderItem    │         │     Order      │
│──────────────│    1    │──────────────────│   N     │────────────────│
│ id: string   │◄────────│ product: Product │────────►│ id: string     │
│ name: string │         │ quantity: number │         │ ticketNumber   │
│ price: USD   │         └──────────────────┘         │ customerName   │
└──────────────┘                                      │ items[]        │
                                                      │ totalUSD       │
                                                      │ totalLocal     │
                                                      │ status         │
                                                      │ createdAt      │
                                                      └───────┬────────┘
                                                              │ N
                                                              ▼ 1
                                                      ┌────────────────┐
                                                      │   DaySession   │
                                                      │────────────────│
                                                      │ id: string     │
                                                      │ date: string   │
                                                      │ exchangeRate   │
                                                      │ isOpen: bool   │
                                                      │ openedAt       │
                                                      │ closedAt?      │
                                                      └────────────────┘
```

### Interfaces TypeScript

```typescript
interface Product {
  id: string;
  name: string;
  price: number;       // en USD
}

interface OrderItem {
  product: Product;
  quantity: number;
}

type OrderStatus = 'pending' | 'ready' | 'completed';

interface Order {
  id: string;
  ticketNumber: number;
  customerName: string;
  items: OrderItem[];
  totalUSD: number;
  totalLocal: number;  // USD * exchangeRate
  status: OrderStatus;
  createdAt: string;   // ISO 8601
}

interface DaySession {
  id: string;
  date: string;
  exchangeRate: number; // Bs por USD
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
}

interface AppState {
  products: Product[];
  orders: Order[];
  currentDay: DaySession | null;
  nextTicket: number;
}
```

### Campos recomendados para escalar

| Entidad | Campo futuro | Propósito |
|---------|-------------|-----------|
| `Product` | `category` | Agrupar productos (hamburguesas, bebidas, etc.) |
| `Product` | `available: boolean` | Desactivar sin eliminar |
| `Order` | `paymentMethod` | Efectivo / Transferencia / Punto |
| `Order` | `note` | Observaciones especiales del cliente |
| `DaySession` | `openingCash` | Control de fondo de caja |

---

## 3. Flujo de Uso (Paso a Paso)

```
INICIO DEL DÍA
      │
      ▼
1. Abrir Caja (/caja)
   └── Ingresar tasa del día (Bs/$)
   └── Estado: currentDay.isOpen = true
   └── orders[] se resetea, nextTicket = 1
      │
      ▼
2. Configurar Menú (/menu)  ← Solo si es necesario
   └── Agregar / editar / eliminar productos
   └── Persiste entre días (no se borra al abrir caja)
      │
      ▼
3. Tomar Pedido (/nuevo-pedido)
   ├── Ingresar nombre del cliente
   ├── Seleccionar productos con +/-
   ├── Ver total USD y Bs en tiempo real
   └── Confirmar → genera ticket incremental
      │
      ▼
4. Gestionar Pedidos (/pedidos)
   ├── Marcar como "Listo"     (pending → ready)
   └── Marcar como "Completado" (ready → completed)
      │
      ▼
5. Repetir pasos 3-4 durante el día
      │
      ▼
6. Cierre del Día (/resumen)
   ├── Ver pedidos completados del día
   ├── Ver total en USD y Bs
   └── Cerrar caja → isOpen = false

FIN DEL DÍA
```

### Reglas de negocio clave

| Regla | Comportamiento |
|-------|---------------|
| **Caja cerrada** | No se puede crear pedidos sin caja abierta |
| **Menú vacío** | No se puede crear pedidos sin productos |
| **Ticket incremental** | Reinicia a 1 cada vez que se abre la caja |
| **Estado de pedido** | Flujo unidireccional: pending → ready → completed |
| **Precio en Bs** | Se calcula `totalUSD × exchangeRate` al crear el pedido |
| **Persistencia** | Todo se guarda automáticamente en `localStorage` |

---

## 4. Componentes y Módulos Principales

### Mapa de archivos

```
src/
├── types/
│   └── index.ts              ← Contratos TypeScript
│
├── contexts/
│   └── AppContext.tsx         ← Estado global + reducer + actions + localStorage
│
├── components/
│   ├── Layout.tsx             ← Shell: sidebar + área principal
│   ├── NavLink.tsx            ← Ítem de navegación activo/inactivo
│   └── ui/                   ← Biblioteca shadcn/ui (49 componentes base)
│
└── pages/
    ├── Index.tsx              ← Dashboard con stats y acciones rápidas
    ├── MenuPage.tsx           ← CRUD de productos
    ├── CashRegister.tsx       ← Abrir/Cerrar caja + tasa del día
    ├── NewOrder.tsx           ← Crear pedido con selector de productos
    ├── OrdersPage.tsx         ← Lista de pedidos + cambio de estado
    ├── DaySummary.tsx         ← Resumen del día + tabla de ventas
    └── NotFound.tsx           ← Página 404
```

### Actions del Reducer

| Action | Qué hace |
|--------|----------|
| `LOAD_STATE` | Rehidrata estado desde localStorage al cargar |
| `ADD_PRODUCT` | Crea producto con UUID |
| `UPDATE_PRODUCT` | Actualiza nombre/precio por id |
| `DELETE_PRODUCT` | Elimina producto |
| `OPEN_DAY` | Abre sesión con tasa, resetea orders y ticket |
| `CLOSE_DAY` | Marca isOpen=false, guarda closedAt |
| `ADD_ORDER` | Crea pedido calculando totales, incrementa nextTicket |
| `UPDATE_ORDER_STATUS` | Avanza estado del pedido |
| `RESET_DAY` | Limpia currentDay, orders y nextTicket |

---

## 5. Recomendaciones UX/UI

### Lo que el sistema ya hace bien
- ✔ Paleta cálida (naranja) coherente con comida rápida
- ✔ Fuentes modernas (Space Grotesk + Inter)
- ✔ Feedback visual con `sonner` (toasts)
- ✔ Estados de pedido con badges de color semántico
- ✔ Guardado automático en localStorage
- ✔ Animación de entrada en cada página

### Mejoras recomendadas (priorizadas)

| Prioridad | Mejora | Módulo |
|-----------|--------|--------|
| 🔴 Alta | Búsqueda/filtro de productos | Nuevo Pedido |
| 🔴 Alta | Confirmación antes de cerrar caja | Caja |
| 🟡 Media | Vista de pantalla de cocina (texto grande) | Pedidos |
| 🟡 Media | Badge de estado de caja en sidebar | Layout |
| 🟡 Media | Categorías de productos (tabs) | Menú / Nuevo Pedido |
| 🟢 Baja | Soporte responsive para tablet | Layout |
| 🟢 Baja | Campo `available` para productos | Menú |

---

## 6. Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React | 18.3 |
| Lenguaje | TypeScript | 5.8 |
| Build tool | Vite | 5.4 |
| Estilos | TailwindCSS | 3.4 |
| Componentes | shadcn/ui + Radix UI | — |
| Estado | React Context + useReducer | — |
| Persistencia | localStorage | — |
| Enrutamiento | React Router | 6.30 |
| Notificaciones | Sonner | 1.7 |
| Iconos | Lucide React | 0.462 |
| Testing unitario | Vitest + Testing Library | — |
| Testing E2E | Playwright | 1.57 |

### Ruta de escalabilidad

```
FASE 1 (actual)  →  localStorage (un solo dispositivo)
FASE 2           →  Supabase (PostgreSQL + Auth + Realtime)
FASE 3           →  Multi-sucursal + roles de usuario
```
