import apiClient from './api.js';

export const authService = {
  // 登入
  async login(userIdentifier, password = null) {
    const loginData = {
      UserIdentifier: userIdentifier, // 注意：後端期望大寫開頭
    };
    
    // 只有在提供密碼時才添加密碼欄位
    if (password) {
      loginData.Password = password; // 注意：後端期望大寫開頭
    }
    
    const response = await apiClient.post('/auth/login', loginData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // 登出
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 取得當前用戶
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 檢查是否已登入
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // 檢查用戶權限
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  },

  // 刷新 Token
  async refreshToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await apiClient.post('/auth/refresh', { token });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data.token;
      }
    } catch (error) {
      this.logout();
      throw error;
    }
  },
};