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
    const { userId, title, body, url, broadcast } = await req.json();
    if (!body) {
      return NextResponse.json({ error: 'Missing body' }, { status: 400 });
    }

    let query = supabase.from('push_subscriptions').select('*');
    if (!broadcast && userId) {
      query = query.or(`user_id.eq.${userId},user_id.eq.1`);
    }

    const { data: subs, error: queryError } = await query;
    if (queryError) {
      console.error('Push query error:', queryError.message);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const seen = new Set<string>();
    const uniqueSubs = subs.filter((sub) => {
      if (seen.has(sub.endpoint)) return false;
      seen.add(sub.endpoint);
      return true;
    });

    const payload = JSON.stringify({
      title: title || 'BlackStore RD',
      body,
      url: url || '/',
    });

    let sent = 0;
    const stale: string[] = [];

    await Promise.allSettled(
      uniqueSubs.map(async (sub) => {
        try {
          await wp.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            },
            payload,
          );
          sent++;
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.endpoint);
          } else {
            console.error('Push delivery error:', err.statusCode, err.body);
          }
        }
      }),
    );

    if (stale.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', stale);
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    console.error('push-send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
