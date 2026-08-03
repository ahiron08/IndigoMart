import api from './api.js';

export const logout = () => api.post('/auth/logout');