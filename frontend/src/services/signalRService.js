import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  // 初始化 SignalR 連線
  async initialize() {
    // 使用與 API 相同的配置邏輯
    const isProduction = import.meta.env.PROD;
    const isGitHubPages = window.location.hostname === 'gretakay.github.io';
    
    let API_BASE_URL;
    if (isGitHubPages || isProduction) {
      // 生產環境或 GitHub Pages，使用 Render API
      API_BASE_URL = 'https://busmanagementsystem-mbi4.onrender.com';
    } else {
      // 開發環境，使用環境變數或預設值
      API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5095';
    }
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/boarding`, {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect()
      .build();

    // 連線事件
    this.connection.onreconnecting(() => {
      console.log('SignalR 重新連線中...');
      this.isConnected = false;
    });

    this.connection.onreconnected(() => {
      console.log('SignalR 重新連線成功');
      this.isConnected = true;
    });

    this.connection.onclose(() => {
      console.log('SignalR 連線關閉');
      this.isConnected = false;
    });

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log('SignalR 連線成功');
    } catch (error) {
      console.error('SignalR 連線失敗:', error);
    }
  }

  // 加入車輛群組
  async joinBusGroup(busId) {
    if (this.isConnected && this.connection) {
      try {
        await this.connection.invoke('JoinBusGroup', busId);
        console.log(`已加入車輛 ${busId} 的群組`);
      } catch (error) {
        console.error('加入車輛群組失敗:', error);
      }
    }
  }

  // 離開車輛群組
  async leaveBusGroup(busId) {
    if (this.isConnected && this.connection) {
      try {
        await this.connection.invoke('LeaveBusGroup', busId);
        console.log(`已離開車輛 ${busId} 的群組`);
      } catch (error) {
        console.error('離開車輛群組失敗:', error);
      }
    }
  }

  // 監聽上車通知
  onPersonBoarded(callback) {
    if (this.connection) {
      this.connection.on('PersonBoarded', callback);
    }
  }

  // 監聽下車通知
  onPersonUnboarded(callback) {
    if (this.connection) {
      this.connection.on('PersonUnboarded', callback);
    }
  }

  // 監聽車輛人數更新
  onBusCountUpdated(callback) {
    if (this.connection) {
      this.connection.on('BusCountUpdated', callback);
    }
  }

  // 移除所有監聽器
  removeAllListeners() {
    if (this.connection) {
      this.connection.off('PersonBoarded');
      this.connection.off('PersonUnboarded');
      this.connection.off('BusCountUpdated');
    }
  }

  // 斷開連線
  async disconnect() {
    if (this.connection) {
      this.removeAllListeners();
      await this.connection.stop();
      this.isConnected = false;
    }
  }
}

// 單例模式
export const signalRService = new SignalRService();