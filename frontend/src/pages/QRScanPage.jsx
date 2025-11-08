import { useState, useEffect } from 'react';
import { tripService, scanService } from '../services/busService';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';

const QRScanPage = () => {
  const [selectedTrip, setSelectedTrip] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [people, setPeople] = useState([]);
  const [boardingRecords, setBoardingRecords] = useState([]);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'

  // 模擬資料
  const mockTrips = [
    { 
      id: 1, 
      name: '台北陽明山一日遊', 
      date: '2025-11-15', 
      status: 'confirmed',
      boardingMode: 'assigned' // 指派上車
    },
    { 
      id: 2, 
      name: '九份老街文化之旅', 
      date: '2025-11-20', 
      status: 'planning',
      boardingMode: 'free' // 自由上車
    },
    { 
      id: 3, 
      name: '花蓮太魯閣三日遊', 
      date: '2025-11-25', 
      status: 'confirmed',
      boardingMode: 'assigned'
    }
  ];

  const mockVehicles = [
    { id: 1, name: '大型遊覽車A', plateNumber: 'ABC-1234', capacity: 42, tripId: 1 },
    { id: 2, name: '中型巴士B', plateNumber: 'DEF-5678', capacity: 20, tripId: 2 },
    { id: 3, name: '九人座C', plateNumber: 'GHI-9012', capacity: 8, tripId: 3 },
    { id: 4, name: '大型遊覽車D', plateNumber: 'JKL-3456', capacity: 42, tripId: 3 }
  ];

  const mockPeople = [
    { 
      id: 1, 
      qrCode: 'QR001', 
      name: '王德明', 
      dharmaName: '德明',
      tripId: 1, 
      assignedVehicleId: 1,
      isLeader: true,
      monastery: '台北精舍',
      phone: '0912-345-678'
    },
    { 
      id: 2, 
      qrCode: 'QR002', 
      name: '李慧心', 
      dharmaName: '慧心',
      tripId: 1, 
      assignedVehicleId: 1,
      isLeader: false,
      monastery: '台中精舍',
      phone: '0923-456-789'
    },
    { 
      id: 3, 
      qrCode: 'QR003', 
      name: '釋悟空', 
      dharmaName: '悟空',
      tripId: 2, 
      assignedVehicleId: null,
      isLeader: true,
      monastery: '高雄精舍',
      phone: '0934-567-890'
    },
    { 
      id: 4, 
      qrCode: 'QR004', 
      name: '陳志工', 
      dharmaName: '智慧',
      tripId: 3, 
      assignedVehicleId: 4,
      isLeader: false,
      monastery: '花蓮精舍',
      phone: '0945-678-901'
    }
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await tripService.getTrips();
        const mapped = (data || []).map(t => ({
          id: t.id,
          name: t.name || t.tripName,
          date: t.date || t.startDate,
          status: t.status || 'planning',
          boardingMode: t.boardingMode || (t.buses && t.buses.length ? 'assigned' : 'free')
        }));
        if (mounted) setTrips(mapped.length ? mapped : mockTrips);
      } catch (err) {
        console.error('Failed to load trips', err);
        if (mounted) setTrips(mockTrips);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // 取得當前行程的上車模式
  const getCurrentTripBoardingMode = () => {
    const trip = trips.find(t => t.id === parseInt(selectedTrip));
    return trip?.boardingMode || 'assigned';
  };

  // 取得指定行程的車輛
  const getVehiclesForTrip = (tripId) => {
    return vehicles.filter(v => v.tripId === parseInt(tripId));
  };

  // 處理 QR 碼掃描
  const handleQRScan = async (qrCode) => {
    if (!selectedTrip) {
      setScanResult({
        success: false,
        message: '請先選擇行程',
        type: 'error'
      });
      return;
    }
    setLoading(true);
    try {
      const resp = await scanService.scan(parseInt(selectedTrip), parseInt(selectedVehicle), qrCode);
      // resp expected { success, message, action, person, busStatus }
      if (resp && resp.success) {
        // append basic boarding record from response.busStatus or person info
        setBoardingRecords(prev => [
          { id: prev.length + 1, personId: resp.person?.id, tripId: parseInt(selectedTrip), vehicleId: parseInt(selectedVehicle), boardedAt: new Date().toISOString(), scannedBy: 'leader' },
          ...prev
        ]);
        setScanResult({
          success: true,
          message: resp.message || '上車成功',
          person: resp.person,
          vehicle: { id: parseInt(selectedVehicle), name: resp.busStatus?.busName || '' },
          type: 'success'
        });
      } else {
        setScanResult({
          success: false,
          message: resp?.message || '掃描失敗',
          person: resp?.person,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Scan API error', err);
      // fallback to local simulation behavior
      setScanResult({ success: false, message: '掃描失敗（API 回應錯誤）', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 手動輸入 QR 碼
  const handleManualInput = (e) => {
    e.preventDefault();
    const qrCode = e.target.qrCode.value.trim();
    if (qrCode) {
      handleQRScan(qrCode);
      e.target.reset();
    }
  };

  // 取得車輛統計
  const getVehicleStats = (vehicleId) => {
    const boarded = boardingRecords.filter(
      r => r.vehicleId === vehicleId && r.tripId === parseInt(selectedTrip)
    ).length;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return {
      boarded,
      capacity: vehicle?.capacity || 0,
      percentage: vehicle ? Math.round((boarded / vehicle.capacity) * 100) : 0
    };
  };

  // 取得行程統計
  const getTripStats = () => {
    if (!selectedTrip) return { totalBoarded: 0, totalCapacity: 0 };
    
    const tripVehicles = getVehiclesForTrip(selectedTrip);
    const totalBoarded = boardingRecords.filter(r => r.tripId === parseInt(selectedTrip)).length;
    const totalCapacity = tripVehicles.reduce((sum, v) => sum + v.capacity, 0);
    
    return { totalBoarded, totalCapacity };
  };

  const tripStats = getTripStats();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h16M4 4v16M20 4v16" />
            </svg>
            QR 碼掃描上車
          </h1>
          <p className="text-gray-600">快速掃描乘客 QR 碼，記錄上車狀態</p>
        </div>

        {/* 行程和車輛選擇 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">選擇行程與車輛</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">選擇行程 *</label>
              <select
                value={selectedTrip}
                onChange={(e) => {
                  setSelectedTrip(e.target.value);
                  setSelectedVehicle(''); // 重置車輛選擇
                  setScanResult(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">請選擇行程</option>
                {trips.filter(trip => trip.status !== 'cancelled').map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name} ({trip.date}) - {trip.boardingMode === 'assigned' ? '🎯指派上車' : '🆓自由上車'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">選擇車輛 *</label>
              <select
                value={selectedVehicle}
                onChange={(e) => {
                  setSelectedVehicle(e.target.value);
                  setScanResult(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={!selectedTrip}
              >
                <option value="">請選擇車輛</option>
                {selectedTrip && getVehiclesForTrip(selectedTrip).map((vehicle) => {
                  const stats = getVehicleStats(vehicle.id);
                  return (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.plateNumber}) - {stats.boarded}/{stats.capacity} 人
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {selectedTrip && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-blue-900">
                    {trips.find(t => t.id === parseInt(selectedTrip))?.name}
                  </span>
                  <span className="ml-2 text-blue-700">
                    {getCurrentTripBoardingMode() === 'assigned' ? '🎯 指派上車模式' : '🆓 自由上車模式'}
                  </span>
                </div>
                <div className="text-blue-700">
                  總計：{tripStats.totalBoarded}/{tripStats.totalCapacity} 人
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 掃描方式選擇 */}
        {selectedTrip && selectedVehicle && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">掃描 QR 碼</h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setScanMode('camera')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    scanMode === 'camera' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  📷 相機掃描
                </button>
                <button
                  onClick={() => setScanMode('manual')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    scanMode === 'manual' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  ⌨️ 手動輸入
                </button>
              </div>
            </div>

            {scanMode === 'camera' ? (
              // 相機掃描模式
              <div className="text-center py-12">
                <div className="w-64 h-64 mx-auto border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-600">相機掃描功能</p>
                    <p className="text-sm text-gray-500">準備掃描 QR 碼</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">將 QR 碼對準掃描框</p>
                
                {/* 模擬掃描按鈕 */}
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-500">測試用模擬掃描：</p>
                    <div className="flex justify-center space-x-2">
                      <Button size="sm" onClick={() => handleQRScan('QR001')}>QR001</Button>
                      <Button size="sm" onClick={() => handleQRScan('QR002')}>QR002</Button>
                      <Button size="sm" onClick={() => handleQRScan('QR003')}>QR003</Button>
                    </div>
                </div>
              </div>
            ) : (
              // 手動輸入模式
              <form onSubmit={handleManualInput} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">QR 碼內容</label>
                  <input
                    type="text"
                    name="qrCode"
                    placeholder="請輸入或掃描 QR 碼內容"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? '處理中...' : '確認上車'}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* 掃描結果 */}
        {scanResult && (
          <div className={`rounded-xl p-6 shadow-sm border-2 ${
            scanResult.type === 'success' ? 'bg-green-50 border-green-200' :
            scanResult.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`text-2xl ${
                scanResult.type === 'success' ? 'text-green-600' :
                scanResult.type === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {scanResult.type === 'success' ? '✅' :
                 scanResult.type === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${
                  scanResult.type === 'success' ? 'text-green-900' :
                  scanResult.type === 'warning' ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  {scanResult.message}
                </h3>
                
                {scanResult.person && (
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <div><span className="font-medium">姓名：</span>{scanResult.person.name} ({scanResult.person.dharmaName})</div>
                    <div><span className="font-medium">精舍：</span>{scanResult.person.monastery}</div>
                    <div><span className="font-medium">身分：</span>{scanResult.person.isLeader ? '🎖️ 領隊' : '👥 乘客'}</div>
                    {scanResult.boardedAt && (
                      <div><span className="font-medium">上車時間：</span>{new Date(scanResult.boardedAt).toLocaleString('zh-TW')}</div>
                    )}
                    {scanResult.vehicleName && (
                      <div><span className="font-medium">所在車輛：</span>{scanResult.vehicleName}</div>
                    )}
                    {scanResult.assignedVehicle && (
                      <div><span className="font-medium">指定車輛：</span>{scanResult.assignedVehicle.name}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 車輛統計 */}
        {selectedTrip && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">車輛載客狀況</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getVehiclesForTrip(selectedTrip).map((vehicle) => {
                const stats = getVehicleStats(vehicle.id);
                return (
                  <div key={vehicle.id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-2">{vehicle.name}</h3>
                    <div className="text-sm text-gray-600 mb-3">
                      <div>車牌：{vehicle.plateNumber}</div>
                      <div>載客：{stats.boarded}/{stats.capacity} 人</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stats.percentage >= 100 ? 'bg-red-500' :
                          stats.percentage >= 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {stats.percentage}% 滿載
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 最近上車記錄 */}
        {boardingRecords.length > 0 && selectedTrip && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">最近上車記錄</h2>
            <div className="space-y-3">
              {boardingRecords
                .filter(record => record.tripId === parseInt(selectedTrip))
                .sort((a, b) => new Date(b.boardedAt) - new Date(a.boardedAt))
                .slice(0, 5)
                .map((record) => {
                  const person = people.find(p => p.id === record.personId);
                  const vehicle = vehicles.find(v => v.id === record.vehicleId);
                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{person?.isLeader ? '🎖️' : '👤'}</span>
                        <div>
                          <div className="font-medium">{person?.name} ({person?.dharmaName})</div>
                          <div className="text-sm text-gray-600">{vehicle?.name}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.boardedAt).toLocaleTimeString('zh-TW')}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QRScanPage;