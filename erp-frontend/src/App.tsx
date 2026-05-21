import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Services from './pages/Services';
import Staff from './pages/Staff';
import Products from './pages/Products';
import Bookings from './pages/Bookings';
import Expenses from './pages/Expenses';
import PurchaseOrders from './pages/PurchaseOrders';
import SalesOrders from './pages/SalesOrders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// New ERP module pages
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Taxes from './pages/Taxes';
import BankAccounts from './pages/BankAccounts';
import BankTransactions from './pages/BankTransactions';
import FixedAssets from './pages/FixedAssets';
import PostingTransactions from './pages/PostingTransactions';
import JournalEntries from './pages/JournalEntries';
import PeriodClosing from './pages/PeriodClosing';
import AuditTrail from './pages/AuditTrail';

// Inventory module pages
import StockMovement from './pages/StockMovement';
import StockCard from './pages/StockCard';
import BillOfMaterials from './pages/BillOfMaterials';
import StockOpname from './pages/StockOpname';
import WipProduction from './pages/WipProduction';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      {/* Master Data */}
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/staff" element={<PrivateRoute><Staff /></PrivateRoute>} />
      <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
      <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
      <Route path="/taxes" element={<PrivateRoute><Taxes /></PrivateRoute>} />

      {/* Transactions / Posting */}
      <Route path="/posting-transactions" element={<PrivateRoute><PostingTransactions /></PrivateRoute>} />
      <Route path="/journal-entries" element={<PrivateRoute><JournalEntries /></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
      <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
      <Route path="/purchase-orders" element={<PrivateRoute><PurchaseOrders /></PrivateRoute>} />
      <Route path="/sales-orders" element={<PrivateRoute><SalesOrders /></PrivateRoute>} />

      {/* Finance */}
      <Route path="/bank-accounts" element={<PrivateRoute><BankAccounts /></PrivateRoute>} />
      <Route path="/bank-transactions" element={<PrivateRoute><BankTransactions /></PrivateRoute>} />
      <Route path="/fixed-assets" element={<PrivateRoute><FixedAssets /></PrivateRoute>} />

      {/* Period / Audit */}
      <Route path="/period-closing" element={<PrivateRoute><PeriodClosing /></PrivateRoute>} />
      <Route path="/audit-trail" element={<PrivateRoute><AuditTrail /></PrivateRoute>} />

      {/* Inventory */}
      <Route path="/stock-movement" element={<PrivateRoute><StockMovement /></PrivateRoute>} />
      <Route path="/stock-card" element={<PrivateRoute><StockCard /></PrivateRoute>} />
      <Route path="/bill-of-materials" element={<PrivateRoute><BillOfMaterials /></PrivateRoute>} />
      <Route path="/stock-opname" element={<PrivateRoute><StockOpname /></PrivateRoute>} />
      <Route path="/wip-production" element={<PrivateRoute><WipProduction /></PrivateRoute>} />

      {/* Reports */}
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
