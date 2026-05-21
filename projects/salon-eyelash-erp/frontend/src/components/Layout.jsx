import { useState } from 'react';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import POS from './tab-POS';
import Booking from './tab-Booking';
import Laporan from './tab-Laporan';
import Customers from './tab-Customers';
import Products from './tab-Products';
import Expenses from './tab-Expenses';
import Users from './tab-Users';

const tabs = {
  pos:       { component: POS,       label: 'POS Kasir' },
  booking:   { component: Booking,   label: 'Booking' },
  report:    { component: Laporan,   label: 'Laporan' },
  customers: { component: Customers, label: 'Customer' },
  products:  { component: Products,  label: 'Stok Produk' },
  expenses:  { component: Expenses,  label: 'Pengeluaran' },
  users:     { component: Users,     label: 'Pengguna' },
};

export default function Layout() {
  const [activeTab, setActiveTab] = useState('pos');
  const TabComponent = tabs[activeTab]?.component;

  return (
    <>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        <ErrorBoundary>
          {TabComponent && <TabComponent />}
        </ErrorBoundary>
      </main>
    </>
  );
}
