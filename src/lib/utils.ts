import { OrderStatus, PaymentStatus } from './types';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatRD(amount: number) {
  return `RD$ ${amount.toLocaleString('es-DO')}`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function generateOrderNumber() {
  const d = new Date();
  const seq = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0');
  return `BS-${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, '0')}${seq}`;
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  new: { label: 'Nueva', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  preparing: { label: 'Preparando', color: 'text-bs-orange', bg: 'bg-orange-500/15' },
  ready: { label: 'Lista', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  assigned: { label: 'Asignada', color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  picked_up: { label: 'Recogida', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  in_transit: { label: 'En camino', color: 'text-bs-accent', bg: 'bg-blue-600/15' },
  delivered: { label: 'Entregada', color: 'text-bs-green', bg: 'bg-green-500/15' },
  completed: { label: 'Completada', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  cancelled: { label: 'Cancelada', color: 'text-bs-red', bg: 'bg-red-500/15' },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pendiente', color: 'text-bs-orange', bg: 'bg-orange-500/15' },
  delivery_confirmed: { label: 'Delivery confirmó', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  store_confirmed: { label: 'Tienda confirmó', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  verified: { label: 'Verificado', color: 'text-bs-green', bg: 'bg-green-500/15' },
};

export const SECTORS = [
  'Ensanche Naco', 'Piantini', 'Los Prados', 'Gazcue', 'Zona Colonial',
  'Bella Vista', 'Evaristo Morales', 'Serrallés', 'Paraíso', 'El Vergel',
  'Alma Rosa', 'Los Mina', 'Villa Mella', 'Santo Domingo Este', 'Santo Domingo Norte',
  'Santiago', 'La Vega', 'San Cristóbal', 'Otro',
];
