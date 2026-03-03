import axios from 'axios';

const api = axios.create({
    // Pointing to API Gateway via Nginx proxy
    baseURL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // Call Backend to refresh (Direct to Auth Service)
                const response = await axios.post(
                    `${import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081'}/auth/refresh`,
                    { refresh_token: refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { access_token, refresh_token } = response.data;

                localStorage.setItem('token', access_token);
                if (refresh_token) {
                    localStorage.setItem('refresh_token', refresh_token);
                }

                // Update header and retry
                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

                return api(originalRequest);

            } catch (refreshError) {
                console.error("Token refresh failed", refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
