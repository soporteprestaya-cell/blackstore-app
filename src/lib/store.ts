'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Order, CommissionPayment, Notification } from './types';
import {
  syncAddOrder, syncUpdateOrder, syncAddTeamMember, syncUpdateTeamMember,
  syncRemoveTeamMember, syncAddCommissionPayment, syncConfirmCommissionPayment,
  syncAddNotification, syncMarkNotificationRead, syncSetDeliveryOnline, syncClearData,
} from './supabase-sync';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  commissionPayments: CommissionPayment[];
  addCommissionPayment: (payment: CommissionPayment) => void;
  confirmCommissionPayment: (paymentId: string) => void;
  paidOrderIds: string[];
  markOrdersCommissionPaid: (orderIds: string[]) => void;
  teamMembers: User[];
  setTeamMembers: (members: User[]) => void;
  addTeamMember: (member: User) => void;
  updateTeamMember: (id: string, updates: Partial<User>) => void;
  removeTeamMember: (id: string) => void;
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  deliveryOnline: Record<string, boolean>;
  setDeliveryOnline: (userId: string, online: boolean) => void;
  _hydrated: boolean;
}

const channel = typeof window !== 'undefined' ? new BroadcastChannel('blackstore-sync') : null;
let isSyncUpdate = false;

// Tracks last local write to prevent polling from overwriting fresh changes
let _lastLocalWrite = 0;
export function getLastLocalWrite() { return _lastLocalWrite; }
function markLocalWrite() { _lastLocalWrite = Date.now(); }

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => {
        markLocalWrite();
        set((s) => ({ orders: [order, ...s.orders] }));
        syncAddOrder(order);
      },
      updateOrder: (id, updates) => {
        markLocalWrite();
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
        syncUpdateOrder(id, updates);
      },
      commissionPayments: [],
      addCommissionPayment: (payment) => {
        markLocalWrite();
        set((s) => ({ commissionPayments: [payment, ...s.commissionPayments] }));
        syncAddCommissionPayment(payment);
      },
      confirmCommissionPayment: (paymentId) => {
        markLocalWrite();
        set((s) => ({
          commissionPayments: s.commissionPayments.map((p) =>
            p.id === paymentId ? { ...p, confirmed_by_delivery: true, confirmed_at: new Date().toISOString() } : p
          ),
        }));
        syncConfirmCommissionPayment(paymentId);
      },
      paidOrderIds: [],
      markOrdersCommissionPaid: (orderIds) =>
        set((s) => ({ paidOrderIds: [...s.paidOrderIds, ...orderIds] })),
      teamMembers: [],
      setTeamMembers: (members) => set({ teamMembers: members }),
      addTeamMember: (member) => {
        set((s) => ({ teamMembers: [...s.teamMembers, member] }));
        syncAddTeamMember(member);
      },
      updateTeamMember: (id, updates) => {
        set((s) => ({
          teamMembers: s.teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
        syncUpdateTeamMember(id, updates);
      },
      removeTeamMember: (id) => {
        set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) }));
        syncRemoveTeamMember(id);
      },
      notifications: [],
      addNotification: (n) => {
        set((s) => ({ notifications: [n, ...s.notifications].slice(0, 50) }));
        syncAddNotification(n);
      },
      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
        syncMarkNotificationRead(id);
      },
      clearNotifications: () => set({ notifications: [] }),
      deliveryOnline: {},
      setDeliveryOnline: (userId, online) => {
        set((s) => ({ deliveryOnline: { ...s.deliveryOnline, [userId]: online } }));
        syncSetDeliveryOnline(userId, online);
      },
      _hydrated: false,
    }),
    {
      name: 'blackstore-storage',
      partialize: (s) => ({
        user: s.user,
        orders: s.orders,
        commissionPayments: s.commissionPayments,
        paidOrderIds: s.paidOrderIds,
        teamMembers: s.teamMembers,
        notifications: s.notifications,
        deliveryOnline: s.deliveryOnline,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);

if (typeof window !== 'undefined') {
  useAppStore.subscribe((state) => {
    if (isSyncUpdate) return;
    channel?.postMessage({
      type: 'STATE_SYNC',
      state: {
        orders: state.orders,
        commissionPayments: state.commissionPayments,
        paidOrderIds: state.paidOrderIds,
        teamMembers: state.teamMembers,
        notifications: state.notifications,
        deliveryOnline: state.deliveryOnline,
      },
    });
  });

  channel?.addEventListener('message', (e) => {
    if (e.data?.type === 'STATE_SYNC') {
      isSyncUpdate = true;
      useAppStore.setState(e.data.state);
      isSyncUpdate = false;
    }
  });
}
