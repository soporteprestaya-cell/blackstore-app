-- BlackStore RD - Schema de Base de Datos
-- Ejecutar en Supabase SQL Editor

-- Usuarios del sistema (admin, empleados, delivery)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'delivery')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  zones TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  sector TEXT,
  notes TEXT,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  order_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Productos (catálogo rápido)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  price NUMERIC(10,2) NOT NULL,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'try_fit')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','preparing','ready','assigned','picked_up','in_transit','delivered','completed','cancelled')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('transfer', 'cash', 'prepaid')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','delivery_confirmed','store_confirmed','verified')),
  notes TEXT,
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'instagram', 'store', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  product_photos TEXT[] DEFAULT '{}',
  package_photo TEXT,
  created_by UUID REFERENCES users(id),
  assigned_delivery_id UUID REFERENCES users(id),
  timer_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items de la orden
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  is_try_fit BOOLEAN DEFAULT false,
  kept BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Entregas (tracking del delivery)
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  delivery_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','picked_up','in_transit','delivered','returning','returned')),
  pickup_photo TEXT,
  picked_up_at TIMESTAMPTZ,
  delivery_photo TEXT,
  delivered_at TIMESTAMPTZ,
  delivery_gps_lat DOUBLE PRECISION,
  delivery_gps_lng DOUBLE PRECISION,
  payment_photo TEXT,
  cash_amount NUMERIC(10,2),
  return_photo TEXT,
  returned_at TIMESTAMPTZ,
  delivery_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  commission NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Confirmaciones de pago (doble vía)
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  confirmed_by UUID REFERENCES users(id),
  confirmed_by_role TEXT NOT NULL CHECK (confirmed_by_role IN ('delivery', 'store')),
  method TEXT NOT NULL,
  amount NUMERIC(10,2),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Zonas de entrega con precios
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 200,
  estimated_minutes INTEGER DEFAULT 45,
  is_active BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(assigned_delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user ON deliveries(delivery_user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);

-- Datos iniciales: zonas de entrega
INSERT INTO delivery_zones (name, fee, estimated_minutes) VALUES
  ('Ensanche Naco', 150, 25),
  ('Piantini', 150, 25),
  ('Los Prados', 200, 30),
  ('Gazcue', 200, 30),
  ('Zona Colonial', 200, 35),
  ('Bella Vista', 150, 25),
  ('Evaristo Morales', 150, 25),
  ('Serrallés', 150, 25),
  ('Santo Domingo Este', 300, 45),
  ('Santo Domingo Norte', 350, 50),
  ('Santiago', 500, 120),
  ('Otro', 400, 60)
ON CONFLICT DO NOTHING;

-- Usuario admin inicial
INSERT INTO users (name, phone, pin, role) VALUES
  ('José Sánchez', '8095550001', '1234', 'admin')
ON CONFLICT (phone) DO NOTHING;
