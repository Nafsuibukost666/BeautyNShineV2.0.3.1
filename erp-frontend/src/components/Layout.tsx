import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// ─── Collapsible Menu Group ──────────────────────────────────────

function MenuGroup({ label, icon, defaultOpen, children }: {
  label: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 8,
          cursor: 'pointer', userSelect: 'none',
          color: '#a8a4a0', fontSize: 14, fontWeight: 600,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{
          fontSize: 11, transition: 'transform 0.25s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▾</span>
      </div>
      <div style={{
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, opacity 0.25s ease',
        maxHeight: open ? 400 : 0,
        opacity: open ? 1 : 0,
      }}>
        <div style={{ paddingLeft: 12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Section Helper ──────────────────────────────────────────────

const sidebarStyle: React.CSSProperties = {
  width: 260,
  height: '100vh',
  background: 'linear-gradient(180deg, #1a1a24 0%, #15151e 100%)',
  borderRight: '1px solid #2e2e3e',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
  overflowY: 'auto',
};

const logoStyle: React.CSSProperties = {
  padding: '24px 20px',
  borderBottom: '1px solid #2e2e3e',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const logoIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #c4895e, #e8a87c)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 700,
  color: '#fff',
  flexShrink: 0,
};

const navStyle: React.CSSProperties = {
  padding: '12px 10px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const linkBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#a8a4a0',
  fontSize: 14,
  fontWeight: 500,
  transition: 'all 0.2s',
};

const sectionLabelStyle: React.CSSProperties = {
  padding: '16px 14px 4px',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: '#6b6865',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return window.location.pathname === '/';
    return window.location.pathname.startsWith(path);
  };

  const linkStyle = (path: string): React.CSSProperties => ({
    ...linkBase,
    ...(isActive(path) ? {
      background: 'rgba(232, 168, 124, 0.12)',
      color: '#e8a87c',
    } : {}),
  });

  const renderSection = (label: string, items: { path: string; label: string; icon: string }[]) => (
    <>
      <div style={sectionLabelStyle}>{label}</div>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          style={linkStyle(item.path)}
          onMouseEnter={(e) => {
            if (!isActive(item.path)) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            if (!isActive(item.path)) e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div style={{ display: 'flex' }}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>E</div>
          <div>
            <div style={{ color: '#f0ece4', fontSize: 16, fontWeight: 700 }}>ERP Core</div>
            <div style={{ color: '#6b6865', fontSize: 11 }}>Salon Management</div>
          </div>
        </div>

        <nav style={navStyle}>
          {/* Dashboard */}
          <div style={sectionLabelStyle}>UTAMA</div>
          <NavLink to="/" end style={linkStyle('/')}
            onMouseEnter={(e) => { if (!isActive('/')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { if (!isActive('/')) e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>📊</span>
            <span>Dashboard</span>
          </NavLink>

          {renderSection('TRANSAKSI', [
            { path: '/posting-transactions', label: 'Transaksi', icon: '📋' },
            { path: '/purchase-orders', label: 'Purchase Order', icon: '🛒' },
            { path: '/sales-orders', label: 'Sales Order', icon: '🧾' },
          ])}

          {renderSection('KEUANGAN', [
            { path: '/bank-accounts', label: 'Rekening Bank', icon: '🏦' },
            { path: '/bank-transactions', label: 'Transaksi Bank', icon: '💳' },
            { path: '/fixed-assets', label: 'Aset Tetap', icon: '🏗️' },
            { path: '/expenses', label: 'Pengeluaran', icon: '💰' },
          ])}

          {renderSection('INVENTORY', [
            { path: '/stock-movement', label: 'Mutasi Stok', icon: '📦' },
            { path: '/stock-card', label: 'Kartu Stok', icon: '📋' },
            { path: '/stock-opname', label: 'Opname Stok', icon: '🔍' },
            { path: '/audit-trail', label: 'Audit Trail', icon: '📝' },
          ])}

          {renderSection('MANUFAKTUR', [
            { path: '/bill-of-materials', label: 'BOM', icon: '📝' },
            { path: '/wip-production', label: 'Produksi (WIP)', icon: '🏭' },
          ])}

          <MenuGroup label="Master" icon="📋" defaultOpen={true}>
            <NavLink to="/products" style={linkStyle('/products')}
              onMouseEnter={(e) => { if (!isActive('/products')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/products')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>📦</span><span>Produk</span>
            </NavLink>
            <NavLink to="/categories" style={linkStyle('/categories')}
              onMouseEnter={(e) => { if (!isActive('/categories')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/categories')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🏷️</span><span>Kategori</span>
            </NavLink>
            <NavLink to="/staff" style={linkStyle('/staff')}
              onMouseEnter={(e) => { if (!isActive('/staff')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/staff')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>👤</span><span>Staff</span>
            </NavLink>
            <NavLink to="/services" style={linkStyle('/services')}
              onMouseEnter={(e) => { if (!isActive('/services')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/services')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>💇</span><span>Layanan</span>
            </NavLink>
            <NavLink to="/customers" style={linkStyle('/customers')}
              onMouseEnter={(e) => { if (!isActive('/customers')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/customers')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>👥</span><span>Customer</span>
            </NavLink>
            <NavLink to="/suppliers" style={linkStyle('/suppliers')}
              onMouseEnter={(e) => { if (!isActive('/suppliers')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/suppliers')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🚚</span><span>Supplier</span>
            </NavLink>
            <NavLink to="/accounts" style={linkStyle('/accounts')}
              onMouseEnter={(e) => { if (!isActive('/accounts')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/accounts')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>📒</span><span>Chart of Account</span>
            </NavLink>
            <NavLink to="/taxes" style={linkStyle('/taxes')}
              onMouseEnter={(e) => { if (!isActive('/taxes')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/taxes')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🧾</span><span>Tax</span>
            </NavLink>
          </MenuGroup>

          {/* Akuntansi */}
          <MenuGroup label="Akuntansi" icon="📒" defaultOpen={true}>
            <NavLink to="/journal-entries" style={linkStyle('/journal-entries')}
              onMouseEnter={(e) => { if (!isActive('/journal-entries')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!isActive('/journal-entries')) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>📓</span><span>Journal</span>
            </NavLink>
          </MenuGroup>

          {renderSection('SISTEM', [
            { path: '/period-closing', label: 'Periode', icon: '🔒' },
            { path: '/reports', label: 'Laporan', icon: '📈' },
            { path: '/settings', label: 'Pengaturan', icon: '⚙️' },
          ])}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #2e2e3e', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2a2a3e, #3a3a4e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#e8a87c',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#f0ece4', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username || 'Admin'}
            </div>
            <div style={{ color: '#6b6865', fontSize: 11 }}>{user?.role || 'Owner'}</div>
          </div>
          <button onClick={handleLogout}
            style={{
              background: 'rgba(224,108,108,0.1)', border: '1px solid rgba(224,108,108,0.2)',
              color: '#e06c6c', padding: '4px 10px', borderRadius: 6,
              cursor: 'pointer', fontSize: 11, fontWeight: 500,
            }}>
            Logout
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 260, minHeight: '100vh' }}>
        <main style={{ padding: '28px 32px', maxWidth: 1400 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
