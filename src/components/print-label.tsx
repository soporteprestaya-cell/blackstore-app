'use client';

import type { Order } from '@/lib/types';
import { formatRD } from '@/lib/utils';
import { printThermalLabel, isPrinterConnected } from '@/lib/thermal-printer';

export async function printLabel(order: Order): Promise<void> {
  const result = await printThermalLabel(order);

  if (result.success) return;

  if (!result.success && result.fallback) {
    printLabelBrowser(order);
    return;
  }

  if (!result.success && !result.fallback) return;
}

function printLabelBrowser(order: Order) {
  const destination = order.delivery_method === 'bus_route' && order.bus_route
    ? `${order.bus_route.route || order.bus_route.terminal}${order.bus_route.company ? ` (${order.bus_route.company})` : ''}`
    : order.delivery_method === 'shipping_company' && order.shipping_company
    ? `${order.shipping_company.destination} (${order.shipping_company.company})`
    : order.customer?.sector || '';

  const mapsLink = order.location_url || order.customer?.location_url || '';

  const w = window.open('', '_blank', 'width=420,height=500');
  if (!w) return;

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Etiqueta</title>
<style>
  @page { margin: 0; size: 58mm auto; }
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
    padding: 6px 10px;
  }
  .brand {
    text-align: center;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 3px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #ccc;
  }
  .info {
    font-size: 13px;
    line-height: 1.6;
  }
  .info .name {
    font-size: 15px;
    font-weight: 800;
  }
  .info .phone {
    font-weight: 600;
  }
  .info .dest {
    font-weight: 600;
  }
  .info .maps {
    font-size: 11px;
    color: #333;
    word-break: break-all;
  }
  .info .store-phone {
    font-size: 12px;
    color: #333;
    margin-top: 4px;
  }
  .total-row {
    padding: 6px 0 4px;
    font-size: 20px;
    font-weight: 900;
    text-align: center;
    border-top: 1px solid #ccc;
    margin-top: 6px;
  }
  @media print {
    body { padding: 0; max-width: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="label">
  <div class="brand">BLACKSTORE RD</div>

  <div class="info">
    <div class="name">${order.customer?.name || '—'}</div>
    <div class="phone">${order.customer?.phone || '—'}</div>
    <div class="dest">${destination}</div>
    ${mapsLink ? `<div class="maps">${mapsLink}</div>` : ''}
    <div class="store-phone">Tienda: 8295798847</div>
  </div>

  <div class="total-row">
    ${formatRD(order.total)}
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
  ">Imprimir Etiqueta</button>
</div>

<script>
  window.onafterprint = function() { window.close(); };
</script>
</body>
</html>`);
  w.document.close();
}
