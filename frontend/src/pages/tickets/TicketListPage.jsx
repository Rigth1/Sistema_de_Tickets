import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter, ChevronRight, ArrowUpRight, Plus } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/ticket-list.css';

export default function TicketListPage() {
    const [tickets, setTickets] = useState([]);
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    const isAdminOrSupervisor = ['Administrador', 'Supervisor'].includes(currentUser?.role);

    // Estados para la Paginación (Opción B)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Puedes ajustarlo a 8, 10, etc.

    const navigate = useNavigate();

    useEffect(() => {
        if (selectedStatus === 'STALE_48H') {
            loadStaleTickets();
        } else if (selectedStatus !== '') {
            loadData();
        } else {
            loadData();
        }
    }, [selectedStatus]);

    // Cada vez que cambie el buscador o el área, reiniciamos a la página 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedArea]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [areasData, ticketsResponse] = await Promise.all([
                ticketService.getAreas(),
                ticketService.getAllTickets(1, 100, selectedStatus) // Traemos un lote amplio para paginar en frontend
            ]);

            setAreas(areasData);
            setTickets(ticketsResponse.data || ticketsResponse);
        } catch (error) {
            console.error('Error al sincronizar con el backend:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStaleTickets = async () => {
        setLoading(true);
        try {
            const response = await ticketService.getStaleTickets(); // Endpoint del backend /tickets/stale
            setTickets(response.data || response);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error al cargar tickets sin actualizar:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesArea = selectedArea ? ticket.area_id === selectedArea : true;
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toString().includes(searchTerm);
        return matchesArea && matchesSearch;
    });

    // Lógica de Paginación (Opción B)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const getAreaCount = (areaId) => tickets.filter(t => t.area_id === areaId).length;

    const getStatusClass = (status) => {
        switch (status) {
            case 'Abierto': return 'badge-abierto';
            case 'En Progreso': return 'badge-progreso';
            case 'Resuelto': return 'badge-resuelto';
            default: return 'badge-bajo';
        }
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'Critico': return 'badge-critico';
            case 'Alto': return 'badge-alto';
            case 'Medio': return 'badge-medio';
            default: return 'badge-bajo';
        }
    };

    return (
        <div className="ticket-page-container">

            {/* Header */}
            <div className="ticket-header">
                <div>
                    <h1 className="ticket-title">Centro de Control de Tickets</h1>
                    <p className="ticket-subtitle">Gestión de colas operativas por área corporativa y supervisión de flujos.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/tickets/new')}>
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Ticket</span>
                </button>
            </div>

            {/* Colas por Área */}
            <div className="areas-section-wrapper">
                <h2 className="areas-section-title">
                    <Layers className="w-4 h-4 areas-title-icon" />
                    Colas Operativas por Área
                </h2>
                <div className="areas-grid">
                    <div
                        onClick={() => setSelectedArea(null)}
                        className={`area-card ${selectedArea === null ? 'active' : ''}`}
                    >
                        <div className="area-card-top">
                            <span className="area-card-subtitle">Vista Global</span>
                            <span className="badge badge-bajo">{tickets.length} total</span>
                        </div>
                        <p className="area-card-main-title">Todas las Colas</p>
                        <div className="area-card-footer-link">
                            <span>Ver consolidado completo</span>
                            <ChevronRight className="w-3.5 h-3.5 area-card-icon-spacing" />
                        </div>
                    </div>

                    {areas.map((area) => {
                        const count = getAreaCount(area.id);
                        const isSelected = selectedArea === area.id;
                        return (
                            <div
                                key={area.id}
                                onClick={() => setSelectedArea(area.id)}
                                className={`area-card ${isSelected ? 'active' : ''}`}
                            >
                                <div className="area-card-top">
                                    <span className="area-card-name-ellipsis">{area.name}</span>
                                    <span className={`badge ${count > 0 ? 'badge-progreso' : 'badge-bajo'}`}>{count} activos</span>
                                </div>
                                <p className="area-card-main-title">{area.name}</p>
                                <div className="area-card-footer-link muted">
                                    <span>Filtrar cola</span>
                                    <ChevronRight className="w-3.5 h-3.5 area-card-icon-spacing" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="filters-bar">
                <div className="search-input-wrapper">
                    <Search className="w-4 h-4 search-icon-pos" />
                    <input
                        type="text"
                        placeholder="Buscar por ID o título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="status-filters-scroll">
                    <span className="status-filter-label">
                        <Filter className="w-3.5 h-3.5" /> Estado:
                    </span>
                    {['', 'Abierto', 'En Progreso', 'Resuelto', 'Cerrado'].map((statusOption) => (
                        <button
                            key={statusOption}
                            onClick={() => setSelectedStatus(statusOption)}
                            className={`status-filter-btn ${selectedStatus === statusOption ? 'active' : ''}`}
                        >
                            {statusOption === '' ? 'Todos' : statusOption}
                        </button>
                    ))}
                    {/* Verificamos si el rol del usuario actual es Supervisor o Administrador */}
                    {isAdminOrSupervisor && (
                        <button
                            onClick={() => {
                                if (selectedStatus === 'STALE_48H') {
                                    setSelectedStatus('');
                                    setSelectedArea(null);
                                    loadData(); // Recarga normal
                                } else {
                                    setSelectedStatus('STALE_48H');
                                    setSelectedArea(null); // Resetea el área para ver todas las colas
                                    loadStaleTickets();     // Llama directo a la función especializada
                                }
                            }}
                            className={`status-filter-btn ${selectedStatus === 'STALE_48H' ? 'active' : ''}`}
                            style={{
                                borderColor: '#f59e0b',
                                background: selectedStatus === 'STALE_48H' ? 'rgba(245, 158, 11, 0.15)' : 'transparent'
                            }}
                        >
                            ⚠️ Tickets sin actualizar ( superior a 48h)
                        </button>
                    )}
                </div>

            </div>

            {/* Tabla de Tickets */}
            <div className="table-container">
                <div className="table-scroll-wrapper">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>ID / Ticket</th>
                                <th>Área / Cola</th>
                                <th>Usuario Afectado</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Asignado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="table-empty-state">
                                        Cargando flujos de tickets...
                                    </td>
                                </tr>
                            ) : currentTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="table-empty-state">
                                        No se encontraron tickets en esta cola o con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                currentTickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>
                                            <div className="table-cell-id-title">
                                                <span className="ticket-id-badge">
                                                    #{ticket.id}
                                                </span>
                                                <span className="ticket-title-text">{ticket.title}</span>
                                            </div>
                                            <div className="ticket-subtext">
                                                Creado por: {ticket.creator?.email || 'Desconocido'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="table-area-text">
                                                {ticket.area?.name || 'Sin Área'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-cell-main">
                                                {ticket.affectedUser ? ticket.affectedUser.name : (ticket.creator?.name || 'Usuario directo')}
                                            </div>
                                            <div className="ticket-subtext">
                                                {ticket.affectedUser ? `Reportado por: ${ticket.creator?.email || 'Sistema'}` : 'Afectado directo'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusClass(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getPriorityClass(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="assignee-cell">
                                                <div className="assignee-avatar">
                                                    {ticket.assignee?.email ? ticket.assignee.email.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span className="assignee-name">
                                                    {ticket.assignee?.email || 'Sin asignar'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                className="action-icon-btn"
                                                title="Ver detalle y gestionar"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginación */}
                {!loading && filteredTickets.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTickets.length)} de {filteredTickets.length} tickets
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.875rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Anterior
                            </button>
                            <span style={{ fontSize: '0.875rem', color: '#f8fafc', padding: '0 8px' }}>
                                Página {currentPage} de {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.875rem', opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}