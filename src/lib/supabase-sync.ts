'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import type { Order, OrderItem, User, CommissionPayment, Notification } from './types';

// ===== DATA MAPPING =====

function orderToRow(o: Order) {
  return {
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer?.name || '',
    customer_phone: o.customer?.phone || '',
    customer_address: o.customer?.address || '',
    customer_sector: o.customer?.sector || '',
    customer_location_url: o.location_url || o.customer?.location_url || '',
    type: o.type,
    status: o.status,
    subtotal: o.subtotal,
    delivery_fee: o.delivery_fee,
    total: o.total,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    notes: o.notes || null,
    source: o.source,
    priority: o.priority,
    delivery_method: o.delivery_method,
    bus_route_company: o.bus_route?.company || null,
    bus_route_destination: o.bus_route?.route || null,
    bus_route_notes: o.bus_route?.notes || null,
    product_photos: o.product_photos || [],
    package_photo: o.package_photo || null,
    created_by: o.created_by,
    assigned_delivery_id: o.assigned_delivery_id || null,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

function rowToOrder(row: any, items: OrderItem[], members: User[]): Order {
  const delivery = row.assigned_delivery_id
    ? members.find((m) => m.id === row.assigned_delivery_id)
    : undefined;
  return {
    id: row.id,
    order_number: row.order_number,
    customer_id: row.customer_name,
    customer: {
      id: row.id,
      name: row.customer_name,
      phone: row.customer_phone || '',
      address: row.customer_address || '',
      sector: row.customer_sector || '',
      location_url: row.customer_location_url,
      is_blacklisted: false,
      order_count: 0,
      created_at: row.created_at,
    },
    type: row.type,
    status: row.status,
    items,
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    total: Number(row.total),
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    notes: row.notes,
    source: row.source || 'store',
    priority: row.priority || 'normal',
    delivery_method: row.delivery_method || 'personal',
    bus_route: row.bus_route_company
      ? { company: row.bus_route_company, route: row.bus_route_destination || '', terminal: '', notes: row.bus_route_notes }
      : undefined,
    location_url: row.customer_location_url,
    product_photos: row.product_photos || [],
    package_photo: row.package_photo,
    payment_photo: row.payment_photo,
    created_by: row.created_by,
    assigned_delivery_id: row.assigned_delivery_id,
    assigned_delivery: delivery,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function itemToRow(item: OrderItem) {
  return {
    id: item.id,
    order_id: item.order_id,
    product_name: item.product_name,
    size: item.size || null,
    color: item.color || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    is_try_fit: item.is_try_fit,
    kept: item.kept === true ? 'kept' : item.kept === false ? 'returned' : item.kept === 'received' ? 'received' : null,
  };
}

function rowToItem(row: any): OrderItem {
  return {
    id: row.id,
    order_id: row.order_id,
    product_name: row.product_name,
    size: row.size,
    color: row.color,
    quantity: row.quantity,
    unit_price: Number(row.unit_price),
    is_try_fit: row.is_try_fit,
    kept: row.kept === 'kept' ? true : row.kept === 'returned' ? false : row.kept === 'received' ? 'received' : null,
  };
}

// ===== FETCH ALL =====

export async function fetchAllData() {
  if (!isSupabaseConfigured) return null;

  const [membersRes, ordersRes, itemsRes, paymentsRes, notifRes, onlineRes] = await Promise.all([
    supabase.from('team_members').select('*').order('created_at'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('order_items').select('*'),
    supabase.from('commission_payments').select('*').order('paid_at', { ascending: false }),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('delivery_online').select('*'),
  ]);

  if (membersRes.error || ordersRes.error) {
    console.error('Supabase fetch error:', JSON.stringify(membersRes.error || ordersRes.error));
    return null;
  }

  const members: User[] = (membersRes.data || []).map((r: any) => ({
    id: r.id, name: r.name, phone: r.phone, pin: r.pin,
    role: r.role, avatar_url: r.avatar_url, is_active: r.is_active, created_at: r.created_at,
  }));

  const allItems = (itemsRes.data || []).map(rowToItem);
  const itemsByOrder: Record<string, OrderItem[]> = {};
  allItems.forEach((i) => {
    if (!itemsByOrder[i.order_id]) itemsByOrder[i.order_id] = [];
    itemsByOrder[i.order_id].push(i);
  });

  const orders = (ordersRes.data || []).map((r: any) =>
    rowToOrder(r, itemsByOrder[r.id] || [], members)
  );

  const commissionPayments: CommissionPayment[] = (paymentsRes.data || []).map((r: any) => ({
    id: r.id, delivery_user_id: r.delivery_user_id, delivery_user_name: r.delivery_user_name,
    amount: Number(r.amount), orders_paid: r.orders_paid || [], paid_at: r.paid_at,
    paid_by: r.paid_by, confirmed_by_delivery: r.confirmed_by_delivery, confirmed_at: r.confirmed_at,
  }));

  const paidOrderIds = commissionPayments.flatMap((p) => p.orders_paid);

  const notifications: Notification[] = (notifRes.data || []).map((r: any) => ({
    id: r.id, user_id: r.user_id, type: r.type, message: r.message, order_id: r.order_id,
    read: r.read, created_at: r.created_at,
  }));

  const deliveryOnline: Record<string, boolean> = {};
  (onlineRes.data || []).forEach((r: any) => {
    deliveryOnline[r.user_id] = r.is_online;
  });

  return { teamMembers: members, orders, commissionPayments, paidOrderIds, notifications, deliveryOnline };
}

// ===== WRITE OPERATIONS =====

export async function syncAddOrder(order: Order) {
  if (!isSupabaseConfigured) return;
  const row = orderToRow(order);
  const { error } = await supabase.from('orders').upsert(row);
  if (error) {
    console.error('syncAddOrder error:', error.message, error.details);
    return;
  }
  if (order.items.length > 0) {
    const { error: itemErr } = await supabase.from('order_items').upsert(order.items.map(itemToRow));
    if (itemErr) console.error('syncAddOrder items error:', itemErr.message);
  }
}

export async function syncUpdateOrder(id: string, updates: Partial<Order>) {
  if (!isSupabaseConfigured) return;
  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.payment_status !== undefined) row.payment_status = updates.payment_status;
  if (updates.assigned_delivery_id !== undefined) row.assigned_delivery_id = updates.assigned_delivery_id;
  if (updates.package_photo !== undefined) row.package_photo = updates.package_photo;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.delivery_fee !== undefined) row.delivery_fee = updates.delivery_fee;
  if (updates.total !== undefined) row.total = updates.total;
  if (updates.payment_method !== undefined) row.payment_method = updates.payment_method;
  if (updates.priority !== undefined) row.priority = updates.priority;
  const { error } = await supabase.from('orders').update(row).eq('id', id);
  if (error) console.error('syncUpdateOrder error:', error.message, error.details);
  if (updates.items) {
    const { error: itemErr } = await supabase.from('order_items').upsert(updates.items.map(itemToRow));
    if (itemErr) console.error('syncUpdateOrder items error:', itemErr.message);
  }
}

export async function syncAddTeamMember(member: User) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('team_members').upsert({
    id: member.id, name: member.name, phone: member.phone, pin: member.pin,
    role: member.role, avatar_url: member.avatar_url, is_active: member.is_active, created_at: member.created_at,
  });
  if (error) console.error('syncAddTeamMember error:', error.message);
}

export async function syncUpdateTeamMember(id: string, updates: Partial<User>) {
  if (!isSupabaseConfigured) return;
  await supabase.from('team_members').update(updates).eq('id', id);
}

export async function syncRemoveTeamMember(id: string) {
  if (!isSupabaseConfigured) return;
  await supabase.from('team_members').delete().eq('id', id);
}

export async function syncAddCommissionPayment(payment: CommissionPayment) {
  if (!isSupabaseConfigured) return;
  await supabase.from('commission_payments').upsert({
    id: payment.id, delivery_user_id: payment.delivery_user_id,
    delivery_user_name: payment.delivery_user_name, amount: payment.amount,
    orders_paid: payment.orders_paid, paid_at: payment.paid_at,
    paid_by: payment.paid_by, confirmed_by_delivery: payment.confirmed_by_delivery,
    confirmed_at: payment.confirmed_at,
  });
}

export async function syncConfirmCommissionPayment(paymentId: string) {
  if (!isSupabaseConfigured) return;
  await supabase.from('commission_payments').update({
    confirmed_by_delivery: true, confirmed_at: new Date().toISOString(),
  }).eq('id', paymentId);
}

export async function syncAddNotification(n: Notification) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('notifications').upsert({
    id: n.id, user_id: n.user_id || null, type: n.type, message: n.message, order_id: n.order_id,
    read: n.read, created_at: n.created_at,
  });
  if (error) console.error('syncAddNotification error:', error.message);
}

export async function syncMarkNotificationRead(id: string) {
  if (!isSupabaseConfigured) return;
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function syncSetDeliveryOnline(userId: string, online: boolean) {
  if (!isSupabaseConfigured) return;
  await supabase.from('delivery_online').upsert({
    user_id: userId, is_online: online, updated_at: new Date().toISOString(),
  });
}

export async function syncClearData() {
  if (!isSupabaseConfigured) return;
  await Promise.all([
    supabase.from('order_items').delete().neq('id', ''),
    supabase.from('notifications').delete().neq('id', ''),
    supabase.from('commission_payments').delete().neq('id', ''),
  ]);
  await supabase.from('orders').delete().neq('id', '');
}

// ===== REALTIME SUBSCRIPTIONS =====

export function subscribeToChanges(onUpdate: () => void) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('blackstore-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_payments' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_online' }, onUpdate)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
