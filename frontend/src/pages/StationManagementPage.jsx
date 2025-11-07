import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const StationManagementPage = () => {
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'pickup',
    description: '',
    coordinates: { lat: '', lng: '' },
    contactPerson: '',
    contactPhone: '',
    operatingHours: '',
    capacity: '',
    facilities: []
  });

  const stationTypes = [
    { value: 'pickup', label: '上車點', icon: '🚌', color: 'bg-green-100 text-green-800' },
    { value: 'dropoff', label: '下車點', icon: '🏁', color: 'bg-blue-100 text-blue-800' },
    { value: 'transfer', label: '轉乘點', icon: '🔄', color: 'bg-purple-100 text-purple-800' },
    { value: 'attraction', label: '景點', icon: '🎯', color: 'bg-orange-100 text-orange-800' },
    { value: 'hotel', label: '飯店', icon: '🏨', color: 'bg-pink-100 text-pink-800' },
    { value: 'airport', label: '機場', icon: '✈️', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'station', label: '車站', icon: '🚄', color: 'bg-gray-100 text-gray-800' }
  ];

  const facilities = [
    { value: 'parking', label: '停車場', icon: '🅿️' },
    { value: 'restroom', label: '洗手間', icon: '🚻' },
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'restaurant', label: '餐廳', icon: '🍽️' },
    { value: 'shop', label: '商店', icon: '🛒' },
    { value: 'atm', label: 'ATM', icon: '🏧' },
    { value: 'elevator', label: '電梯', icon: '🛗' },
    { value: 'escalator', label: '手扶梯', icon: '🛗' }
  ];

  // 範例站點資料
  const mockStations = [
    {
      id: 1,
      name: '台北車站',
      address: '台北市中正區北平西路3號',
      type: 'station',
      description: '台北主要交通樞紐，連接高鐵、台鐵、捷運',
      coordinates: { lat: '25.0478', lng: '121.5170' },
      contactPerson: '站務人員',
      contactPhone: '02-2371-3558',
      operatingHours: '05:00-24:00',
      capacity: '200',
      facilities: ['parking', 'restroom', 'wifi', 'restaurant', 'shop', 'atm'],
      usageCount: 25,
      lastUsed: '2025-11-07',
      createdAt: '2025-10-01T10:00:00',
      status: 'active'
    },
    {
      id: 2,
      name: '松山機場',
      address: '台北市松山區敦化北路340-9號',
      type: 'airport',
      description: '台北松山機場，主要服務國內航線',
      coordinates: { lat: '25.0697', lng: '121.5524' },
      contactPerson: '機場服務台',
      contactPhone: '02-8770-3460',
      operatingHours: '06:00-23:00',
      capacity: '150',
      facilities: ['parking', 'restroom', 'wifi', 'restaurant', 'shop'],
      usageCount: 18,
      lastUsed: '2025-11-05',
      createdAt: '2025-10-01T10:00:00',
      status: 'active'
    },
    {
      id: 3,
      name: '桃園機場第一航廈',
      address: '桃園市大園區航站南路9號',
      type: 'airport',
      description: '桃園國際機場第一航廈',
      coordinates: { lat: '25.0777', lng: '121.2328' },
      contactPerson: '航廈服務台',
      contactPhone: '03-398-2194',
      operatingHours: '24小時',
      capacity: '300',
      facilities: ['parking', 'restroom', 'wifi', 'restaurant', 'shop', 'atm', 'elevator'],
      usageCount: 32,
      lastUsed: '2025-11-06',
      createdAt: '2025-10-01T10:00:00',
      status: 'active'
    },
    {
      id: 4,
      name: '西門町',
      address: '台北市萬華區峨嵋街',
      type: 'attraction',
      description: '台北知名商圈和觀光景點',
      coordinates: { lat: '25.0419', lng: '121.5069' },
      contactPerson: '',
      contactPhone: '',
      operatingHours: '全天開放',
      capacity: '50',
      facilities: ['restroom', 'wifi', 'restaurant', 'shop'],
      usageCount: 15,
      lastUsed: '2025-11-04',
      createdAt: '2025-10-01T10:00:00',
      status: 'active'
    },
    {
      id: 5,
      name: '九份老街',
      address: '新北市瑞芳區基山街',
      type: 'attraction',
      description: '知名觀光景點，山城老街',
      coordinates: { lat: '25.1097', lng: '121.8449' },
      contactPerson: '遊客中心',
      contactPhone: '02-2406-3270',
      operatingHours: '09:00-21:00',
      capacity: '30',
      facilities: ['restroom', 'restaurant', 'shop'],
      usageCount: 12,
      lastUsed: '2025-11-03',
      createdAt: '2025-10-01T10:00:00',
      status: 'active'
    },
    {
      id: 6,
      name: '陽明山國家公園',
      address: '台北市北投區竹子湖路',
      type: 'attraction',
      description: '陽明山主要景點，自然生態豐富',
      coordinates: { lat: '25.1803', lng: '121.5598' },
      contactPerson: '遊客中心',
      contactPhone: '02-2861-3601',
      operatingHours: '08:30-16:30',
      capacity: '80',
      facilities: ['parking', 'restroom', 'restaurant'],
      usageCount: 20,
      lastUsed: '2025-11-07',
      createdAt: '2025-10-01T10:00:00',
      status: 'active'
    }
  ];

  useEffect(() => {
    setStations(mockStations);
    setFilteredStations(mockStations);
  }, []);

  useEffect(() => {
    let filtered = stations.filter(station =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterType !== 'all') {
      filtered = filtered.filter(station => station.type === filterType);
    }

    setFilteredStations(filtered);
  }, [searchTerm, filterType, stations]);

  const handleCreateStation = (e) => {
    e.preventDefault();
    const newStation = {
      id: stations.length + 1,
      ...formData,
      usageCount: 0,
      lastUsed: null,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    setStations(prev => [newStation, ...prev]);
    resetForm();
    setShowCreateForm(false);
  };

  const handleEditStation = (station) => {
    setEditingStation(station.id);
    setFormData({
      name: station.name,
      address: station.address,
      type: station.type,
      description: station.description,
      coordinates: station.coordinates,
      contactPerson: station.contactPerson || '',
      contactPhone: station.contactPhone || '',
      operatingHours: station.operatingHours || '',
      capacity: station.capacity || '',
      facilities: station.facilities || []
    });
    setShowCreateForm(true);
  };

  const handleUpdateStation = (e) => {
    e.preventDefault();
    setStations(prev => prev.map(station =>
      station.id === editingStation
        ? { ...station, ...formData }
        : station
    ));
    resetForm();
    setShowCreateForm(false);
    setEditingStation(null);
  };

  const handleDeleteStation = (stationId) => {
    if (window.confirm('確定要刪除這個站點嗎？')) {
      setStations(prev => prev.filter(station => station.id !== stationId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      type: 'pickup',
      description: '',
      coordinates: { lat: '', lng: '' },
      contactPerson: '',
      contactPhone: '',
      operatingHours: '',
      capacity: '',
      facilities: []
    });
  };

  const getStationTypeDisplay = (type) => {
    const typeConfig = stationTypes.find(t => t.value === type);
    return typeConfig || { label: type, icon: '📍', color: 'bg-gray-100 text-gray-800' };
  };

  const getFacilityDisplay = (facilityValue) => {
    const facility = facilities.find(f => f.value === facilityValue);
    return facility || { label: facilityValue, icon: '📍' };
  };

  const toggleFacility = (facilityValue) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facilityValue)
        ? prev.facilities.filter(f => f !== facilityValue)
        : [...prev.facilities, facilityValue]
    }));
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                站點管理
              </h1>
              <p className="text-gray-600">管理常用站點資訊，建立標準化的上下車地點</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新增站點
            </Button>
          </div>
        </div>

        {/* 站點統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{stations.length}</div>
            <div className="text-sm text-gray-600">總站點</div>
          </div>
          {stationTypes.map((type) => {
            const count = stations.filter(s => s.type === type.value).length;
            return (
              <div key={type.value} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{type.label}</div>
              </div>
            );
          })}
        </div>

        {/* 搜尋和篩選 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="搜尋站點名稱、地址或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">所有類型</option>
                {stationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 新增/編輯站點表單 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingStation ? '編輯站點' : '新增站點'}
            </h2>
            <form onSubmit={editingStation ? handleUpdateStation : handleCreateStation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="站點名稱"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例：台北車站"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">站點類型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {stationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="地址"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="完整地址"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="聯絡人"
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="站點聯絡人"
                />
                
                <Input
                  label="聯絡電話"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="02-1234-5678"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="營業時間"
                  type="text"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, operatingHours: e.target.value }))}
                  placeholder="例：24小時 或 09:00-18:00"
                />
                
                <Input
                  label="車輛容量"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="可停靠車輛數"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">設施服務</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {facilities.map((facility) => (
                    <label key={facility.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility.value)}
                        onChange={() => toggleFacility(facility.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm flex items-center">
                        <span className="mr-1">{facility.icon}</span>
                        {facility.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="站點描述或特殊注意事項..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingStation(null);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                  {editingStation ? '更新站點' : '新增站點'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 站點列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            站點列表 ({filteredStations.length} 個站點)
          </h2>
          <div className="space-y-4">
            {filteredStations.map((station) => {
              const typeDisplay = getStationTypeDisplay(station.type);
              
              return (
                <div key={station.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{typeDisplay.icon}</span>
                        <h3 className="text-lg font-bold text-gray-900">{station.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${typeDisplay.color}`}>
                          {typeDisplay.label}
                        </span>
                        {station.usageCount > 0 && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            使用 {station.usageCount} 次
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">地址：</span>{station.address}
                        </div>
                        {station.contactPhone && (
                          <div>
                            <span className="font-medium">電話：</span>{station.contactPhone}
                          </div>
                        )}
                        {station.operatingHours && (
                          <div>
                            <span className="font-medium">營業時間：</span>{station.operatingHours}
                          </div>
                        )}
                      </div>

                      {station.description && (
                        <div className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">描述：</span>{station.description}
                        </div>
                      )}

                      {station.facilities && station.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {station.facilities.map((facilityValue) => {
                            const facility = getFacilityDisplay(facilityValue);
                            return (
                              <span key={facilityValue} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                <span className="mr-1">{facility.icon}</span>
                                {facility.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {station.lastUsed && (
                          <div>最後使用：{new Date(station.lastUsed).toLocaleDateString('zh-TW')}</div>
                        )}
                        <div>建立時間：{new Date(station.createdAt).toLocaleDateString('zh-TW')}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStation(station)}
                      >
                        編輯
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStation(station.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        刪除
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              沒有找到符合條件的站點
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StationManagementPage;