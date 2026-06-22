-- BlackStore RD — Schema for Supabase
-- Run this in the Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- 1. Team Members (users)
create table if not exists team_members (
  id text primary key,
  name text not null,
  phone text not null,
  pin text not null,
  role text not null check (role in ('admin', 'employee', 'delivery')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Orders
create table if not exists orders (
  id text primary key,
  order_number text not null,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  customer_sector text,
  customer_location_url text,
  type text default 'standard' check (type in ('standard', 'try_fit')),
  status text default 'new' check (status in ('new','preparing','ready','assigned','picked_up','in_transit','delivered','completed','cancelled')),
  subtotal numeric default 0,
  delivery_fee numeric default 0,
  total numeric default 0,
  payment_method text check (payment_method in ('transfer', 'cash', 'prepaid')),
  payment_status text default 'pending' check (payment_status in ('pending','delivery_confirmed','store_confirmed','verified')),
  notes text,
  source text default 'store',
  priority text default 'normal' check (priority in ('normal', 'urgent')),
  delivery_method text default 'personal' check (delivery_method in ('personal', 'bus_route')),
  bus_route_company text,
  bus_route_destination text,
  bus_route_notes text,
  product_photos text[] default '{}',
  package_photo text,
  created_by text references team_members(id),
  assigned_delivery_id text references team_members(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Order Items
create table if not exists order_items (
  id text primary key,
  order_id text references orders(id) on delete cascade,
  product_name text not null,
  size text,
  color text,
  quantity integer default 1,
  unit_price numeric default 0,
  is_try_fit boolean default false,
  kept text check (kept in ('kept', 'returned'))
);

-- 4. Commission Payments
create table if not exists commission_payments (
  id text primary key,
  delivery_user_id text references team_members(id),
  delivery_user_name text not null,
  amount numeric not null,
  orders_paid text[] default '{}',
  paid_at timestamptz default now(),
  paid_by text,
  confirmed_by_delivery boolean default false,
  confirmed_at timestamptz
);

-- 5. Notifications
create table if not exists notifications (
  id text primary key,
  user_id text,
  type text not null,
  message text not null,
  order_id text,
  read boolean default false,
  created_at timestamptz default now()
);

-- 6. Delivery Online Status
create table if not exists delivery_online (
  user_id text primary key references team_members(id),
  is_online boolean default false,
  updated_at timestamptz default now()
);

-- 7. Schema migrations (run these if tables already exist)
alter table orders add column if not exists payment_photo text;
alter table order_items drop constraint if exists order_items_kept_check;
alter table order_items add constraint order_items_kept_check check (kept in ('kept', 'returned', 'received'));

-- Enable Realtime on all tables
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table commission_payments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table delivery_online;

-- RLS: Allow all operations with anon key (simple setup for internal business app)
alter table team_members enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table commission_payments enable row level security;
alter table notifications enable row level security;
alter table delivery_online enable row level security;

create policy "Allow all on team_members" on team_members for all using (true) with check (true);
create policy "Allow all on orders" on orders for all using (true) with check (true);
create policy "Allow all on order_items" on order_items for all using (true) with check (true);
create policy "Allow all on commission_payments" on commission_payments for all using (true) with check (true);
create policy "Allow all on notifications" on notifications for all using (true) with check (true);
create policy "Allow all on delivery_online" on delivery_online for all using (true) with check (true);
