import axios from 'axios';

// 配置 API 基礎 URL
const isProduction = import.meta.env.PROD;
const isGitHubPages = window.location.hostname === 'gretakay.github.io';

let API_BASE_URL;
if (isGitHubPages || isProduction) {
  // 生產環境或 GitHub Pages，優先使用環境變數
  API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-server.com';
} else {
  // 開發環境，使用環境變數或預設值
  API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5095';
}

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 自動添加 JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理 401 錯誤
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期，清除本地存儲並跳轉到登入頁
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;