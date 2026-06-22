'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS } from '@/lib/demo-data';
import type { UserRole, User } from '@/lib/types';
import {
  Store, DollarSign, Bell, Shield, Users, Save, Smartphone,
  Plus, Trash2, X, Truck, Key,
} from 'lucide-react';

function ResetDataButton() {
  const { setOrders, clearNotifications } = useAppStore();
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-bs-red font-medium">¿Estás seguro? Esta acción no se puede deshacer.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>No, volver</Button>
          <Button variant="danger" size="sm" onClick={async () => {
            setOrders([]);
            clearNotifications();
            useAppStore.setState({ commissionPayments: [], paidOrderIds: [] });
            const { syncClearData } = await import('@/lib/supabase-sync');
            await syncClearData();
            setConfirm(false);
          }}>Sí, eliminar</Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="danger" size="sm" className="w-full" onClick={() => setConfirm(true)}>
      <Trash2 size={14} /> Resetear datos
    </Button>
  );
}

export default function SettingsPage() {
  const { user, setUser, teamMembers, addTeamMember, updateTeamMember, removeTeamMember } = useAppStore();
  const [storeName, setStoreName] = useState('BlackStore RD');
  const [currentPin, setCurrentPin] = useState('');
  const [newPinVal, setNewPinVal] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  function handleChangePin() {
    if (!user) return;
    if (currentPin !== user.pin) { setPinMsg('PIN actual incorrecto'); return; }
    if (newPinVal.length < 4) { setPinMsg('El nuevo PIN debe tener al menos 4 dígitos'); return; }
    setUser({ ...user, pin: newPinVal });
    updateTeamMember(user.id, { pin: newPinVal });
    setCurrentPin('');
    setNewPinVal('');
    setPinMsg('PIN actualizado');
    setTimeout(() => setPinMsg(''), 3000);
  }
  const [defaultFee, setDefaultFee] = useState('200');
  const [commission, setCommission] = useState('150');
  const [timerAlert, setTimerAlert] = useState('45');
  const [requireDeliveryPhoto, setRequireDeliveryPhoto] = useState(true);
  const [requirePickupPhoto, setRequirePickupPhoto] = useState(true);
  const [requirePaymentPhoto, setRequirePaymentPhoto] = useState(true);
  const [doubleConfirmation, setDoubleConfirmation] = useState(true);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('delivery');

  const isAdmin = user?.role === 'admin';
  const allMembers = [...DEMO_USERS, ...teamMembers.filter((m) => !DEMO_USERS.some((d) => d.id === m.id))];

  function handleAddMember() {
    if (!newName.trim() || !newPhone.trim() || !newPin.trim()) return;
    const member: User = {
      id: `tm_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      pin: newPin.trim(),
      role: newRole,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    addTeamMember(member);
    setNewName('');
    setNewPhone('');
    setNewPin('');
    setNewRole('delivery');
    setShowAddMember(false);
  }

  const roleLabel: Record<UserRole, string> = { admin: 'Admin', employee: 'Empleado', delivery: 'Delivery' };
  const roleColor: Record<UserRole, 'danger' | 'blue' | 'success'> = { admin: 'danger', employee: 'blue', delivery: 'success' };

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold">Configuración</h2>

      {/* Cambiar PIN */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Key size={16} className="text-bs-accent" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Mi cuenta</span>
        </div>
        <p className="text-xs text-bs-text-muted mb-3">{user?.name} · {user?.phone}</p>
        <div className="space-y-2">
          <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="PIN actual" maxLength={6} className="w-full" />
          <input type="password" value={newPinVal} onChange={(e) => setNewPinVal(e.target.value)} placeholder="Nuevo PIN" maxLength={6} className="w-full" />
          <Button variant="primary" size="sm" className="w-full" onClick={handleChangePin}>
            Cambiar PIN
          </Button>
          {pinMsg && (
            <p className={`text-xs text-center ${pinMsg.includes('actualizado') ? 'text-bs-green' : 'text-bs-red'}`}>{pinMsg}</p>
          )}
        </div>
      </Card>

      {/* Team Members */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-bs-accent" />
            <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
              Equipo
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-1 text-xs text-bs-accent hover:text-bs-accent/80"
            >
              {showAddMember ? <X size={14} /> : <Plus size={14} />}
              {showAddMember ? 'Cancelar' : 'Agregar'}
            </button>
          )}
        </div>

        {showAddMember && (
          <div className="space-y-2 p-3 bg-bs-surface border border-bs-border rounded-xl mb-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" className="w-full" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Teléfono" type="tel" className="w-full" />
              <input value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="PIN (4 dígitos)" maxLength={6} className="w-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'employee', 'delivery'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNewRole(r)}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    newRole === r ? 'border-bs-accent bg-bs-accent/10 text-bs-accent' : 'border-bs-border text-bs-text-secondary'
                  }`}
                >
                  {roleLabel[r]}
                </button>
              ))}
            </div>
            <Button variant="success" size="sm" className="w-full" onClick={handleAddMember}>
              <Plus size={14} /> Agregar miembro
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {allMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-2.5 bg-bs-surface rounded-xl border border-bs-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-bs-border flex items-center justify-center">
                  {m.role === 'delivery' ? <Truck size={14} className="text-bs-green" /> :
                   m.role === 'admin' ? <Shield size={14} className="text-bs-red" /> :
                   <Store size={14} className="text-bs-accent" />}
                </div>
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-[10px] text-bs-text-muted">{m.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={roleColor[m.role]} size="sm">{roleLabel[m.role]}</Badge>
                {isAdmin && !DEMO_USERS.some((d) => d.id === m.id) && (
                  <button onClick={() => removeTeamMember(m.id)} className="p-1.5 text-bs-red hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Store Info */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Store size={16} className="text-bs-accent" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Tienda</span>
        </div>
        <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full" disabled={!isAdmin} />
      </Card>

      {/* Delivery Config */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={16} className="text-bs-green" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Tarifas</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-bs-text-muted mb-1 block">Fee delivery por defecto (RD$)</label>
            <input type="number" value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} className="w-full" disabled={!isAdmin} />
          </div>
          <div>
            <label className="text-xs text-bs-text-muted mb-1 block">Comisión por entrega (RD$)</label>
            <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="w-full" disabled={!isAdmin} />
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-bs-red" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Seguridad</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Foto de entrega obligatoria', value: requireDeliveryPhoto, setter: setRequireDeliveryPhoto },
            { label: 'Foto de recogida obligatoria', value: requirePickupPhoto, setter: setRequirePickupPhoto },
            { label: 'Foto comprobante transferencia', value: requirePaymentPhoto, setter: setRequirePaymentPhoto },
            { label: 'Doble confirmación de pago', value: doubleConfirmation, setter: setDoubleConfirmation },
          ].map((toggle) => (
            <div key={toggle.label} className="flex items-center justify-between py-1">
              <span className="text-sm">{toggle.label}</span>
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

      {/* Timer */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-bs-orange" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Alertas</span>
        </div>
        <div>
          <label className="text-xs text-bs-text-muted mb-1 block">Alerta si orden no se mueve en X min</label>
          <input type="number" value={timerAlert} onChange={(e) => setTimerAlert(e.target.value)} className="w-full" disabled={!isAdmin} />
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} className="text-bs-text-muted" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">App</span>
        </div>
        <div className="space-y-1 text-xs text-bs-text-muted">
          <div className="flex justify-between"><span>Versión</span><span>1.0.0</span></div>
          <div className="flex justify-between"><span>Tipo</span><span>PWA</span></div>
          <div className="flex justify-between"><span>Estado</span><Badge variant="success" size="sm">Online</Badge></div>
        </div>
      </Card>

      {isAdmin && (
        <Button variant="success" size="lg" className="w-full">
          <Save size={16} /> Guardar
        </Button>
      )}

      {isAdmin && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Trash2 size={16} className="text-bs-red" />
            <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Datos</span>
          </div>
          <p className="text-xs text-bs-text-muted mb-3">Eliminar todas las órdenes, comisiones y notificaciones. Los usuarios del equipo se mantienen.</p>
          <ResetDataButton />
        </Card>
      )}

      <p className="text-center text-[9px] text-bs-text-muted/40 mt-6 pb-2 tracking-wide">
        Desarrollador<br/>Julio Leyba<br/>Jesús es Mi Guía
      </p>
    </div>
  );
}
