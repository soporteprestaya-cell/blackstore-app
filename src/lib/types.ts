export type UserRole = 'admin' | 'employee' | 'delivery';

export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'ready'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type OrderType = 'standard' | 'try_fit';

export type PaymentMethod = 'transfer' | 'cash' | 'prepaid';

export type DeliveryMethod = 'personal' | 'bus_route' | 'shipping_company';

export interface BusRouteInfo {
  company: string;
  route: string;
  terminal: string;
  notes?: string;
}

export interface ShippingCompanyInfo {
  company: string;
  destination: string;
  tracking_number?: string;
  notes?: string;
}

export type PaymentStatus = 'pending' | 'delivery_confirmed' | 'store_confirmed' | 'verified';

export interface User {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  type: 'delivery_completed' | 'payment_confirmed' | 'order_assigned';
  message: string;
  order_id?: string;
  read: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  sector: string;
  location_url?: string;
  notes?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  order_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  sizes: string[];
  colors: string[];
  image_url?: string;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  size?: string;
  color?: string;
  quantity: number;
  unit_price: number;
  is_try_fit: boolean;
  kept: boolean | 'received' | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer?: Customer;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  source: 'whatsapp' | 'instagram' | 'store' | 'other';
  priority: 'normal' | 'urgent';
  delivery_method: DeliveryMethod;
  bus_route?: BusRouteInfo;
  shipping_company?: ShippingCompanyInfo;
  location_url?: string;
  product_photos: string[];
  package_photo?: string;
  payment_photo?: string;
  created_by: string;
  assigned_delivery_id?: string;
  assigned_delivery?: User;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  delivery_user_id: string;
  delivery_user?: User;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'returning' | 'returned';
  picked_up_at?: string;
  delivered_at?: string;
  delivery_photo?: string;
  delivery_gps_lat?: number;
  delivery_gps_lng?: number;
  payment_photo?: string;
  cash_amount?: number;
  return_photo?: string;
  returned_at?: string;
  delivery_notes?: string;
  rating?: number;
  commission: number;
  created_at: string;
}

export interface CommissionPayment {
  id: string;
  delivery_user_id: string;
  delivery_user_name: string;
  amount: number;
  orders_paid: string[];
  paid_at: string;
  paid_by: string;
  confirmed_by_delivery: boolean;
  confirmed_at?: string;
}

export interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface DashboardStats {
  orders_today: number;
  orders_pending: number;
  orders_in_transit: number;
  orders_delivered: number;
  revenue_today: number;
  payments_pending: number;
  active_deliveries: number;
}
