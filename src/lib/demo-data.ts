import type { Order, User, Customer, DashboardStats } from './types';

export const DEMO_USERS: User[] = [
  {
    id: '0',
    name: 'Julio Leyba',
    phone: '809-350-3326',
    pin: '0323',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01',
  },
  {
    id: '1',
    name: 'José Sánchez',
    phone: '809-751-7628',
    pin: '1234',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    name: 'Emely',
    phone: '849-265-2705',
    pin: '1234',
    role: 'employee',
    is_active: true,
    created_at: '2024-01-15',
  },
  {
    id: '3',
    name: 'Victor Charlie',
    phone: '809-646-8420',
    pin: '1234',
    role: 'delivery',
    is_active: true,
    created_at: '2024-02-01',
  },
  {
    id: '4',
    name: 'Argeni Castillo',
    phone: '849-274-2105',
    pin: '1234',
    role: 'delivery',
    is_active: true,
    created_at: '2024-02-15',
  },
  {
    id: '5',
    name: 'Wilo Iglesia',
    phone: '829-792-8041',
    pin: '1234',
    role: 'delivery',
    is_active: true,
    created_at: '2024-03-01',
  },
  {
    id: '6',
    name: 'Victor de la Rosa',
    phone: '849-886-2090',
    pin: '1234',
    role: 'delivery',
    is_active: true,
    created_at: '2024-03-15',
  },
];

export const DEMO_CUSTOMERS: Customer[] = [];

export const DEMO_ORDERS: Order[] = [];

export const DEMO_STATS: DashboardStats = {
  orders_today: 0,
  orders_pending: 0,
  orders_in_transit: 0,
  orders_delivered: 0,
  revenue_today: 0,
  payments_pending: 0,
  active_deliveries: 0,
};
