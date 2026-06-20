'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Order, DashboardStats, CommissionPayment } from './types';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;
  commissionPayments: CommissionPayment[];
  addCommissionPayment: (payment: CommissionPayment) => void;
  paidOrderIds: string[];
  markOrdersCommissionPaid: (orderIds: string[]) => void;
  _hydrated: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      updateOrder: (id, updates) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),
      stats: {
        orders_today: 0,
        orders_pending: 0,
        orders_in_transit: 0,
        orders_delivered: 0,
        revenue_today: 0,
        payments_pending: 0,
        active_deliveries: 0,
      },
      setStats: (stats) => set({ stats }),
      commissionPayments: [],
      addCommissionPayment: (payment) =>
        set((s) => ({ commissionPayments: [payment, ...s.commissionPayments] })),
      paidOrderIds: [],
      markOrdersCommissionPaid: (orderIds) =>
        set((s) => ({ paidOrderIds: [...s.paidOrderIds, ...orderIds] })),
      _hydrated: false,
    }),
    {
      name: 'blackstore-storage',
      partialize: (s) => ({
        user: s.user,
        commissionPayments: s.commissionPayments,
        paidOrderIds: s.paidOrderIds,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);
