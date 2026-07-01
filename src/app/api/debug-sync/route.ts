import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured', url: !!url, key: !!key });
  }

  const supabase = createClient(url, key);
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'create-test-order') {
    const testId = 'ord_test_' + Date.now();
    const now = new Date().toISOString();

    const orderRow = {
      id: testId,
      order_number: 'TEST-' + Date.now(),
      customer_name: 'Cliente Prueba',
      customer_phone: '8091234567',
      customer_address: 'Calle Test 123',
      customer_sector: 'Ensanche Naco',
      type: 'standard',
      status: 'assigned',
      subtotal: 500,
      delivery_fee: 200,
      total: 700,
      payment_method: 'cash',
      payment_status: 'pending',
      source: 'store',
      priority: 'normal',
      delivery_method: 'personal',
      created_by: '1',
      assigned_delivery_id: '4',
      created_at: now,
      updated_at: now,
    };

    const { error: orderErr } = await supabase.from('orders').upsert(orderRow);

    if (orderErr) {
      return NextResponse.json({
        step: 'write_order',
        error: orderErr.message,
        details: orderErr.details,
        hint: orderErr.hint,
        code: orderErr.code,
        row: orderRow,
      });
    }

    const itemRow = {
      id: 'item_test_' + Date.now(),
      order_id: testId,
      product_name: 'Camisa Prueba',
      size: 'M',
      color: 'Negro',
      quantity: 1,
      unit_price: 500,
      is_try_fit: false,
      kept: null,
    };

    const { error: itemErr } = await supabase.from('order_items').upsert(itemRow);

    const readBack = await supabase
      .from('orders')
      .select('id, order_number, customer_name, status, assigned_delivery_id')
      .eq('id', testId);

    const allOrders = await supabase
      .from('orders')
      .select('id, order_number, customer_name, status, assigned_delivery_id');

    return NextResponse.json({
      success: true,
      test_order_id: testId,
      write_error: null,
      item_error: itemErr?.message ?? null,
      read_back: readBack.data,
      all_orders: {
        count: allOrders.data?.length ?? 0,
        data: allOrders.data,
      },
      message: 'Orden de prueba creada. Assigned to delivery id=4 (Argeni Castillo). Verifica en el telefono del delivery.',
    });
  }

  if (action === 'check') {
    const [orders, members, items] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, status, assigned_delivery_id'),
      supabase.from('team_members').select('id, name, role'),
      supabase.from('order_items').select('id, order_id, product_name'),
    ]);

    return NextResponse.json({
      orders: { count: orders.data?.length ?? 0, error: orders.error?.message, data: orders.data },
      team_members: { count: members.data?.length ?? 0, data: members.data },
      order_items: { count: items.data?.length ?? 0, data: items.data },
    });
  }

  if (action === 'cleanup') {
    await supabase.from('order_items').delete().like('id', 'item_test_%');
    await supabase.from('orders').delete().like('id', 'ord_test_%');
    const remaining = await supabase.from('orders').select('id');
    return NextResponse.json({ cleaned: true, remaining_orders: remaining.data?.length ?? 0 });
  }

  return NextResponse.json({
    usage: '?action=create-test-order | ?action=check | ?action=cleanup',
    supabase_connected: true,
    supabase_url: url.substring(0, 30) + '...',
  });
}
