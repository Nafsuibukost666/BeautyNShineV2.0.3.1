import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginResponse, InitialData, Booking, Expense,
  Transaction, PosSession, Customer, User,
} from './types';

const API_BASE = '/api';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────
export const authAPI = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),
  me: () => api.get<{ success: boolean; data: User }>('/auth/me'),
};

// ─── POS Core ───────────────────────────────
export const posAPI = {
  getInitialData: () =>
    api.get<{ success: boolean; data: InitialData }>('/initial-data'),

  listTransactions: (limit: number = 20) =>
    api.get<{ success: boolean; data: any[] }>('/transactions', { params: { limit } }),

  createCustomer: (data: { name: string; phone?: string }) =>
    api.post<{ success: boolean; data: Customer }>('/customer', data),

  createTransaction: (data: {
    customer?: { name: string; phone?: string };
    items: { item_type: string; item_name: string; qty: number; unit_price: number; discount?: number; staff_id?: string; staff_name?: string }[];
    payments: { method: string; amount: number; reference_no?: string }[];
    discount?: number;
    session_id?: string;
    notes?: string;
  }) => api.post<{ success: boolean; data: Transaction }>('/transaction', data),

  getReceipt: (code: string) =>
    api.get<{ success: boolean; data: Transaction }>(`/receipt/${code}`),
};

// ─── Session / Shift ────────────────────────
export const sessionAPI = {
  openSession: (data: { openedBy: string; openingCash: number }) =>
    api.post<{ success: boolean; data: PosSession }>('/pos/session/open', data),

  closeSession: (sessionId: number, data: { closingCash: number; notes?: string }) =>
    api.post<{ success: boolean; data: PosSession }>(`/pos/session/${sessionId}/close`, data),

  getActive: () =>
    api.get<{ success: boolean; data: PosSession }>('/pos/session/active'),

  addExpense: (sessionId: number, data: { description: string; amount: number }) =>
    api.post<{ success: boolean; data: Expense }>(`/pos/session/${sessionId}/expense`, data),

  getExpenses: (sessionId: number) =>
    api.get<{ success: boolean; data: Expense[] }>(`/pos/session/${sessionId}/expenses`),
};

// ─── Booking ────────────────────────────────
export const bookingAPI = {
  listBookings: (params?: { date?: string; status?: string }) =>
    api.get<{ success: boolean; data: Booking[] }>('/bookings', { params }),

  searchBookings: (q: string) =>
    api.get<{ success: boolean; data: Booking[] }>('/bookings/search', { params: { q } }),

  createBooking: (data: {
    customerName: string;
    customerPhone?: string;
    therapistName: string;
    assignedBed?: string;
    services?: string[];
    bookingDate: string;
    estimatedDuration?: number;
  }) => api.post<{ success: boolean; data: Booking }>('/bookings', data),

  updateStatus: (id: string, status: string) =>
    api.put<{ success: boolean; data: Booking }>(`/bookings/${id}/status`, { status }),

  checkIn: (id: string) =>
    api.post<{ success: boolean; data: Booking }>(`/bookings/${id}/check-in`),
};

// ─── Dashboard ──────────────────────────────
export const dashboardAPI = {
  getStats: () =>
    api.get<{ success: boolean; data: any }>('/dashboard-stats'),
};

export default api;
