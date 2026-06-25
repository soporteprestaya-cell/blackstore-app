import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

function getWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const priv = process.env.VAPID_PRIVATE_KEY || '';
  if (pub && priv) {
    webpush.setVapidDetails('mailto:soporteprestaya@gmail.com', pub, priv);
  }
  return webpush;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  );
}

export async function POST(req: NextRequest) {
  try {
    const wp = getWebPush();
    const supabase = getSupabase();
    const webhookSecret = process.env.WEBHOOK_SECRET || '';
    if (webhookSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = await req.json();
    const record = payload.record || payload;

    if (!record.message) {
      return NextResponse.json({ error: 'No notification data' }, { status: 400 });
    }

    const targetUserId = record.user_id;
    const isUrgent = (record.message || '').includes('URGENTE');
    const title = isUrgent ? 'BlackStore RD — URGENTE' : 'BlackStore RD';
    const url = record.order_id ? `/orders/${record.order_id}` : '/';

    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserId) {
      query = query.or(`user_id.eq.${targetUserId},user_id.eq.1`);
    }

    const { data: subs } = await query;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'no_subscriptions' });
    }

    const pushPayload = JSON.stringify({ title, body: record.message, url });

    let sent = 0;
    const stale: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await wp.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
            pushPayload,
          );
          sent++;
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.endpoint);
          }
        }
      }),
    );

    if (stale.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', stale);
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
