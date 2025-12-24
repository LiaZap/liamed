import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://liamed-api.leyiy3.easypanel.host',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptador para adicionar o token em cada requisição
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('medipro-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptador para tratar erros (ex: token expirado)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('medipro-token');
            // Opcional: Redirecionar para login ou disparar evento
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
