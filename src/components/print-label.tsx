'use client';

import type { Order } from '@/lib/types';
import { formatRD } from '@/lib/utils';

export function printLabel(order: Order) {
  const destination = order.delivery_method === 'bus_route' && order.bus_route
    ? `${order.bus_route.route || order.bus_route.terminal}${order.bus_route.company ? ` (${order.bus_route.company})` : ''}`
    : order.customer?.address || '';

  const sector = order.customer?.sector || '';

  const w = window.open('', '_blank', 'width=420,height=500');
  if (!w) return;

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Etiqueta #${order.order_number}</title>
<style>
  @page { margin: 0; size: auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Arial', 'Helvetica', sans-serif;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    padding: 8px;
    color: #000;
    background: #fff;
  }
  .label {
    border: 2px solid #000;
    border-radius: 6px;
    padding: 10px;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  .header .order-num {
    font-size: 20px;
    font-weight: 900;
    margin-top: 2px;
  }
  .row {
    display: flex;
    align-items: flex-start;
    padding: 5px 0;
    border-bottom: 1px dashed #ccc;
    font-size: 13px;
    line-height: 1.3;
  }
  .row:last-child { border-bottom: none; }
  .row .icon {
    width: 22px;
    font-size: 14px;
    flex-shrink: 0;
    text-align: center;
  }
  .row .lbl {
    font-weight: 700;
    min-width: 65px;
    flex-shrink: 0;
  }
  .row .val {
    flex: 1;
    word-break: break-word;
  }
  .total-row {
    padding: 8px 0 4px;
    font-size: 20px;
    font-weight: 900;
    text-align: center;
    border-top: 2px solid #000;
    margin-top: 6px;
  }
  .footer {
    text-align: center;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid #eee;
  }
  .footer img {
    height: 28px;
    opacity: 0.7;
  }
  .footer .brand {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #333;
  }
  @media print {
    body { padding: 0; max-width: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="label">
  <div class="header">
    <div class="order-num">#${order.order_number}</div>
  </div>

  <div class="row">
    <span class="icon">👤</span>
    <span class="lbl">Cliente:</span>
    <span class="val">${order.customer?.name || '—'}</span>
  </div>

  <div class="row">
    <span class="icon">📞</span>
    <span class="lbl">Tel:</span>
    <span class="val">${order.customer?.phone || '—'}</span>
  </div>

  <div class="row">
    <span class="icon">📍</span>
    <span class="lbl">Destino:</span>
    <span class="val">${destination}${sector ? ` — ${sector}` : ''}</span>
  </div>

  ${order.delivery_method === 'bus_route' && order.bus_route ? `
  <div class="row">
    <span class="icon">🚌</span>
    <span class="lbl">Guagua:</span>
    <span class="val">${order.bus_route.company}${order.bus_route.notes ? ` — ${order.bus_route.notes}` : ''}</span>
  </div>
  ` : ''}

  <div class="total-row">
    ${formatRD(order.total)}
  </div>

  <div class="footer">
    <span class="brand">BLACKSTORE RD</span>
  </div>
</div>

<div class="no-print" style="text-align:center;margin-top:16px;">
  <button onclick="window.print()" style="
    padding: 12px 32px;
    font-size: 16px;
    font-weight: 700;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  ">🖨️ Imprimir Etiqueta</button>
</div>

<script>
  window.onafterprint = function() { window.close(); };
</script>
</body>
</html>`);
  w.document.close();
}
