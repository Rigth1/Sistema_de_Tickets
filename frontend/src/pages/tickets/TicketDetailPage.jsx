import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Shield, User, RefreshCw, AlertCircle } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import '../../css/ticket-detail.css';

export default function TicketDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [ticket, setTicket] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    // Definición de roles
    const isClient = currentUser?.role === 'Cliente';
    const isAgent = currentUser?.role === 'Agente';
    const isAdminOrSupervisor = ['Administrador', 'Supervisor'].includes(currentUser?.role);

    // Formulario de gestión / actualización
    const [updateData, setUpdateData] = useState({
        status: '',
        assigned_to: '',
        comment: '',
        is_internal: false,
    });

    const fetchTicketDetail = async () => {
        try {
            setLoading(true);
            const data = await ticketService.getTicketById(id);
            setTicket(data);
            setUpdateData(prev => ({
                ...prev,
                status: data.status,
                assigned_to: data.assigned_to || '',
            }));
        } catch (err) {
            console.error('Error al cargar detalle del ticket:', err);
            setError('No se pudo cargar la información del ticket.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketDetail();
        ticketService.getUsers().then(setUsers).catch(() => { });
    }, [id]);

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const hasComment = updateData.comment.trim().length > 0;
        const statusChanged = updateData.status !== ticket.status;
        const assignedChanged = String(updateData.assigned_to) !== String(ticket.assigned_to || '');

        // Validación si no hay ningún cambio ni comentario
        if (!hasComment && !statusChanged && !assignedChanged) {
            setError('Debe agregar un comentario o realizar algún cambio en el estado o asignación.');
            return;
        }

        try {
            setUpdating(true);

            // Construir un payload dinámico que SOLO incluya lo que cambió o se ingresó
            const payload = {};

            if (statusChanged && !isClient) {
                payload.status = updateData.status;
            }

            if (assignedChanged && isAdminOrSupervisor) {
                payload.assigned_to = updateData.assigned_to !== '' ? Number(updateData.assigned_to) : null;
            }

            if (hasComment) {
                payload.comment = updateData.comment.trim();
                // Los clientes nunca pueden mandar notas internas
                payload.is_internal = isClient ? false : updateData.is_internal;
            }

            await ticketService.updateTicket(id, payload);

            // Limpiar formulario de comentarios y recargar datos frescos
            setUpdateData(prev => ({ ...prev, comment: '', is_internal: false }));
            await fetchTicketDetail();
        } catch (err) {
            console.error('Error al actualizar ticket:', err);
            setError(err.response?.data?.message || 'Error al actualizar el ticket.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="ticket-loading">Cargando detalles del ticket...</div>;
    }

    if (!ticket) {
        return (
            <div className="ticket-not-found">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2>Ticket no encontrado</h2>
                <button onClick={() => navigate('/tickets')} className="btn-primary">Volver a la lista</button>
            </div>
        );
    }

    // Función para calcular la fecha de la última gestión real
    const getLastActivityDate = () => {
        const dates = [
            ticket.updated_at,
            ticket.created_at,
            ...(ticket.history || []).map(h => h.created_at || h.timestamp),
            ...(ticket.comments || []).map(c => c.created_at)
        ].filter(Boolean).map(d => new Date(d).getTime());

        if (dates.length === 0) return ticket.created_at;

        const maxTimestamp = Math.max(...dates);
        return new Date(maxTimestamp).toLocaleString();
    };

    return (
        <div className="ticket-page-container ticket-detail-container">
            {/* Header */}
            <div className="ticket-detail-header">
                <button onClick={() => navigate('/tickets')} className="ticket-back-btn" type="button">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="ticket-header-info">
                    <div className="ticket-header-meta">
                        <span className="ticket-id-badge">#{ticket.id}</span>
                        <span className={`status-badge status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {ticket.status}
                        </span>
                        <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>
                            {ticket.priority}
                        </span>
                    </div>
                    <h1 className="ticket-title">{ticket.title}</h1>
                </div>
            </div>

            {error && (
                <div className="ticket-error-alert">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="ticket-detail-grid">
                {/* Columna Principal */}
                <div className="ticket-main-column">
                    <div className="ticket-card description-card">
                        <h3>Descripción del Problema</h3>
                        <p className="ticket-description-text">{ticket.description}</p>
                    </div>

                    {/* Panel de Gestión y Actualización */}
                    <div className="ticket-card management-card">
                        <h3>Gestionar Ticket y Notas</h3>
                        <form onSubmit={handleUpdateSubmit} className="management-form">

                            <div className="ticket-form-row">
                                {!isClient && (
                                    <div>
                                        <label className="ticket-form-label">Cambiar Estado</label>
                                        <select
                                            value={updateData.status}
                                            onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                                            className="ticket-form-select"
                                            disabled={isClient} // <--- Deshabilitado si es cliente
                                            title={isClient ? "Los clientes no pueden cambiar el estado del ticket" : ""}
                                        >
                                            <option value="Abierto">Abierto</option>
                                            <option value="En Progreso">En Progreso</option>
                                            <option value="Resuelto">Resuelto</option>
                                            <option value="Cerrado">Cerrado</option>
                                        </select>
                                    </div>
                                )}
                                {!isClient && (
                                    <div>
                                        <label className="ticket-form-label">Reasignar Agente</label>
                                        <select
                                            value={updateData.assigned_to}
                                            onChange={(e) => setUpdateData({ ...updateData, assigned_to: e.target.value })}
                                            className="ticket-form-select"
                                            disabled={!isAdminOrSupervisor} // <--- Deshabilitado para agentes y clientes
                                            title={!isAdminOrSupervisor ? "Solo administradores y supervisores pueden reasignar tickets" : ""}
                                        >
                                            <option value="">Sin asignar (Cola general)</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>


                            <div>
                                <label className="ticket-form-label">Añadir Nota o Comentario</label>
                                <textarea
                                    rows={3}
                                    value={updateData.comment}
                                    onChange={(e) => setUpdateData({ ...updateData, comment: e.target.value })}
                                    placeholder={isClient ? "Escribe un comentario público para el equipo de soporte..." : "Escriba notas de gestión u observaciones..."}
                                    className="ticket-form-textarea"
                                />
                            </div>

                            {/* Checkbox de Nota Interna: Oculto o deshabilitado si es cliente */}
                            {!isClient && (
                                <div className="ticket-checkbox-container">
                                    <label className="ticket-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={updateData.is_internal}
                                            onChange={(e) => setUpdateData({ ...updateData, is_internal: e.target.checked })}
                                        />
                                        <span>🔒 Marcar como Nota Interna (Oculta para clientes)</span>
                                    </label>
                                </div>
                            )}

                            <div className="ticket-form-actions">
                                <button type="submit" disabled={updating} className="btn-primary ticket-btn-submit">
                                    <Send className="w-4 h-4" />
                                    <span>{updating ? 'Guardando...' : 'Registrar Gestión'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Comentarios y Notas */}
                    <div className="ticket-card activity-card">
                        <h3>Comentarios y Notas</h3>
                        <div className="activity-timeline">
                            {ticket.comments?.length === 0 ? (
                                <p className="no-activity">No hay comentarios aún.</p>
                            ) : (
                                ticket.comments?.map((comment, index) => {
                                    const isInternal = comment.is_internal;
                                    return (
                                        <div key={`comment-${comment.id || index}`} className={`timeline-item ${isInternal ? 'timeline-internal-note' : 'timeline-public-comment'}`}>
                                            <div className="timeline-badge">
                                                {isInternal ? <Shield className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-blue-400" />}
                                            </div>
                                            <div className="timeline-content">
                                                <div className="timeline-header">
                                                    <span className="timeline-author">{comment.user?.name || 'Usuario del Sistema'}</span>
                                                    <span className={`timeline-tag ${isInternal ? 'tag-internal' : 'tag-public'}`}>
                                                        {isInternal ? 'Nota Interna' : 'Comentario Público'}
                                                    </span>
                                                    <span className="timeline-date">{new Date(comment.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="timeline-text">{comment.content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Historial de Cambios del Sistema */}
                    <div className="ticket-card activity-card" style={{ marginTop: '20px' }}>
                        <h3>Historial de Cambios y Estados</h3>
                        <div className="activity-timeline">
                            {ticket.history?.length === 0 ? (
                                <p className="no-activity">No hay registros de historial.</p>
                            ) : (
                                ticket.history?.map((history, index) => (
                                    <div key={`history-${history.id || index}`} className="timeline-item timeline-history">
                                        <div className="timeline-badge history-badge">
                                            <RefreshCw className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-author text-slate-400">Cambio de Estado / Sistema</span>
                                                <span className="timeline-date">{new Date(history.created_at || history.timestamp || Date.now()).toLocaleString()}</span>
                                            </div>
                                            <p className="timeline-text history-text">{history.action_description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Lateral de Información */}
                <div className="ticket-sidebar-column">
                    <div className="ticket-card sidebar-info-card">
                        <h3>Información General</h3>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Creado por</span>
                            <span className="sidebar-value">{ticket.creator?.name || 'Desconocido'}</span>
                        </div>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Cliente Afectado</span>
                            <span className="sidebar-value">{ticket.affectedUser?.name || ticket.creator?.name || 'N/A'}</span>
                        </div>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Asignado a</span>
                            <span className="sidebar-value">{ticket.assignee?.name || 'Sin asignar (Cola general)'}</span>
                        </div>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Estado</span>
                            <span className="sidebar-value">{ticket.status || 'Abierto'}</span>
                        </div>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Área Corporativa</span>
                            <span className="sidebar-value">{ticket.area?.name || 'General'}</span>
                        </div>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Fecha de Creación</span>
                            <span className="sidebar-value">{new Date(ticket.created_at).toLocaleString()}</span>
                        </div>
                        <div className="sidebar-group">
                            <span className="sidebar-label">Fecha de Última Gestión</span>
                            <span className="sidebar-value">{getLastActivityDate()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}