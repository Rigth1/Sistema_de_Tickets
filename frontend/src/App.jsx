import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import MainLayout from './layouts/MainLayout'; // <--- Nuestro layout global
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketListPage from './pages/tickets/TicketListPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import TicketCreatePage from './pages/tickets/TicketCreatePage';
import UserAdminPage from './pages/admin/UserAdminPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Ruta Pública */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />

      {/* Rutas Protegidas envueltas en el Layout Principal */}
      <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<TicketCreatePage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/admin/users" element={<UserAdminPage />} />
      </Route>

      {/* Comodín de redirección */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;