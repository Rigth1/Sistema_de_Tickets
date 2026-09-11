import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketListPage from './pages/tickets/TicketListPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import TicketCreatePage from './pages/tickets/TicketCreatePage';
import UserAdminPage from './pages/admin/UserAdminPage';

function App() {
  // Verificación simple de autenticación basada en el token guardado en localStorage
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Ruta Pública de Autenticación */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Principales del Sistema de Tickets */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/tickets" 
          element={isAuthenticated ? <TicketListPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/tickets/new" 
          element={isAuthenticated ? <TicketCreatePage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/tickets/:id" 
          element={isAuthenticated ? <TicketDetailPage /> : <Navigate to="/login" />} 
        />
        
        {/* Panel de Administración de Usuarios */}
        <Route 
          path="/admin/users" 
          element={isAuthenticated ? <UserAdminPage /> : <Navigate to="/login" />} 
        />

        {/* Redirección por defecto según el estado de sesión */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;