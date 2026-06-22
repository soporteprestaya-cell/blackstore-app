'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchAllData, subscribeToChanges, syncAddTeamMember, syncAddOrder, syncAddCommissionPayment, syncAddNotification, syncSetDeliveryOnline } from '@/lib/supabase-sync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_USERS } from '@/lib/demo-data';
import type { Notification as AppNotification } from '@/lib/types';

const POLL_INTERVAL = 8000;

function showSystemNotification(n: AppNotification) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const isUrgent = n.message.includes('URGENTE');
  const title = isUrgent ? 'BlackStore RD — URGENTE' : 'BlackStore RD';

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body: n.message,
        icon: '/icons/icon-192.jpeg',
        badge: '/icons/icon-192.jpeg',
        tag: n.id,
        data: { url: n.order_id ? `/orders/${n.order_id}` : '/' },
      } as NotificationOptions);
    });
  } else {
    new Notification(title, { body: n.message, icon: '/icons/icon-192.jpeg', tag: n.id });
  }
}

function checkNewNotifications(
  incoming: AppNotification[],
  existing: AppNotification[],
  userId: string | undefined,
  userRole: string | undefined,
) {
  if (!userId) return;
  const existingIds = new Set(existing.map((n) => n.id));
  const newOnes = incoming.filter((n) => !existingIds.has(n.id) && !n.read);

  for (const n of newOnes) {
    let isForMe = false;
    if (!n.user_id) {
      isForMe = true;
    } else if (userRole === 'admin' && (n.user_id === 'admin' || n.user_id === '1' || n.user_id === userId)) {
      isForMe = true;
    } else if (n.user_id === userId) {
      isForMe = true;
    }
    if (isForMe) showSystemNotification(n);
  }
}

async function doSync() {
  try {
    const data = await fetchAllData();
    if (!data) return;

    const current = useAppStore.getState();

    checkNewNotifications(
      data.notifications,
      current.notifications,
      current.user?.id,
      current.user?.role,
    );

    useAppStore.setState({
      teamMembers: data.teamMembers.length > 0 ? data.teamMembers : current.teamMembers,
      orders: data.orders.length > 0 ? data.orders : current.orders,
      commissionPayments: data.commissionPayments,
      paidOrderIds: data.paidOrderIds,
      notifications: data.notifications,
      deliveryOnline: data.deliveryOnline,
    });
  } catch (e) {
    console.error('Sync error:', e);
  }
}

export default function SupabaseSync() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    async function initialSync() {
      // Always seed DEMO_USERS into Supabase (required for foreign keys)
      for (const u of DEMO_USERS) await syncAddTeamMember(u);

      const data = await fetchAllData();
      if (!data) return;

      const local = useAppStore.getState();

      // Sync local orders to Supabase if DB is empty but local has data
      if (data.orders.length === 0 && local.orders.length > 0) {
        for (const o of local.orders) await syncAddOrder(o);
      }
      if (data.notifications.length === 0 && local.notifications.length > 0) {
        for (const n of local.notifications) await syncAddNotification(n);
      }
      if (data.commissionPayments.length === 0 && local.commissionPayments.length > 0) {
        for (const p of local.commissionPayments) await syncAddCommissionPayment(p);
      }

      // Re-fetch after seeding to get complete data
      const fresh = await fetchAllData();
      if (!fresh) return;

      useAppStore.setState({
        teamMembers: fresh.teamMembers.length > 0 ? fresh.teamMembers : local.teamMembers,
        orders: fresh.orders.length > 0 ? fresh.orders : local.orders,
        commissionPayments: fresh.commissionPayments.length > 0 ? fresh.commissionPayments : local.commissionPayments,
        paidOrderIds: fresh.paidOrderIds.length > 0 ? fresh.paidOrderIds : local.paidOrderIds,
        notifications: fresh.notifications.length > 0 ? fresh.notifications : local.notifications,
        deliveryOnline: Object.keys(fresh.deliveryOnline).length > 0 ? fresh.deliveryOnline : local.deliveryOnline,
      });
    }

    if (!initialized.current) {
      initialized.current = true;
      initialSync();
    }

    // Realtime subscription
    let debounceTimer: ReturnType<typeof setTimeout>;
    const unsubscribe = subscribeToChanges(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSync, 400);
    });

    // Polling fallback — ensures sync even if realtime fails
    const pollInterval = setInterval(doSync, POLL_INTERVAL);

    // Sync when tab becomes visible again
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        doSync();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      clearTimeout(debounceTimer);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return null;
}
