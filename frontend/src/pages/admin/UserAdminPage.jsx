import React, { useState, useEffect } from 'react';
import { Users, Shield, Mail, Layers, Plus, ArrowUpRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // O tu cliente axios configurado
import '../../css/ticket-list.css'; // Reutilizamos los mismos estilos base

export default function UserAdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Ajusta la ruta según tu endpoint en NestJS (ej: /users o /admin/users)
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeClass = (roleName) => {
        switch (roleName) {
            case 'Administrador': return 'badge-critico';
            case 'Supervisor': return 'badge-progreso';
            case 'Agente': return 'badge-resuelto';
            default: return 'badge-baja';
        }
    };

    return (
        <div className="ticket-page-container">
            {/* Header */}
            <div className="ticket-header">
                <div>
                    <h1 className="ticket-title">Administración de Usuarios</h1>
                    <p className="ticket-subtitle">Control de roles, accesos y áreas corporativas asignadas al personal.</p>
                </div>
                {/* <button className="btn-primary" onClick={() => navigate('/admin/users/new')}>
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Usuario</span>
                </button> */}
            </div>

            {/* Búsqueda */}
            <div className="filters-bar">
                <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
                    <Search className="w-4 h-4 search-icon-pos" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="table-container">
                <div className="table-scroll-wrapper">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Usuario / ID</th>
                                <th>Correo Electrónico</th>
                                <th>Rol del Sistema</th>
                                <th>Áreas Asignadas</th>
                                <th>Fecha de Alt</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="table-empty-state">
                                        Cargando directorio de usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="table-empty-state">
                                        No se encontraron usuarios registrados.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="table-cell-id-title">
                                                <span className="ticket-id-badge">#{user.id}</span>
                                                <span className="ticket-title-text">{user.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-cell-main" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(user.role?.name)}`}>
                                                {user.role?.name || 'Sin Rol'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="table-area-text">
                                                {user.areas?.map(a => a.name).join(', ') || 'Sin áreas asignadas'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="ticket-subtext">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        {/* <td className="text-right">
                                            <button
                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                                className="action-icon-btn"
                                                title="Editar usuario"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </td> */}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}