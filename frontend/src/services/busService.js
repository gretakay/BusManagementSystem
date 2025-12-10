import apiClient from './api.js';

// Helper: 統一 enum 對應，避免前後端不一致
const directionMap = {
  outbound: 1,
  inbound: 2
};
const statusMap = {
  draft: 1,
  open: 2,
  closed: 3,
  cancelled: 4,
  completed: 5
};

// Helper: 統一 UTC 時間格式
function toUtcDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}

export const scanService = {
  // QR 掃碼或手動輸入學號
  async scan(tripId, busId, cardNoOrToken, action = 'Auto') {
    try {
      const response = await apiClient.post('/scan', {
        tripId,
        busId,
        cardNoOrToken,
        action,
        deviceId: `web-${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (err) {
      // 新增：統一錯誤處理
      throw new Error('掃碼失敗，請稍後再試');
    }
  },
};

export const busService = {
  // 取得我負責的車輛 (領隊用)
  async getMyBuses() {
    try {
      const response = await apiClient.get('/buses/my');
      return response.data;
    } catch (err) {
      throw new Error('取得車輛失敗');
    }
  },

  // 取得車輛名單
  async getBusRoster(busId) {
    try {
      const response = await apiClient.get(`/buses/${busId}/roster`);
      return response.data;
    } catch (err) {
      throw new Error('取得車輛名單失敗');
    }
  },
};

export const tripService = {
  // 更新行程
  async updateTrip(tripData) {
    // 新增：所有日期欄位轉 UTC，避免時區誤差
    const dateObj = toUtcDate(tripData.startDate);
    const payload = {
      Name: tripData.tripName,
      Date: dateObj,
      Status: statusMap[tripData.status?.toLowerCase()] || statusMap.draft,
      Description: tripData.description || ''
    };
    console.log('UpdateTrip payload:', payload);
    try {
      const response = await apiClient.put(`/trip/${tripData.id}`, payload);
      return response.data;
    } catch (err) {
      console.error('UpdateTrip error:', err.response?.data || err);
      throw new Error('更新行程失敗');
    }
  },

  // 取得行程列表
  async getTrips() {
    try {
      const response = await apiClient.get('/trip');
      return response.data;
    } catch (err) {
      throw new Error('取得行程列表失敗');
    }
  },

  // 取得行程詳細資訊
  async getTripById(id) {
    try {
      const response = await apiClient.get(`/trip/${id}`);
      return response.data;
    } catch (err) {
      throw new Error('取得行程詳細資訊失敗');
    }
  },

  // 建立新行程
  async createTrip(tripData) {
    console.log('createTrip received:', tripData);
    
    if (!tripData.tripName || tripData.tripName.trim() === '') {
      throw new Error('行程名稱為必填');
    }
    
    // 新增：所有日期欄位轉 UTC
    const dateUtc = toUtcDate(tripData.startDate);
    const payload = {
      Name: tripData.tripName.trim(),
      Date: dateUtc || new Date().toISOString(),
      Direction: directionMap[tripData.direction?.toLowerCase()] || directionMap.outbound,
      Description: tripData.description || ''
    };
    console.log('API payload to send:', JSON.stringify(payload, null, 2));
    try {
      const response = await apiClient.post('/trip', payload);
      console.log('API response:', response.data);
      return response.data;
    } catch (err) {
      console.error('API error:', err.response?.data || err);
      throw new Error('建立行程失敗');
    }
  },
};

export const peopleService = {
  // 取得人員列表
  async getPeople(params = {}) {
    try {
      const response = await apiClient.get('/people', { params });
      return response.data;
    } catch (err) {
      throw new Error('取得人員列表失敗');
    }
  },

  // 新增人員
  async createPerson(personData) {
    try {
      const response = await apiClient.post('/people', personData);
      return response.data;
    } catch (err) {
      throw new Error('新增人員失敗');
    }
  },
  // 更新人員
  async updatePerson(id, personData) {
    try {
      const response = await apiClient.put(`/people/${id}`, personData);
      return response.data;
    } catch (err) {
      throw new Error('更新人員失敗');
    }
  },

  // 刪除(停用)人員
  async deletePerson(id) {
    try {
      const response = await apiClient.delete(`/people/${id}`);
      return response.data;
    } catch (err) {
      throw new Error('刪除人員失敗');
    }
  },
};

export const reportService = {
  // 取得行程總結報表
  async getTripSummary(tripId) {
    try {
      const response = await apiClient.get(`/reports/trip-summary/${tripId}`);
      return response.data;
    } catch (err) {
      throw new Error('取得行程報表失敗');
    }
  },

  // 匯出行程報表
  async exportTripReport(tripId) {
    try {
      const response = await apiClient.get(`/reports/export/trip/${tripId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (err) {
      throw new Error('匯出行程報表失敗');
    }
  },
};

// 站點管理服務
export const stationService = {
  // 取得所有站點
  async getAllStations() {
    try {
      const response = await apiClient.get('/station');
      return response.data;
    } catch (err) {
      throw new Error('取得站點清單失敗');
    }
  },
  
  // 建立新站點
  async createStation(stationData) {
    try {
      const response = await apiClient.post('/station', stationData);
      return response.data;
    } catch (err) {
      throw new Error('建立站點失敗');
    }
  },
  
  // 更新站點
  async updateStation(id, stationData) {
    try {
      const response = await apiClient.put(`/station/${id}`, stationData);
      return response.data;
    } catch (err) {
      throw new Error('更新站點失敗');
    }
  },
  
  // 刪除站點
  async deleteStation(id) {
    try {
      await apiClient.delete(`/station/${id}`);
    } catch (err) {
      throw new Error('刪除站點失敗');
    }
  },
};