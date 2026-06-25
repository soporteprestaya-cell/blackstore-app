@AGENTS.md

# BlackStore RD

PWA de gestión de pedidos y delivery para tienda de ropa (Santo Domingo, RD).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- Supabase (PostgreSQL + Realtime) — no Firebase
- Web Push API (VAPID) + Service Worker (`public/sw.js`)
- Zustand (state) + localStorage (persist) + BroadcastChannel (cross-tab)
- Impresión: Bluetooth ESC/POS + browser fallback

## Estructura clave
```
src/
  app/(dashboard)/     → Admin + Empleado (orders, deliveries, reports, settings)
  app/(delivery)/      → Delivery (my-orders, earnings, my-settings)
  app/api/             → push-send, push-subscribe, webhook/notification
  components/          → UI components, print-label, order-card, SupabaseSync
  lib/                 → store (Zustand), supabase-sync, push-notifications, types, utils
public/
  sw.js                → Service Worker (push, cache)
  manifest.json        → PWA manifest
supabase-schema.sql    → Schema principal de Supabase
```

## Métodos de envío
- **Delivery personal** — delivery recoge y entrega
- **Ruta de guagua** — transporte por líneas de bus interurbano
- **Compañía de envío** — Caribe Pack, Metro Paq, Vimenpaq, u otra manual

## Roles
- **admin** (José, id='1') — gestión completa
- **employee** (id='2') — gestión de órdenes en tienda
- **delivery** — recoge, entrega, cobra

## Reglas
- Teléfono tienda: 8295798847
- Idioma: español dominicano
- Etiquetas: sin bordes, sin número de orden, sin dirección/sector — solo nombre, teléfono, destino, link maps, teléfono tienda
- Campos de producto NO son obligatorios al crear orden
- No usar emojis en código
