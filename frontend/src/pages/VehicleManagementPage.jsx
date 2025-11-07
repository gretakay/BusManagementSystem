import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const VehicleManagementPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    busType: '',
    capacity: 42,
    driverName: '',
    driverPhone: '',
    company: '',
    status: 'available'
  });

  const busTypes = [
    { value: 'taxi', label: '計程車', capacity: 4 },
    { value: 'van7', label: '七人座', capacity: 6 },
    { value: 'van9', label: '九人座', capacity: 8 },
    { value: 'midibus', label: '中巴', capacity: 20 },
    { value: 'bus', label: '大巴', capacity: 42 }
  ];

  const statusOptions = [
    { value: 'available', label: '可用', color: 'bg-green-100 text-green-800' },
    { value: 'assigned', label: '已分配', color: 'bg-blue-100 text-blue-800' },
    { value: 'maintenance', label: '維修中', color: 'bg-red-100 text-red-800' },
    { value: 'inactive', label: '停用', color: 'bg-gray-100 text-gray-800' }
  ];

  const mockVehicles = [
    {
      id: 1,
      plateNumber: 'ABC-1234',
      busType: 'bus',
      capacity: 42,
      driverName: '王大明',
      driverPhone: '0912-345-678',
      company: '優質遊覽車公司',
      status: 'assigned',
      tripName: '台北一日遊',
      assignedAt: '2025-11-07T08:00:00',
      leaderName: '領隊小王'
    },
    {
      id: 2,
      plateNumber: 'DEF-5678',
      busType: 'midibus',
      capacity: 20,
      driverName: '李小華',
      driverPhone: '0923-456-789',
      company: '安全旅遊車隊',
      status: 'available',
      tripName: null,
      assignedAt: null,
      leaderName: null
    },
    {
      id: 3,
      plateNumber: 'GHI-9012',
      busType: 'van9',
      capacity: 8,
      driverName: '陳司機',
      driverPhone: '0934-567-890',
      company: '便民接送',
      status: 'available',
      tripName: null,
      assignedAt: null,
      leaderName: null
    },
    {
      id: 4,
      plateNumber: 'JKL-3456',
      busType: 'taxi',
      capacity: 4,
      driverName: '張運將',
      driverPhone: '0945-678-901',
      company: '城市計程車',
      status: 'maintenance',
      tripName: null,
      assignedAt: null,
      leaderName: null
    }
  ];

  useEffect(() => {
    setVehicles(mockVehicles);
  }, []);

  const handleCreateVehicle = (e) => {
    e.preventDefault();
    // TODO: 實際的 API 呼叫
    console.log('Creating vehicle:', formData);
    setShowCreateForm(false);
    setFormData({
      plateNumber: '',
      busType: '',
      capacity: 42,
      driverName: '',
      driverPhone: '',
      company: '',
      status: 'available'
    });
  };

  const handleBusTypeChange = (busType) => {
    const selectedType = busTypes.find(type => type.value === busType);
    setFormData(prev => ({
      ...prev,
      busType,
      capacity: selectedType ? selectedType.capacity : 42
    }));
  };

  const getStatusDisplay = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getBusTypeDisplay = (busType) => {
    const typeConfig = busTypes.find(t => t.value === busType);
    return typeConfig ? typeConfig.label : busType;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                車輛管理
              </h1>
              <p className="text-gray-600">管理遊覽車資料、司機資訊和車輛狀態</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-500 to-teal-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新增車輛
            </Button>
          </div>
        </div>

        {/* 車輛統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter(v => v.status === 'available').length}
            </div>
            <div className="text-sm text-gray-600">可用車輛</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {vehicles.filter(v => v.status === 'assigned').length}
            </div>
            <div className="text-sm text-gray-600">已分配</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">
              {vehicles.filter(v => v.status === 'maintenance').length}
            </div>
            <div className="text-sm text-gray-600">維修中</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {vehicles.reduce((sum, v) => sum + v.capacity, 0)}
            </div>
            <div className="text-sm text-gray-600">總容量</div>
          </div>
        </div>

        {/* 新增車輛表單 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新增車輛</h2>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="車牌號碼"
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value }))}
                  placeholder="例：ABC-1234"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">車型</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => handleBusTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">選擇車型</option>
                    {busTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} ({type.capacity}人座)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="載客容量"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  required
                />
                
                <Input
                  label="遊覽車公司"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="公司名稱"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="司機姓名"
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                  placeholder="司機姓名"
                  required
                />
                
                <Input
                  label="司機電話"
                  type="tel"
                  value={formData.driverPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverPhone: e.target.value }))}
                  placeholder="0912-345-678"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-green-500 to-teal-600">
                  新增車輛
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 車輛列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">車輛列表</h2>
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{vehicle.plateNumber}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusDisplay(vehicle.status).color}`}>
                          {getStatusDisplay(vehicle.status).label}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {getBusTypeDisplay(vehicle.busType)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">容量：</span>{vehicle.capacity} 人
                        </div>
                        <div>
                          <span className="font-medium">司機：</span>{vehicle.driverName}
                        </div>
                        <div>
                          <span className="font-medium">電話：</span>{vehicle.driverPhone}
                        </div>
                        <div>
                          <span className="font-medium">公司：</span>{vehicle.company}
                        </div>
                      </div>

                      {vehicle.status === 'assigned' && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <span className="font-medium">分配行程：</span>{vehicle.tripName}
                            {vehicle.leaderName && (
                              <span className="ml-4"><span className="font-medium">領隊：</span>{vehicle.leaderName}</span>
                            )}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            分配時間：{new Date(vehicle.assignedAt).toLocaleString('zh-TW')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      編輯
                    </Button>
                    {vehicle.status === 'available' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        指派
                      </Button>
                    )}
                    {vehicle.status === 'assigned' && (
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        解除指派
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VehicleManagementPage;