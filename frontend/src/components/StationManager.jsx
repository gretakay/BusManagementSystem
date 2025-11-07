import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const StationManager = ({ onStationSelect, selectedStations = [], mode = 'single' }) => {
  const [stations, setStations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStation, setNewStation] = useState({
    name: '',
    address: '',
    type: 'pickup',
    description: '',
    coordinates: { lat: '', lng: '' }
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

  // 常用站點的範例資料
  const mockStations = [
    {
      id: 1,
      name: '台北車站',
      address: '台北市中正區北平西路3號',
      type: 'station',
      description: '台北主要交通樞紐',
      coordinates: { lat: '25.0478', lng: '121.5170' },
      usageCount: 25
    },
    {
      id: 2,
      name: '松山機場',
      address: '台北市松山區敦化北路340-9號',
      type: 'airport',
      description: '台北松山機場',
      coordinates: { lat: '25.0697', lng: '121.5524' },
      usageCount: 18
    },
    {
      id: 3,
      name: '桃園機場第一航廈',
      address: '桃園市大園區航站南路9號',
      type: 'airport',
      description: '桃園國際機場第一航廈',
      coordinates: { lat: '25.0777', lng: '121.2328' },
      usageCount: 32
    },
    {
      id: 4,
      name: '西門町',
      address: '台北市萬華區峨嵋街',
      type: 'attraction',
      description: '台北知名商圈',
      coordinates: { lat: '25.0419', lng: '121.5069' },
      usageCount: 15
    },
    {
      id: 5,
      name: '九份老街',
      address: '新北市瑞芳區基山街',
      type: 'attraction',
      description: '知名觀光景點',
      coordinates: { lat: '25.1097', lng: '121.8449' },
      usageCount: 12
    },
    {
      id: 6,
      name: '陽明山國家公園',
      address: '台北市北投區竹子湖路',
      type: 'attraction',
      description: '陽明山主要景點',
      coordinates: { lat: '25.1803', lng: '121.5598' },
      usageCount: 20
    },
    {
      id: 7,
      name: '台北101',
      address: '台北市信義區信義路五段7號',
      type: 'attraction',
      description: '台北地標建築',
      coordinates: { lat: '25.0338', lng: '121.5645' },
      usageCount: 28
    },
    {
      id: 8,
      name: '花蓮火車站',
      address: '花蓮縣花蓮市國聯一路100號',
      type: 'station',
      description: '花蓮主要車站',
      coordinates: { lat: '23.9927', lng: '121.6014' },
      usageCount: 8
    }
  ];

  useEffect(() => {
    setStations(mockStations);
  }, []);

  const handleAddStation = (e) => {
    e.preventDefault();
    const station = {
      id: stations.length + 1,
      ...newStation,
      usageCount: 0
    };
    setStations(prev => [station, ...prev]);
    setShowAddForm(false);
    setNewStation({
      name: '',
      address: '',
      type: 'pickup',
      description: '',
      coordinates: { lat: '', lng: '' }
    });
  };

  const getStationTypeDisplay = (type) => {
    const typeConfig = stationTypes.find(t => t.value === type);
    return typeConfig || { label: type, icon: '📍', color: 'bg-gray-100 text-gray-800' };
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isStationSelected = (stationId) => {
    return selectedStations.some(s => s.id === stationId);
  };

  const handleStationClick = (station) => {
    if (mode === 'single') {
      onStationSelect(station);
    } else {
      // 多選模式
      if (isStationSelected(station.id)) {
        // 移除已選擇的站點
        const updatedStations = selectedStations.filter(s => s.id !== station.id);
        onStationSelect(updatedStations);
      } else {
        // 添加新站點
        onStationSelect([...selectedStations, station]);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜尋和新增 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="搜尋站點名稱或地址..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增站點
        </Button>
      </div>

      {/* 已選擇的站點（多選模式） */}
      {mode === 'multiple' && selectedStations.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">
            已選擇 {selectedStations.length} 個站點：
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedStations.map((station, index) => (
              <span key={station.id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {index + 1}. {station.name}
                <button
                  type="button"
                  onClick={() => handleStationClick(station)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 新增站點表單 */}
      {showAddForm && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">新增常用站點</h4>
          <form onSubmit={handleAddStation} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="站點名稱"
                type="text"
                value={newStation.name}
                onChange={(e) => setNewStation(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例：台北車站"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">站點類型</label>
                <select
                  value={newStation.type}
                  onChange={(e) => setNewStation(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              value={newStation.address}
              onChange={(e) => setNewStation(prev => ({ ...prev, address: e.target.value }))}
              placeholder="完整地址"
              required
            />

            <Input
              label="描述"
              type="text"
              value={newStation.description}
              onChange={(e) => setNewStation(prev => ({ ...prev, description: e.target.value }))}
              placeholder="站點描述或備註"
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                取消
              </Button>
              <Button type="submit" size="sm">
                新增站點
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 站點列表 */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredStations.map((station) => {
          const typeDisplay = getStationTypeDisplay(station.type);
          const isSelected = isStationSelected(station.id);
          
          return (
            <div
              key={station.id}
              onClick={() => handleStationClick(station)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{typeDisplay.icon}</span>
                    <span className="font-medium text-gray-900">{station.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${typeDisplay.color}`}>
                      {typeDisplay.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{station.address}</div>
                  {station.description && (
                    <div className="text-sm text-gray-500">{station.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">使用 {station.usageCount} 次</div>
                  {isSelected && (
                    <div className="text-xs text-blue-600 font-medium mt-1">✓ 已選擇</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          沒有找到符合的站點
        </div>
      )}
    </div>
  );
};

export default StationManager;