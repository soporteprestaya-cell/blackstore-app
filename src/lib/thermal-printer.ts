import type { Order } from './types';
import { formatRD } from './utils';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Common Bluetooth thermal printer service/characteristic UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];
const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
];

let cachedDevice: BluetoothDevice | null = null;
let cachedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

function encode(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

// ESC/POS command builders
const ESCPOS = {
  init: () => cmd(ESC, 0x40),
  alignCenter: () => cmd(ESC, 0x61, 1),
  alignLeft: () => cmd(ESC, 0x61, 0),
  bold: (on: boolean) => cmd(ESC, 0x45, on ? 1 : 0),
  doubleSize: (on: boolean) => cmd(GS, 0x21, on ? 0x11 : 0x00),
  underline: (on: boolean) => cmd(ESC, 0x2d, on ? 1 : 0),
  feed: (lines = 1) => cmd(ESC, 0x64, lines),
  cut: () => cmd(GS, 0x56, 0x41, 3),
  separator: (char = '-', width = 32) => encode(char.repeat(width) + '\n'),
  doubleSeparator: (char = '=', width = 32) => encode(char.repeat(width) + '\n'),
};

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : text + ' '.repeat(width - text.length);
}

function row(label: string, value: string, width = 32): string {
  const maxVal = width - label.length - 1;
  const val = value.length > maxVal ? value.substring(0, maxVal) : value;
  return label + ' '.repeat(width - label.length - val.length) + val + '\n';
}

export function buildLabelData(order: Order): Uint8Array {
  const W = 32;
  const destination = order.delivery_method === 'bus_route' && order.bus_route
    ? `${order.bus_route.route || order.bus_route.terminal} (${order.bus_route.company})`
    : order.delivery_method === 'shipping_company' && (order as any).shipping_company
    ? `${(order as any).shipping_company.destination} (${(order as any).shipping_company.company})`
    : order.customer?.sector || '';

  const mapsLink = order.location_url || order.customer?.location_url || '';

  return concat(
    ESCPOS.init(),
    ESCPOS.alignCenter(),

    ESCPOS.bold(true),
    encode('BLACKSTORE RD\n'),
    ESCPOS.bold(false),
    ESCPOS.separator('-', W),

    ESCPOS.feed(1),
    ESCPOS.bold(true),
    encode(`${order.customer?.name || '---'}\n`),
    ESCPOS.bold(false),
    encode(`${order.customer?.phone || '---'}\n`),
    encode(`${destination}\n`),
    ...(mapsLink ? [encode(`${mapsLink}\n`)] : []),
    encode('Tienda: 8295798847\n'),
    ESCPOS.feed(1),

    ESCPOS.separator('-', W),
    ESCPOS.feed(3),
    ESCPOS.cut(),
  );
}

async function findPrinterCharacteristic(server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTCharacteristic | null> {
  for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      for (const charUuid of PRINTER_CHAR_UUIDS) {
        try {
          const char = await service.getCharacteristic(charUuid);
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        } catch { /* try next */ }
      }
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          return char;
        }
      }
    } catch { /* try next service */ }
  }

  // Fallback: scan all services
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          return char;
        }
      }
    }
  } catch { /* no services found */ }

  return null;
}

async function connectPrinter(): Promise<BluetoothRemoteGATTCharacteristic> {
  if (cachedDevice?.gatt?.connected && cachedCharacteristic) {
    return cachedCharacteristic;
  }

  const filters = PRINTER_SERVICE_UUIDS.map((uuid) => ({ services: [uuid] }));

  const device = await navigator.bluetooth.requestDevice({
    filters,
    optionalServices: PRINTER_SERVICE_UUIDS,
    acceptAllDevices: false,
  }).catch(() =>
    // If known services don't match, allow user to pick any device
    navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS,
    })
  );

  if (!device) throw new Error('No se seleccionó impresora');

  device.addEventListener('gattserverdisconnected', () => {
    cachedCharacteristic = null;
  });

  const server = await device.gatt!.connect();
  const characteristic = await findPrinterCharacteristic(server);
  if (!characteristic) throw new Error('No se encontró característica de escritura en la impresora');

  cachedDevice = device;
  cachedCharacteristic = characteristic;
  return characteristic;
}

async function sendData(characteristic: BluetoothRemoteGATTCharacteristic, data: Uint8Array) {
  // BLE has a max payload per write (~512 bytes typically, some printers 20 bytes)
  const CHUNK_SIZE = 100;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValueWithResponse(chunk);
    }
    // Small delay between chunks for printer buffer
    if (i + CHUNK_SIZE < data.length) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

export type PrintResult = { success: true } | { success: false; error: string; fallback?: true };

export async function printThermalLabel(order: Order): Promise<PrintResult> {
  if (!('bluetooth' in navigator)) {
    return { success: false, error: 'Bluetooth no disponible en este navegador', fallback: true };
  }

  try {
    const characteristic = await connectPrinter();
    const data = buildLabelData(order);
    await sendData(characteristic, data);
    return { success: true };
  } catch (err: any) {
    if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
      return { success: false, error: 'Selección de impresora cancelada' };
    }
    return { success: false, error: err.message || 'Error al imprimir', fallback: true };
  }
}

export function disconnectPrinter() {
  if (cachedDevice?.gatt?.connected) {
    cachedDevice.gatt.disconnect();
  }
  cachedDevice = null;
  cachedCharacteristic = null;
}

export function isPrinterConnected(): boolean {
  return !!(cachedDevice?.gatt?.connected && cachedCharacteristic);
}
