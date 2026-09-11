import api from './api';

export const authService = {
  login: async (email, password) => {
    // Apunta al endpoint de autenticación del backend
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};