import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { tab: 'pos',       icon: 'fa-cart-shopping',     label: 'POS Kasir' },
  { tab: 'booking',   icon: 'fa-calendar-check',    label: 'Booking' },
  { tab: 'customers', icon: 'fa-users',             label: 'Customer' },
  { tab: 'products',  icon: 'fa-box',               label: 'Stok Produk' },
  { tab: 'expenses',  icon: 'fa-arrow-trend-down',  label: 'Pengeluaran' },
  { tab: 'report',    icon: 'fa-chart-simple',      label: 'Laporan' },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleTab = (tab) => {
    onTabChange(tab);
    setOpen(false); // close mobile sidebar after click
  };

  return (
    <>
      {/* Hamburger button — visible on mobile */}
      <button className="hamburger" onClick={() => setOpen(!open)}>
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`}></i>
      </button>

      {/* Mobile overlay */}
      <div className="mobile-overlay" onClick={() => setOpen(false)} style={{ display: open ? 'block' : 'none' }}></div>

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="logo">
          <div className="logo-icon"><i className="fa-solid fa-sparkles"></i></div>
          <div>
            <div className="logo-text">Salon Eyelash</div>
            <div className="logo-sub">POS &amp; ERP System</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Menu</div>
          {menuItems.map((item) => (
            <button
              key={item.tab}
              className={`nav-item${activeTab === item.tab ? ' active' : ''}`}
              onClick={() => handleTab(item.tab)}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
          {user?.role === 'owner' && (
            <button
              className={`nav-item${activeTab === 'users' ? ' active' : ''}`}
              onClick={() => handleTab('users')}
            >
              <i className="fa-solid fa-user-gear"></i>
              <span>Pengguna</span>
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.fullName || user?.username || 'User'}</div>
              <div className="user-role">{user?.role || 'user'}</div>
            </div>
          </div>
          <button className="btn btn-danger btn-sm btn-full" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Keluar
          </button>
          <div className="sidebar-version">v3.0 &middot; Salon ERP</div>
        </div>
      </aside>
    </>
  );
}
