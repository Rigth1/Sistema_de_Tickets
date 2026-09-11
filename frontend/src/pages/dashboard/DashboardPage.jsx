import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import '../../css/dashboard.css'; // <--- Importa solo los estilos del dashboard

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [metrics, setMetrics] = useState({
    totalOpen: 0,
    totalInProgress: 0,
    totalResolved: 0,
    totalUrgent: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const metricsRes = await api.get('/reports/dashboard');
        setMetrics(metricsRes.data.metrics);

        const ticketsRes = await api.get('/tickets?limit=5');
        setRecentTickets(ticketsRes.data.data || []);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudo cargar la información del panel.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/reports/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tickets-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al exportar el reporte CSV (Asegúrate de ser Administrador).');
    }
  };

  return (
    <div>
      <header className="main-header">
        <div>
          <h1>Panel de Control</h1>
          <p>Bienvenido de nuevo, aquí tienes el resumen de la operación actual.</p>
        </div>
        <div className="header-actions">
          {user?.role === 'Administrador' && (
            <button onClick={handleExportCsv} className="btn-secondary">
              <Download size={16} /> Exportar CSV
            </button>
          )}
          <button onClick={() => navigate('/tickets/new')} className="btn-primary">
            <PlusCircle size={16} /> Nuevo Ticket
          </button>
        </div>
      </header>

      {error && <div className="error-alert">{error}</div>}

      {loading ? (
        <div className="loading-state">Cargando métricas del sistema...</div>
      ) : (
        <>
          {/* Tarjetas de Métricas (KPIs) */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon open"><Clock size={24} /></div>
              <div>
                <h3>Abiertos</h3>
                <p className="metric-value">{metrics.totalOpen}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon progress"><AlertCircle size={24} /></div>
              <div>
                <h3>En Progreso</h3>
                <p className="metric-value">{metrics.totalInProgress}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon resolved"><CheckCircle2 size={24} /></div>
              <div>
                <h3>Resueltos</h3>
                <p className="metric-value">{metrics.totalResolved}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon urgent"><ShieldAlert size={24} /></div>
              <div>
                <h3>Urgentes</h3>
                <p className="metric-value">{metrics.totalUrgent}</p>
              </div>
            </div>
          </div>

          {/* Sección de Actividad Reciente */}
          <div className="recent-section">
            <div className="section-title">
              <h2>Tickets Recientes</h2>
              <button onClick={() => navigate('/tickets')} className="text-link">
                Ver todos <ArrowRight size={16} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-text">No hay tickets registrados recientemente.</td>
                    </tr>
                  ) : (
                    recentTickets.map((ticket) => (
                      <tr key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} className="table-row">
                        <td>#{ticket.id}</td>
                        <td className="ticket-title-cell">{ticket.title}</td>
                        <td>
                          <span className={`status-badge ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>
                          <span className={`priority-badge ${ticket.priority.toLowerCase()}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}