'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { SECTORS, formatRD } from '@/lib/utils';
import {
  Store, DollarSign, MapPin, Bell, Shield, Users, Palette,
  Save, ChevronRight, Smartphone, Globe,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAppStore();
  const [storeName, setStoreName] = useState('BlackStore RD');
  const [defaultFee, setDefaultFee] = useState('200');
  const [commission, setCommission] = useState('150');
  const [timerAlert, setTimerAlert] = useState('45');
  const [requireDeliveryPhoto, setRequireDeliveryPhoto] = useState(true);
  const [requirePickupPhoto, setRequirePickupPhoto] = useState(true);
  const [requirePaymentPhoto, setRequirePaymentPhoto] = useState(true);
  const [doubleConfirmation, setDoubleConfirmation] = useState(true);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold">Configuración</h2>

      {/* Store Info */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Store size={16} className="text-bs-accent" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Datos de la tienda
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-bs-text-muted mb-1 block">Nombre</label>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full" disabled={!isAdmin} />
          </div>
        </div>
      </Card>

      {/* Delivery Config */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={16} className="text-bs-green" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Tarifas y comisiones
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-bs-text-muted mb-1 block">Fee de delivery por defecto</label>
            <input type="number" value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} className="w-full" disabled={!isAdmin} />
          </div>
          <div>
            <label className="text-xs text-bs-text-muted mb-1 block">Comisión por entrega (delivery)</label>
            <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="w-full" disabled={!isAdmin} />
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-bs-red" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Seguridad y verificación
          </span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Foto de entrega obligatoria', desc: 'El delivery debe tomar foto al entregar', value: requireDeliveryPhoto, setter: setRequireDeliveryPhoto },
            { label: 'Foto de recogida obligatoria', desc: 'Foto al recoger paquete en tienda', value: requirePickupPhoto, setter: setRequirePickupPhoto },
            { label: 'Foto de comprobante (transferencia)', desc: 'Foto del comprobante de transferencia', value: requirePaymentPhoto, setter: setRequirePaymentPhoto },
            { label: 'Doble confirmación de pago', desc: 'Delivery Y tienda deben confirmar el pago', value: doubleConfirmation, setter: setDoubleConfirmation },
          ].map((toggle) => (
            <div key={toggle.label} className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm font-medium">{toggle.label}</div>
                <div className="text-[10px] text-bs-text-muted">{toggle.desc}</div>
              </div>
              <button
                onClick={() => isAdmin && toggle.setter(!toggle.value)}
                className={`w-12 h-7 rounded-full transition-colors relative ${toggle.value ? 'bg-bs-green' : 'bg-bs-border'}`}
                disabled={!isAdmin}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-transform ${toggle.value ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Timer Alert */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-bs-orange" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Alertas
          </span>
        </div>
        <div>
          <label className="text-xs text-bs-text-muted mb-1 block">
            Alerta si una orden no se mueve en X minutos
          </label>
          <input type="number" value={timerAlert} onChange={(e) => setTimerAlert(e.target.value)} className="w-full" disabled={!isAdmin} />
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} className="text-bs-text-muted" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Aplicación
          </span>
        </div>
        <div className="space-y-1 text-xs text-bs-text-muted">
          <div className="flex justify-between"><span>Versión</span><span>1.0.0</span></div>
          <div className="flex justify-between"><span>Tipo</span><span>PWA (Progressive Web App)</span></div>
          <div className="flex justify-between"><span>Estado</span><Badge variant="success" size="sm">Online</Badge></div>
        </div>
      </Card>

      {isAdmin && (
        <Button variant="success" size="lg" className="w-full">
          <Save size={16} />
          Guardar Configuración
        </Button>
      )}

      <p className="text-center text-[9px] text-bs-text-muted/40 mt-6 pb-2 tracking-wide">
        Desarrollado por Julio Leyba — Jesús es Mi Guía
      </p>
    </div>
  );
}
