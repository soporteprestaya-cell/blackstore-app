'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, getLastLocalWrite } from '@/lib/store';
import { fetchAllData, subscribeToChanges, syncAddTeamMember, syncAddOrder, syncAddCommissionPayment, syncAddNotification } from '@/lib/supabase-sync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_USERS } from '@/lib/demo-data';
import { subscribeToPush, revalidatePushSubscription } from '@/lib/push-notifications';
import type { Notification as AppNotification } from '@/lib/types';

const POLL_INTERVAL = 5000;
const WRITE_COOLDOWN = 3000;
const PUSH_REVALIDATION_INTERVAL = 15 * 60 * 1000;

function playUrgentSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'square';
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'square';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.frequency.value = 1320;
        osc3.type = 'square';
        gain3.gain.value = 0.3;
        osc3.start();
        osc3.stop(ctx.currentTime + 0.25);
      }, 200);
    }, 200);
  } catch { /* audio not available */ }
}

function showSystemNotification(n: AppNotification) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const isUrgent = n.message.includes('URGENTE');
  if (isUrgent) playUrgentSound();
  const title = isUrgent ? 'BlackStore RD — URGENTE' : 'BlackStore RD';

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body: n.message,
        icon: '/icons/icon-192.jpeg',
        badge: '/icons/icon-192.jpeg',
        tag: n.id,
        renotify: true,
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
  if (Date.now() - getLastLocalWrite() < WRITE_COOLDOWN) return;

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
      for (const u of DEMO_USERS) await syncAddTeamMember(u);

      const data = await fetchAllData();
      if (!data) return;

      const local = useAppStore.getState();

      if (data.orders.length === 0 && local.orders.length > 0) {
        for (const o of local.orders) await syncAddOrder(o);
      }
      if (data.notifications.length === 0 && local.notifications.length > 0) {
        for (const n of local.notifications) await syncAddNotification(n);
      }
      if (data.commissionPayments.length === 0 && local.commissionPayments.length > 0) {
        for (const p of local.commissionPayments) await syncAddCommissionPayment(p);
      }

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
      initialSync().then(() => {
        const currentUser = useAppStore.getState().user;
        if (currentUser?.id) {
          subscribeToPush(currentUser.id);
        }
      });
    }

    // Realtime subscription with automatic reconnection
    let debounceTimer: ReturnType<typeof setTimeout>;
    let unsubscribe = subscribeToChanges(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSync, 100);
    });

    // Polling fallback
    const pollInterval = setInterval(doSync, POLL_INTERVAL);

    // Re-validate push subscription periodically
    const pushRevalidationInterval = setInterval(() => {
      const currentUser = useAppStore.getState().user;
      if (currentUser?.id) {
        revalidatePushSubscription(currentUser.id);
      }
    }, PUSH_REVALIDATION_INTERVAL);

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        doSync();
        const currentUser = useAppStore.getState().user;
        if (currentUser?.id) {
          revalidatePushSubscription(currentUser.id);
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    // Reconnect realtime on network recovery
    function handleOnline() {
      unsubscribe();
      unsubscribe = subscribeToChanges(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doSync, 150);
      });
      doSync();
      const currentUser = useAppStore.getState().user;
      if (currentUser?.id) {
        revalidatePushSubscription(currentUser.id);
      }
    }
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      clearTimeout(debounceTimer);
      clearInterval(pollInterval);
      clearInterval(pushRevalidationInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
