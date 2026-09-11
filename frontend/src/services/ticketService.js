import api from './api';

export const ticketService = {
  // Coincide con findAll (soporta paginación y filtros opcionales)
  getAllTickets: async (page = 1, limit = 10, status = '') => {
    const params = { page, limit };
    if (status) params.status = status;
    const response = await api.get('/tickets', { params });
    return response.data; // Retorna { data, total, page, lastPage }
  },

  // Coincide con findOne(id) -> Devuelve el ticket con su historial, creador, asignado y área
  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Coincide con create(createTicketDto, userId)
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  // Coincide con update(id, updateTicketDto, userId) -> Permite cambiar estado, reasignar o añadir comentarios
  updateTicket: async (id, updateData) => {
    const response = await api.patch(`/tickets/${id}`, updateData);
    return response.data;
  }
};