# 📁 docs — Documentación del Proyecto

Este directorio contiene toda la documentación técnica, decisiones de diseño y capturas de pantalla del proyecto **Pancho Burger POS**.

## Estructura

```
docs/
├── README.md                        ← Este archivo
│
├── architecture/                    ← Documentos de arquitectura y diseño técnico
│   └── arquitectura_sistema.md      ← Arquitectura general, modelo de datos, flujo UX
│
└── screenshots/                     ← Capturas de pantalla por fecha/sesión
    └── YYYY-MM-DD_descripcion/      ← Una carpeta por sesión de revisión
        ├── dashboard.png
        ├── menu.png
        ├── caja.png
        ├── nuevo_pedido.png
        ├── pedidos.png
        └── resumen.png
```

## Convenciones

| Carpeta | Qué guardar |
|---------|-------------|
| `architecture/` | Documentos `.md` de arquitectura, decisiones técnicas, modelos de datos |
| `screenshots/YYYY-MM-DD_nombre/` | Capturas organizadas por fecha y contexto de la sesión |

## Historial de sesiones

| Fecha | Sesión | Descripción |
|-------|--------|-------------|
| 2026-04-02 | `initial-review` | Primera revisión visual de todos los módulos del POS |
