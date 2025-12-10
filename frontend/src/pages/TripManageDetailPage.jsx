import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService, busService, peopleService } from '../services/busService';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const TripManageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, vehicles, leaders, stations, people
  const [buses, setBuses] = useState([]);
  const [people, setPeople] = useState([]);
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [busFormData, setBusFormData] = useState({
    plateNumber: '',
    capacity: '',
    driverName: '',
    driverPhone: '',
    company: ''
  });

  useEffect(() => {
    loadTripData();
    loadBuses();
    loadPeople();
  }, [id]);

  const loadTripData = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTripById(id);
      const tripData = {
        id: data.id || data.Id,
        tripName: data.name || data.Name,
        startDate: data.startDate || data.StartDate,
        endDate: data.endDate || data.EndDate,
        departureLocation: data.departureLocation || data.DepartureLocation,
        destination: data.destination || data.Destination,
        estimatedPassengers: data.estimatedPassengers || data.EstimatedPassengers,
        actualPassengers: data.actualPassengers || data.ActualPassengers,
        description: data.description || data.Description,
        contactPerson: data.contactPerson || data.ContactPerson,
        contactPhone: data.contactPhone || data.ContactPhone,
        status: (data.status || data.Status || '').toLowerCase(),
        tripType: data.tripType || data.TripType,
        boardingMode: data.boardingMode || data.BoardingMode,
        segments: (data.segments || data.Segments || []).map(seg => ({
          id: seg.id || seg.Id,
          type: seg.type || seg.Type,
          date: seg.date || seg.Date,
          time: seg.time || seg.Time,
          stations: (seg.stations || seg.Stations || []).map(st => ({
            id: st.id || st.Id,
            name: st.name || st.Name,
            type: st.type || st.Type,
            stopDuration: st.stopDuration || st.StopDuration || 0
          })),
          estimatedDuration: seg.estimatedDuration || seg.EstimatedDuration,
          vehicleAssigned: seg.vehicleAssigned || seg.VehicleAssigned,
          leaderAssigned: seg.leaderAssigned || seg.LeaderAssigned,
          status: (seg.status || seg.Status || '').toLowerCase(),
          notes: seg.notes || seg.Notes || ''
        })),
        buses: data.buses || [],
        totalCapacity: data.totalCapacity || 0,
        totalAssigned: data.totalAssigned || 0,
        totalOnBoard: data.totalOnBoard || 0
      };
      setTrip(tripData);
    } catch (err) {
      console.error('載入行程失敗', err);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBuses = async () => {
    try {
      const data = await busService.getBuses();
      setBuses(data || []);
    } catch (err) {
      console.error('載入車輛失敗', err);
      setBuses([]);
    }
  };

  const loadPeople = async () => {
    try {
      const data = await peopleService.getPeople({ tripId: id });
      setPeople(data || []);
    } catch (err) {
      console.error('載入人員失敗', err);
      setPeople([]);
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      await busService.assignBus(id, busFormData);
      setShowAddBusModal(false);
      setBusFormData({ plateNumber: '', capacity: '', driverName: '', driverPhone: '', company: '' });
      loadBuses();
      loadTripData();
      alert('✅ 車輛已新增成功！');
    } catch (err) {
      alert('❌ 新增車輛失敗：' + (err.message || '請稍後再試'));
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-purple-100 text-purple-700'
  };

  const statusText = {
    draft: '草稿',
    open: '開放',
    closed: '已關閉',
    cancelled: '已取消',
    completed: '已完成'
  };

  const tabs = [
    { id: 'overview', name: '總覽', icon: '📋' },
    { id: 'vehicles', name: '車輛管理', icon: '🚌' },
    { id: 'leaders', name: '領隊指派', icon: '👨‍✈️' },
    { id: 'stations', name: '站點管理', icon: '📍' },
    { id: 'people', name: '人員名單', icon: '👥' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">載入行程資料中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到行程</h2>
            <p className="text-gray-600 mb-6">此行程可能已被刪除或不存在</p>
            <Button onClick={() => navigate('/trips')} className="bg-indigo-600 text-white">
              返回行程列表
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面頭部 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={() => navigate('/trips')} 
              className="bg-white/20 hover:bg-white/30 text-white border-none"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回列表
            </Button>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[trip.status] || 'bg-gray-100 text-gray-700'}`}>
              {statusText[trip.status] || trip.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{trip.tripName}</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(trip.startDate).toLocaleDateString('zh-TW')} ~ {new Date(trip.endDate).toLocaleDateString('zh-TW')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{trip.departureLocation} → {trip.destination}</span>
            </div>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">預估人數</p>
                <p className="text-2xl font-bold text-gray-900">{trip.estimatedPassengers || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已報名</p>
                <p className="text-2xl font-bold text-green-600">{trip.totalAssigned || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">車輛數</p>
                <p className="text-2xl font-bold text-blue-600">{trip.buses?.length || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">總容量</p>
                <p className="text-2xl font-bold text-indigo-600">{trip.totalCapacity || 0}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 標籤頁 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 p-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 總覽標籤 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">行程名稱：</dt>
                        <dd className="font-medium text-gray-900">{trip.tripName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">行程類型：</dt>
                        <dd className="font-medium text-gray-900">{trip.tripType || '未設定'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">出發地點：</dt>
                        <dd className="font-medium text-gray-900">{trip.departureLocation}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">目的地：</dt>
                        <dd className="font-medium text-gray-900">{trip.destination}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">聯絡資訊</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">聯絡人：</dt>
                        <dd className="font-medium text-gray-900">{trip.contactPerson || '未設定'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">聯絡電話：</dt>
                        <dd className="font-medium text-gray-900">{trip.contactPhone || '未設定'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">上車模式：</dt>
                        <dd className="font-medium text-gray-900">{trip.boardingMode === 'assigned' ? '指派上車' : '自由上車'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                {trip.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">行程描述</h3>
                    <p className="text-gray-600">{trip.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* 車輛管理標籤 */}
            {activeTab === 'vehicles' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">已指派車輛</h3>
                  <Button onClick={() => setShowAddBusModal(true)} className="bg-indigo-600 text-white">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增車輛
                  </Button>
                </div>
                {trip.buses && trip.buses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trip.buses.map(bus => (
                      <div key={bus.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{bus.name}</h4>
                            <p className="text-sm text-gray-600">車牌：{bus.plateNumber || '未設定'}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {bus.capacity} 人座
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">司機：</span>
                            <span className="font-medium">{bus.driverName || '未指派'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">領隊：</span>
                            <span className="font-medium">{bus.leaderName || '未指派'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">已分配/已上車：</span>
                            <span className="font-medium">{bus.assignedCount || 0} / {bus.onBoardCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="mb-4">尚未指派車輛</p>
                    <Button onClick={() => setShowAddBusModal(true)} className="bg-indigo-600 text-white">
                      立即新增
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 領隊指派標籤 */}
            {activeTab === 'leaders' && (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="mb-2">領隊指派功能</p>
                <p className="text-sm">請前往「領隊指派」頁面進行詳細管理</p>
                <Button onClick={() => navigate('/leader-assignments')} className="mt-4 bg-indigo-600 text-white">
                  前往領隊指派
                </Button>
              </div>
            )}

            {/* 站點管理標籤 */}
            {activeTab === 'stations' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">行程段次與站點</h3>
                {trip.segments && trip.segments.length > 0 ? (
                  <div className="space-y-4">
                    {trip.segments.map(segment => (
                      <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {segment.type === 'outbound' ? '去程' : segment.type === 'return' ? '回程' : segment.type}
                          </h4>
                          <span className="text-sm text-gray-600">{segment.date} {segment.time}</span>
                        </div>
                        {segment.stations && segment.stations.length > 0 ? (
                          <ul className="space-y-2">
                            {segment.stations.map((station, idx) => (
                              <li key={idx} className="flex items-center space-x-3 text-sm">
                                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                                  {idx + 1}
                                </span>
                                <span className="flex-1">{station.name}</span>
                                <span className="text-gray-500">{station.type === 'pickup' ? '上車' : '下車'}</span>
                                {station.stopDuration > 0 && (
                                  <span className="text-gray-500">停留 {station.stopDuration} 分鐘</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">尚未設定站點</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>尚未設定段次與站點</p>
                  </div>
                )}
              </div>
            )}

            {/* 人員名單標籤 */}
            {activeTab === 'people' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">報名人員名單</h3>
                  <Button onClick={() => navigate('/people')} className="bg-indigo-600 text-white">
                    前往人員管理
                  </Button>
                </div>
                {people.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">法名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">精舍別</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">聯絡電話</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {people.map(person => (
                          <tr key={person.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{person.dharmaName || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{person.monastery || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{person.phone || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                person.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {person.status === 'confirmed' ? '已確認' : '待確認'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p>尚無報名人員</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 新增車輛 Modal */}
        <Modal open={showAddBusModal} onClose={() => setShowAddBusModal(false)} title="新增車輛">
          <form onSubmit={handleAddBus} className="p-4 space-y-4">
            <Input
              label="車牌號碼 *"
              value={busFormData.plateNumber}
              onChange={(e) => setBusFormData(f => ({ ...f, plateNumber: e.target.value }))}
              placeholder="例：ABC-1234"
              required
            />
            <Input
              label="座位數 *"
              type="number"
              value={busFormData.capacity}
              onChange={(e) => setBusFormData(f => ({ ...f, capacity: e.target.value }))}
              placeholder="例：45"
              required
            />
            <Input
              label="司機姓名"
              value={busFormData.driverName}
              onChange={(e) => setBusFormData(f => ({ ...f, driverName: e.target.value }))}
              placeholder="例：王大明"
            />
            <Input
              label="司機電話"
              value={busFormData.driverPhone}
              onChange={(e) => setBusFormData(f => ({ ...f, driverPhone: e.target.value }))}
              placeholder="例：0912-345-678"
            />
            <Input
              label="車行公司"
              value={busFormData.company}
              onChange={(e) => setBusFormData(f => ({ ...f, company: e.target.value }))}
              placeholder="例：快樂遊覽車公司"
            />
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" onClick={() => setShowAddBusModal(false)} variant="outline">
                取消
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                新增
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default TripManageDetailPage;
