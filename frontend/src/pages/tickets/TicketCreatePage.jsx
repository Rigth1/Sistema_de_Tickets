import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, AlertCircle } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import '../../css/ticket-create.css';

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campos del formulario principal
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Media',
    area_id: '',
    affected_user: '', 
    assigned_to: '', 
  });

  // Estados visuales para los inputs con autocompletado integrado
  const [clientInputText, setClientInputText] = useState('');
  const [agentInputText, setAgentInputText] = useState('');

  const isAdminOrSupervisor = ['Administrador', 'Supervisor'].includes(currentUser?.role);
  const isAgent = currentUser?.role === 'Agente';

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const areasData = await ticketService.getAreas();
        setAreas(areasData);
      } catch (err) {
        console.error('Error al cargar áreas:', err);
        setError('No se pudieron cargar las áreas corporativas.');
      }

      try {
        const usersData = await ticketService.getUsers();
        setUsers(usersData);
      } catch (err) {
        console.warn('El usuario actual no tiene permisos para listar usuarios (403).');
      }
    };
    loadDependencies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('El título del ticket es obligatorio.');
      return;
    }
    if (!formData.area_id) {
      setError('Debe seleccionar un área corporativa.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        area_id: Number(formData.area_id),
        affected_user: formData.affected_user !== '' ? Number(formData.affected_user) : undefined,
        assigned_to: formData.assigned_to !== '' ? Number(formData.assigned_to) : null,
      };

      await ticketService.createTicket(payload);
      navigate('/tickets'); 
    } catch (err) {
      console.error('Error al crear el ticket:', err);
      setError(err.response?.data?.message || 'Ocurrió un error al registrar el ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-page-container ticket-create-container">
      
      {/* Header con botón de retorno */}
      <div className="ticket-create-header">
        <button 
          onClick={() => navigate('/tickets')}
          className="ticket-back-btn"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="ticket-title">Crear Nueva Solicitud</h1>
          <p className="ticket-subtitle">Registre un nuevo ticket de soporte y asígnele los parámetros iniciales.</p>
        </div>
      </div>

      {error && (
        <div className="ticket-error-alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="ticket-form">
        
        {/* Título */}
        <div>
          <label className="ticket-form-label">
            Título del Ticket <span className="ticket-required">*</span>
          </label>
          <input 
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ej. Error al sincronizar pasarela de pagos"
            className="ticket-form-input"
          />
        </div>

        {/* Grid de Área y Prioridad */}
        <div className="ticket-form-row">
          <div>
            <label className="ticket-form-label">
              Área / Cola <span className="ticket-required">*</span>
            </label>
            <select 
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              className="ticket-form-select"
            >
              <option value="">Seleccione un área...</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="ticket-form-label">
              Prioridad
            </label>
            <select 
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="ticket-form-select"
            >
              <option value="Bajo">Bajo</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
              <option value="Critico">Crítico</option>
            </select>
          </div>
        </div>

        {/* Grid de Cliente Afectado y Asignar a Agente con Datalist Integrado */}
        <div className="ticket-form-row">
          
          {/* 1. CAMPO: Cliente Afectado */}
          {(isAdminOrSupervisor || isAgent) && (
            <div className="form-group">
              <label className="ticket-form-label">
                Cliente Afectado (Opcional)
              </label>
              <input
                type="text"
                list="clients-list"
                value={clientInputText}
                placeholder="Yo mismo o filtrar por nombre/email..."
                onChange={(e) => {
                  const val = e.target.value;
                  setClientInputText(val);
                  if (!val || val.includes('Yo mismo')) {
                    setFormData(prev => ({ ...prev, affected_user: '' }));
                  } else {
                    const found = users.find(u => `${u.name} (${u.email})` === val || u.name === val || u.email === val);
                    setFormData(prev => ({ ...prev, affected_user: found ? found.id : '' }));
                  }
                }}
                className="ticket-form-input"
              />
              <datalist id="clients-list">
                <option value="Yo mismo (Usuario logueado)" />
                {users.map(client => (
                  <option key={client.id} value={`${client.name} (${client.email})`} />
                ))}
              </datalist>
              <span className="ticket-form-help">Escriba para filtrar o seleccione de la lista.</span>
            </div>
          )}

          {/* 2. CAMPO: Asignar a Agente */}
          {isAdminOrSupervisor && (
            <div className="form-group">
              <label className="ticket-form-label">
                Asignar a Agente (Opcional)
              </label>
              <input
                type="text"
                list="agents-list"
                value={agentInputText}
                placeholder="Sin asignar o filtrar agente..."
                onChange={(e) => {
                  const val = e.target.value;
                  setAgentInputText(val);
                  if (!val || val.includes('Sin asignar')) {
                    setFormData(prev => ({ ...prev, assigned_to: '' }));
                  } else {
                    const found = users.find(a => `${a.name} - ${a.email}` === val || a.name === val || a.email === val);
                    setFormData(prev => ({ ...prev, assigned_to: found ? found.id : '' }));
                  }
                }}
                className="ticket-form-input"
              />
              <datalist id="agents-list">
                <option value="Sin asignar (Dejar en cola general)" />
                {users.map(agent => (
                  <option key={agent.id} value={`${agent.name} - ${agent.email}`} />
                ))}
              </datalist>
            </div>
          )}

        </div>

        {/* Descripción */}
        <div>
          <label className="ticket-form-label">
            Descripción detallada del problema
          </label>
          <textarea 
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Proporcione contexto técnico, pasos para reproducir o detalles relevantes..."
            className="ticket-form-textarea"
          />
        </div>

        {/* Botones de acción */}
        <div className="ticket-form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/tickets')}
            className="ticket-btn-cancel"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary ticket-btn-submit"
            style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            <PlusCircle className="w-5 h-5" />
            <span>{loading ? 'Guardando...' : 'Crear Ticket'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}