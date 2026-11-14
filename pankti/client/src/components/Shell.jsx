import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, LogOut, Ticket } from 'lucide-react';

export default function Shell({ children }) {
  const manager = JSON.parse(localStorage.getItem('qf-manager') || '{}');
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem('qf-token');
    localStorage.removeItem('qf-manager');
    nav('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><span className="brand-mark small">पं</span><b>Pankti<span>.</span></b></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} />Overview</NavLink>
          <NavLink to="/queues" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Ticket size={18} />Queues</NavLink>
          <a className="nav-item" href="/#analytics"><Activity size={18} />Analytics</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">{manager.name?.[0]?.toUpperCase() || 'M'}</div>
          <div className="manager"><b>{manager.name || 'Manager'}</b><small>Queue manager</small></div>
          <button className="icon-btn logout-btn" title="Log out" onClick={logout}><LogOut size={17} /></button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
