export interface User {
  id: string;
  username: string;
  role: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_min: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  stock_qty: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface PosSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  opened_by: string;
  opening_cash: number;
  total_sales: number;
  total_expenses: number;
  total_transactions: number;
  opened_at: string;
  closed_at?: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  therapist_id: string;
  therapist_name: string;
  service_ids: string[];
  date: string;
  time: string;
  status: 'PENDING' | 'CHECKED_IN' | 'DONE' | 'CANCELLED' | 'NO_SHOW';
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface TransactionItem {
  item_type: 'service' | 'product';
  item_name: string;
  qty: number;
  unit_price: number;
  discount: number;
  staff_id?: string;
  staff_name?: string;
  line_total: number;
}

export interface Payment {
  method: string;
  amount: number;
  reference_no?: string;
}

export interface Transaction {
  code: string;
  date: string;
  customer_name?: string;
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_status: string;
  items: TransactionItem[];
  payments: Payment[];
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface InitialData {
  services: Service[];
  products: Product[];
  customers: Customer[];
  staff: Staff[];
}
