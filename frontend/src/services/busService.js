
import apiClient from './api.js';

export const scanService = {
  // QR 掃碼或手動輸入學號
  async scan(tripId, busId, cardNoOrToken, action = 'Auto') {
    const response = await apiClient.post('/scan', {
      tripId,
      busId,
      cardNoOrToken,
      action,
      deviceId: `web-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },
};

export const busService = {
  // 取得我負責的車輛 (領隊用)
  async getMyBuses() {
    const response = await apiClient.get('/buses/my');
    return response.data;
  },

  // 取得車輛名單
  async getBusRoster(busId) {
    const response = await apiClient.get(`/buses/${busId}/roster`);
    return response.data;
  },
};

export const tripService = {
    // 更新行程
    async updateTrip(tripData) {
      // 只傳後端需要的欄位
      // 狀態 enum 對應
      const statusMap = {
        planning: 'Planning',
        confirmed: 'Confirmed',
        in_progress: 'InProgress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      };
      // 日期轉 Date 物件
      const dateObj = tripData.startDate ? new Date(tripData.startDate) : new Date();
      const payload = {
        request: {
          Name: tripData.tripName,
          Date: dateObj,
          Status: statusMap[tripData.status] || 'Planning',
          Description: tripData.description
        }
      };
      const response = await apiClient.put(`/trip/${tripData.id}`, payload);
      return response.data;
    },
  // 取得行程列表
  async getTrips() {
    const response = await apiClient.get('/trip');
    return response.data;
  },

  // 取得行程詳細資訊
  async getTripById(id) {
    const response = await apiClient.get(`/trip/${id}`);
    return response.data;
  },

  // 建立新行程
  async createTrip(tripData) {
    // 狀態 enum 對應
    const statusMap = {
      planning: 'Planning',
      confirmed: 'Confirmed',
      in_progress: 'InProgress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    const directionMap = {
      round_trip: 'RoundTrip',
      one_way: 'OneWay'
    };
    const payload = {
      Name: tripData.tripName,
      Date: tripData.startDate,
      Description: tripData.description || '',
      Status: statusMap[tripData.status] || 'Planning',
      Direction: directionMap[tripData.direction] || 'RoundTrip'
    };
    const response = await apiClient.post('/trip', payload);
    return response.data;
  },
};

export const peopleService = {
  // 取得人員列表
  async getPeople(params = {}) {
    const response = await apiClient.get('/people', { params });
    return response.data;
  },

  // 新增人員
  async createPerson(personData) {
    const response = await apiClient.post('/people', personData);
    return response.data;
  },
  // 更新人員
  async updatePerson(id, personData) {
    const response = await apiClient.put(`/people/${id}`, personData);
    return response.data;
  },

  // 刪除(停用)人員
  async deletePerson(id) {
    const response = await apiClient.delete(`/people/${id}`);
    return response.data;
  },
};

export const reportService = {
  // 取得行程總結報表
  async getTripSummary(tripId) {
    const response = await apiClient.get(`/reports/trip-summary/${tripId}`);
    return response.data;
  },

  // 匯出行程報表
  async exportTripReport(tripId) {
    const response = await apiClient.get(`/reports/export/trip/${tripId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};