import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const TripManagementPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    tripName: '',
    startDate: '',
    endDate: '',
    departureLocation: '',
    destination: '',
    estimatedPassengers: 40,
    description: '',
    contactPerson: '',
    contactPhone: '',
    status: 'planning'
  });

  const statusOptions = [
    { value: 'planning', label: '規劃中', color: 'bg-yellow-100 text-yellow-800', icon: '📋' },
    { value: 'confirmed', label: '已確認', color: 'bg-blue-100 text-blue-800', icon: '✅' },
    { value: 'in_progress', label: '進行中', color: 'bg-green-100 text-green-800', icon: '🚌' },
    { value: 'completed', label: '已完成', color: 'bg-gray-100 text-gray-800', icon: '🏁' },
    { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-800', icon: '❌' }
  ];

  const mockTrips = [
    {
      id: 1,
      tripName: '台北陽明山一日遊',
      startDate: '2025-11-15',
      endDate: '2025-11-15',
      departureLocation: '台北車站',
      destination: '陽明山國家公園',
      estimatedPassengers: 42,
      actualPassengers: 38,
      description: '陽明山賞花一日遊，包含竹子湖海芋季',
      contactPerson: '王小明',
      contactPhone: '0912-345-678',
      status: 'confirmed',
      createdAt: '2025-11-01T10:00:00',
      vehiclesAssigned: 1,
      leadersAssigned: 1
    },
    {
      id: 2,
      tripName: '九份老街文化之旅',
      startDate: '2025-11-20',
      endDate: '2025-11-21',
      departureLocation: '松山機場',
      destination: '九份老街',
      estimatedPassengers: 25,
      actualPassengers: 0,
      description: '兩天一夜九份老街深度文化體驗',
      contactPerson: '李美華',
      contactPhone: '0923-456-789',
      status: 'planning',
      createdAt: '2025-11-05T14:30:00',
      vehiclesAssigned: 0,
      leadersAssigned: 0
    },
    {
      id: 3,
      tripName: '花蓮太魯閣三日遊',
      startDate: '2025-11-25',
      endDate: '2025-11-27',
      departureLocation: '台北車站',
      destination: '花蓮太魯閣',
      estimatedPassengers: 60,
      actualPassengers: 56,
      description: '花蓮太魯閣國家公園三日深度遊',
      contactPerson: '陳大雄',
      contactPhone: '0934-567-890',
      status: 'in_progress',
      createdAt: '2025-10-28T09:15:00',
      vehiclesAssigned: 2,
      leadersAssigned: 2
    }
  ];

  useEffect(() => {
    setTrips(mockTrips);
  }, []);

  const handleCreateTrip = (e) => {
    e.preventDefault();
    // TODO: 實際的 API 呼叫
    const newTrip = {
      id: trips.length + 1,
      ...formData,
      actualPassengers: 0,
      createdAt: new Date().toISOString(),
      vehiclesAssigned: 0,
      leadersAssigned: 0
    };
    setTrips(prev => [newTrip, ...prev]);
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tripName: '',
      startDate: '',
      endDate: '',
      departureLocation: '',
      destination: '',
      estimatedPassengers: 40,
      description: '',
      contactPerson: '',
      contactPhone: '',
      status: 'planning'
    });
  };

  const getStatusDisplay = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig || { label: status, color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  const getDaysCount = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getProgressStats = (trip) => {
    const total = 4; // 總步驟：建立行程 → 車輛安排 → 領隊指派 → 人員分配
    let completed = 1; // 已建立行程
    
    if (trip.vehiclesAssigned > 0) completed++;
    if (trip.leadersAssigned > 0) completed++;
    if (trip.actualPassengers > 0) completed++;
    
    return { completed, total, percentage: (completed / total) * 100 };
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
                行程管理
              </h1>
              <p className="text-gray-600">建立和管理旅遊行程，追蹤執行進度</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新增行程
            </Button>
          </div>
        </div>

        {/* 行程統計 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statusOptions.map((status) => {
            const count = trips.filter(t => t.status === status.value).length;
            return (
              <div key={status.value} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                <div className="text-xl mb-1">{status.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{status.label}</div>
              </div>
            );
          })}
        </div>

        {/* 新增行程表單 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新增行程</h2>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="行程名稱"
                  type="text"
                  value={formData.tripName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripName: e.target.value }))}
                  placeholder="例：台北陽明山一日遊"
                  required
                />
                
                <Input
                  label="預估人數"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.estimatedPassengers}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedPassengers: parseInt(e.target.value) }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="開始日期"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
                
                <Input
                  label="結束日期"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="出發地點"
                  type="text"
                  value={formData.departureLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureLocation: e.target.value }))}
                  placeholder="例：台北車站"
                  required
                />
                
                <Input
                  label="目的地"
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="例：陽明山國家公園"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="聯絡人"
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="負責人姓名"
                  required
                />
                
                <Input
                  label="聯絡電話"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="0912-345-678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">行程描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="詳細描述行程內容..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                  建立行程
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 行程列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">行程列表</h2>
          <div className="space-y-4">
            {trips.map((trip) => {
              const statusDisplay = getStatusDisplay(trip.status);
              const progress = getProgressStats(trip);
              const daysCount = getDaysCount(trip.startDate, trip.endDate);
              
              return (
                <div key={trip.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                     onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{trip.tripName}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusDisplay.color} flex items-center`}>
                          <span className="mr-1">{statusDisplay.icon}</span>
                          {statusDisplay.label}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {daysCount} 天
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">日期：</span>
                          {new Date(trip.startDate).toLocaleDateString('zh-TW')}
                          {trip.startDate !== trip.endDate && ` ~ ${new Date(trip.endDate).toLocaleDateString('zh-TW')}`}
                        </div>
                        <div>
                          <span className="font-medium">路線：</span>
                          {trip.departureLocation} → {trip.destination}
                        </div>
                        <div>
                          <span className="font-medium">人數：</span>
                          {trip.actualPassengers || 0} / {trip.estimatedPassengers} 人
                        </div>
                      </div>

                      {/* 進度條 */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">執行進度</span>
                          <span className="text-gray-600">{progress.completed}/{progress.total} 完成</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div>車輛：{trip.vehiclesAssigned} 台</div>
                        <div>領隊：{trip.leadersAssigned} 人</div>
                        <div>建立時間：{new Date(trip.createdAt).toLocaleDateString('zh-TW')}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        編輯
                      </Button>
                      {trip.status === 'planning' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          開始執行
                        </Button>
                      )}
                      {trip.status === 'confirmed' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          管理行程
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 展開的詳細資訊 */}
                  {selectedTrip === trip.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">聯絡資訊</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>負責人：{trip.contactPerson}</div>
                            <div>電話：{trip.contactPhone}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">行程描述</h4>
                          <p className="text-sm text-gray-600">{trip.description}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                          車輛安排
                        </Button>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                          領隊指派
                        </Button>
                        <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                          人員分配
                        </Button>
                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                          QR 掃碼
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TripManagementPage;