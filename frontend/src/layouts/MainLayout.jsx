import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LifeBuoy, LogOut, FileText, Users } from 'lucide-react';
import '../css/main-layout.css';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        {/* Sección Superior: Logo y Usuario/Logout */}
        <div className="sidebar-header-section">
          <div className="sidebar-brand">
            <LifeBuoy size={28} color="#38bdf8" />
            <span>HelpDesk Core</span>
          </div>
          
          <div className="sidebar-user-top">
            <div className="user-info">
              <p className="user-name">{user?.name || 'Usuario'}</p>
              <span className="user-role-badge">{user?.role}</span>
            </div>
            <button onClick={logout} className="logout-btn" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        
        {/* Navegación principal */}
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <FileText size={18} /> Panel Principal
          </button>
          
          <button 
            className={`nav-item ${isActive('/tickets') ? 'active' : ''}`}
            onClick={() => navigate('/tickets')}
          >
            <FileText size={18} /> Gestión de Tickets
          </button>
          
          {user?.role === 'Administrador' && (
            <button 
              className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
              onClick={() => navigate('/admin/users')}
            >
              <Users size={18} /> Administración
            </button>
          )}
        </nav>
      </aside>

      {/* Contenido dinámico inyectado por las rutas hijas */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}