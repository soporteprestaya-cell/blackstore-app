'use client';

import type { Order } from '@/lib/types';
import { formatRD } from '@/lib/utils';
import { printThermalLabel, isPrinterConnected, disconnectPrinter } from '@/lib/thermal-printer';

export async function printLabel(order: Order): Promise<void> {
  if (!('bluetooth' in navigator)) {
    printLabelBrowser(order);
    return;
  }

  const choice = await showPrintDialog(isPrinterConnected());
  if (choice === 'cancel') return;

  if (choice === 'cable') {
    printLabelBrowser(order);
    return;
  }

  const result = await printThermalLabel(order);
  if (result.success) return;

  if (!result.success && result.fallback) {
    const retry = await showErrorDialog(result.error);
    if (retry === 'cable') {
      printLabelBrowser(order);
    } else if (retry === 'bluetooth') {
      disconnectPrinter();
      const retryResult = await printThermalLabel(order);
      if (!retryResult.success && retryResult.fallback) {
        printLabelBrowser(order);
      }
    }
  }
}

function showPrintDialog(btConnected: boolean): Promise<'bluetooth' | 'cable' | 'cancel'> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';

    const btLabel = btConnected ? 'Bluetooth (conectada)' : 'Bluetooth';
    const btIcon = '📡';

    overlay.innerHTML = `
      <div style="background:#1a1a2e;border-radius:20px;padding:24px;width:100%;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:15px;font-weight:800;color:#fff;">Imprimir Etiqueta</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">Selecciona el metodo de conexion</div>
        </div>
        <button id="pd-bt" style="width:100%;padding:14px;background:#3b82f6;color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;">
          ${btIcon} ${btLabel}
        </button>
        <button id="pd-cable" style="width:100%;padding:14px;background:#27272a;color:#fff;border:1px solid #3f3f46;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;">
          🖨️ Cable / Navegador
        </button>
        <button id="pd-cancel" style="width:100%;padding:10px;background:transparent;color:#888;border:none;font-size:12px;cursor:pointer;">
          Cancelar
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#pd-bt')!.addEventListener('click', () => { document.body.removeChild(overlay); resolve('bluetooth'); });
    overlay.querySelector('#pd-cable')!.addEventListener('click', () => { document.body.removeChild(overlay); resolve('cable'); });
    overlay.querySelector('#pd-cancel')!.addEventListener('click', () => { document.body.removeChild(overlay); resolve('cancel'); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { document.body.removeChild(overlay); resolve('cancel'); } });
  });
}

function showErrorDialog(error: string): Promise<'bluetooth' | 'cable' | 'cancel'> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';

    overlay.innerHTML = `
      <div style="background:#1a1a2e;border-radius:20px;padding:24px;width:100%;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:14px;font-weight:800;color:#ef4444;">Error de Bluetooth</div>
          <div style="font-size:11px;color:#888;margin-top:6px;">${error}</div>
        </div>
        <button id="ed-retry" style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;">
          Reintentar Bluetooth
        </button>
        <button id="ed-cable" style="width:100%;padding:12px;background:#27272a;color:#fff;border:1px solid #3f3f46;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;">
          Imprimir por Cable
        </button>
        <button id="ed-cancel" style="width:100%;padding:8px;background:transparent;color:#888;border:none;font-size:12px;cursor:pointer;">
          Cancelar
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#ed-retry')!.addEventListener('click', () => { document.body.removeChild(overlay); resolve('bluetooth'); });
    overlay.querySelector('#ed-cable')!.addEventListener('click', () => { document.body.removeChild(overlay); resolve('cable'); });
    overlay.querySelector('#ed-cancel')!.addEventListener('click', () => { document.body.removeChild(overlay); resolve('cancel'); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { document.body.removeChild(overlay); resolve('cancel'); } });
  });
}

function printLabelBrowser(order: Order) {
  const destination = order.delivery_method === 'bus_route' && order.bus_route
    ? `${order.bus_route.route || order.bus_route.terminal}${order.bus_route.company ? ` (${order.bus_route.company})` : ''}`
    : order.delivery_method === 'shipping_company' && order.shipping_company
    ? `${order.shipping_company.destination} (${order.shipping_company.company})`
    : order.customer?.sector || '';

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
    line-height: 1.8;
    text-align: center;
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
    <div class="store-phone">Tienda: 8295798847</div>
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
