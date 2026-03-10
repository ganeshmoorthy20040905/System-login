import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001',
    withCredentials: true // send cookies
});

let inMemoryToken = null;

export const setAccessToken = (token) => {
    inMemoryToken = token;
};

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        if (inMemoryToken) {
            config.headers.Authorization = `Bearer ${inMemoryToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post('http://localhost:5001/auth/refresh', {}, { withCredentials: true });
                setAccessToken(data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                setAccessToken(null);
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
