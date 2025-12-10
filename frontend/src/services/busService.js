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
      request: {
        Name: tripData.tripName,
        Date: dateObj,
        Status: statusMap[tripData.status?.toLowerCase()] || statusMap.draft,
        Description: tripData.description || '',
        Direction: directionMap[tripData.direction?.toLowerCase()] || directionMap.outbound
      }
    };
    try {
      const response = await apiClient.put(`/trip/${tripData.id}`, payload);
      return response.data;
    } catch (err) {
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
    // 新增：所有日期欄位轉 UTC
    const startDateUtc = toUtcDate(tripData.startDate);
    const endDateUtc = toUtcDate(tripData.endDate);
    const payload = {
      request: {
        Name: tripData.tripName,
        Date: startDateUtc,
        Description: tripData.description || '',
        Direction: directionMap[tripData.direction?.toLowerCase()] || directionMap.outbound,
        Status: statusMap[tripData.status?.toLowerCase()] || statusMap.draft,
        StartDate: startDateUtc,
        EndDate: endDateUtc,
        DepartureLocation: tripData.departureLocation,
        Destination: tripData.destination,
        EstimatedPassengers: tripData.estimatedPassengers,
        ContactPerson: tripData.contactPerson,
        ContactPhone: tripData.contactPhone,
        TripType: tripData.tripType,
        BoardingMode: tripData.boardingMode,
        Segments: tripData.segments
      }
    };
    try {
      const response = await apiClient.post('/trip', payload);
      return response.data;
    } catch (err) {
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