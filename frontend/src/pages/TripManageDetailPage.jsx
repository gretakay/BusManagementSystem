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
  const [activeTab, setActiveTab] = useState('overview');
  const [buses, setBuses] = useState([]);
  const [people, setPeople] = useState([]);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showEditBusModal, setShowEditBusModal] = useState(false);
  const [showAssignLeaderModal, setShowAssignLeaderModal] = useState(false);
  const [showAssignPeopleModal, setShowAssignPeopleModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busFormData, setBusFormData] = useState({
    plateNumber: '',
    capacity: 42,
    driverName: '',
    driverPhone: '',
    company: '',
    description: ''
  });
  const [assignmentData, setAssignmentData] = useState({
    busId: null,
    selectedPeople: []
  });

  useEffect(() => {
    loadTripData();
    loadBuses();
    loadPeople();
    loadAvailableLeaders();
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
        departureLocation: data.departureLocation || data.DepartureLocation || '未設定',
        destination: data.destination || data.Destination || '未設定',
        estimatedPassengers: data.estimatedPassengers || data.EstimatedPassengers || 0,
        actualPassengers: data.actualPassengers || data.ActualPassengers || 0,
        description: data.description || data.Description || '',
        contactPerson: data.contactPerson || data.ContactPerson || '',
        contactPhone: data.contactPhone || data.ContactPhone || '',
        status: (data.status || data.Status || '').toLowerCase(),
        tripType: data.tripType || data.TripType || '未定義',
        boardingMode: data.boardingMode || data.BoardingMode || 'assigned',
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
      const data = await busService.getBuses(id);
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

  const loadAvailableLeaders = async () => {
    try {
      // 模擬資料，實際應從API取得
      setAvailableLeaders([
        { id: 'leader1', name: '王領隊', phone: '0912-345-678' },
        { id: 'leader2', name: '李領隊', phone: '0923-456-789' },
        { id: 'leader3', name: '陳領隊', phone: '0934-567-890' }
      ]);
    } catch (err) {
      console.error('載入領隊失敗', err);
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      await busService.createBus({
        tripId: id,
        name: busFormData.plateNumber,
        capacity: parseInt(busFormData.capacity),
        description: busFormData.description
      });
      setShowAddBusModal(false);
      setBusFormData({ plateNumber: '', capacity: 42, driverName: '', driverPhone: '', company: '', description: '' });
      loadBuses();
      loadTripData();
      alert('✅ 車輛已新增成功！');
    } catch (err) {
      alert('❌ 新增車輛失敗：' + (err.message || '請稍後再試'));
    }
  };

  const handleEditBus = async (e) => {
    e.preventDefault();
    try {
      await busService.updateBus(selectedBus.id, {
        name: busFormData.plateNumber,
        capacity: parseInt(busFormData.capacity),
        description: busFormData.description
      });
      setShowEditBusModal(false);
      setSelectedBus(null);
      setBusFormData({ plateNumber: '', capacity: 42, driverName: '', driverPhone: '', company: '', description: '' });
      loadBuses();
      alert('✅ 車輛已更新成功！');
    } catch (err) {
      alert('❌ 更新車輛失敗：' + (err.message || '請稍後再試'));
    }
  };

  const handleDeleteBus = async (busId) => {
    if (!confirm('確定要刪除此車輛嗎？此操作無法復原。')) return;
    try {
      await busService.deleteBus(busId);
      loadBuses();
      loadTripData();
      alert('✅ 車輛已刪除成功！');
    } catch (err) {
      alert('❌ 刪除車輛失敗：' + (err.message || '該車輛可能已有人員分配'));
    }
  };

  const handleAssignLeader = async (e) => {
    e.preventDefault();
    // TODO: 實作領隊指派邏輯
    alert('領隊指派功能開發中');
    setShowAssignLeaderModal(false);
  };

  const handleAssignPeople = async (e) => {
    e.preventDefault();
    // TODO: 實作人員分配邏輯
    alert('人員分配功能開發中');
    setShowAssignPeopleModal(false);
  };

  const openEditBusModal = (bus) => {
    setSelectedBus(bus);
    setBusFormData({
      plateNumber: bus.name,
      capacity: bus.capacity,
      description: bus.description || ''
    });
    setShowEditBusModal(true);
  };

  const openAssignLeaderModal = (bus) => {
    setSelectedBus(bus);
    setShowAssignLeaderModal(true);
  };

  const openAssignPeopleModal = (bus) => {
    setSelectedBus(bus);
    setAssignmentData({ busId: bus.id, selectedPeople: [] });
    setShowAssignPeopleModal(true);
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
    { id: 'people', name: '乘客管理', icon: '👥' },
    { id: 'stations', name: '站點設定', icon: '📍' }
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
                <p className="text-2xl font-bold text-blue-600">{buses.length || 0}</p>
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
                {buses && buses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {buses.map(bus => (
                      <div key={bus.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{bus.name}</h4>
                            <p className="text-sm text-gray-600">車輛編號：{bus.id}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {bus.capacity} 人座
                          </span>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">領隊：</span>
                            <span className="font-medium">{bus.leaderName || '未指派'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">備註：</span>
                            <span className="font-medium text-gray-500 text-xs">{bus.description || '-'}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => openEditBusModal(bus)} 
                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm"
                          >
                            編輯
                          </Button>
                          <Button 
                            onClick={() => openAssignLeaderModal(bus)} 
                            className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 text-sm"
                          >
                            指派領隊
                          </Button>
                          <Button 
                            onClick={() => openAssignPeopleModal(bus)} 
                            className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm"
                          >
                            分配乘客
                          </Button>
                          <Button 
                            onClick={() => handleDeleteBus(bus.id)} 
                            className="bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                          >
                            刪除
                          </Button>
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">車輛領隊指派</h3>
                <p className="text-gray-600 mb-6">為每台車輛指派負責的領隊</p>
                {buses && buses.length > 0 ? (
                  <div className="space-y-4">
                    {buses.map(bus => (
                      <div key={bus.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{bus.name}</h4>
                          <p className="text-sm text-gray-600">
                            目前領隊：{bus.leaderName ? <span className="text-green-600 font-medium">{bus.leaderName}</span> : <span className="text-gray-400">未指派</span>}
                          </p>
                        </div>
                        <Button 
                          onClick={() => openAssignLeaderModal(bus)} 
                          className="bg-indigo-600 text-white"
                        >
                          {bus.leaderName ? '更換領隊' : '指派領隊'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>請先新增車輛再進行領隊指派</p>
                  </div>
                )}
              </div>
            )}

            {/* 乘客管理標籤 */}
            {activeTab === 'people' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">乘客車輛分配</h3>
                <p className="text-gray-600 mb-6">將報名人員分配到各車輛</p>
                {buses && buses.length > 0 ? (
                  <div className="space-y-4">
                    {buses.map(bus => (
                      <div key={bus.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{bus.name}</h4>
                            <p className="text-sm text-gray-600">
                              座位：{bus.assignedCount || 0} / {bus.capacity}
                              <span className={`ml-2 ${(bus.assignedCount || 0) > bus.capacity ? 'text-red-600' : 'text-green-600'}`}>
                                {(bus.assignedCount || 0) > bus.capacity ? '⚠️ 超載' : '✓ 正常'}
                              </span>
                            </p>
                          </div>
                          <Button 
                            onClick={() => openAssignPeopleModal(bus)} 
                            className="bg-indigo-600 text-white"
                          >
                            分配乘客
                          </Button>
                        </div>
                        {/* 這裡可以顯示已分配的乘客列表 */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>請先新增車輛再進行乘客分配</p>
                  </div>
                )}
              </div>
            )}

            {/* 站點設定標籤 */}
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
                    <Button onClick={() => navigate(`/trips/${id}/edit`)} className="mt-4 bg-indigo-600 text-white">
                      前往行程編輯
                    </Button>
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
              label="備註"
              value={busFormData.description}
              onChange={(e) => setBusFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="例：大型遊覽車，靠窗座位較多"
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

        {/* 編輯車輛 Modal */}
        <Modal open={showEditBusModal} onClose={() => setShowEditBusModal(false)} title="編輯車輛">
          <form onSubmit={handleEditBus} className="p-4 space-y-4">
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
              label="備註"
              value={busFormData.description}
              onChange={(e) => setBusFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="例：大型遊覽車，靠窗座位較多"
            />
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" onClick={() => setShowEditBusModal(false)} variant="outline">
                取消
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                更新
              </Button>
            </div>
          </form>
        </Modal>

        {/* 指派領隊 Modal */}
        <Modal open={showAssignLeaderModal} onClose={() => setShowAssignLeaderModal(false)} title="指派領隊">
          <form onSubmit={handleAssignLeader} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇領隊 *
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                <option value="">請選擇...</option>
                {availableLeaders.map(leader => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} ({leader.phone})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" onClick={() => setShowAssignLeaderModal(false)} variant="outline">
                取消
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                指派
              </Button>
            </div>
          </form>
        </Modal>

        {/* 分配乘客 Modal */}
        <Modal open={showAssignPeopleModal} onClose={() => setShowAssignPeopleModal(false)} title="分配乘客">
          <form onSubmit={handleAssignPeople} className="p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                車輛：<span className="font-semibold text-gray-900">{selectedBus?.name}</span>
                <span className="ml-2 text-gray-500">（{selectedBus?.capacity} 人座）</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇乘客
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                {people.length > 0 ? (
                  people.map(person => (
                    <label key={person.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignmentData(d => ({ ...d, selectedPeople: [...d.selectedPeople, person.id] }));
                          } else {
                            setAssignmentData(d => ({ ...d, selectedPeople: d.selectedPeople.filter(id => id !== person.id) }));
                          }
                        }}
                      />
                      <span className="text-sm">{person.name} - {person.dharmaName || '無法名'}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">無可分配人員</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                已選擇 {assignmentData.selectedPeople.length} 人
              </p>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" onClick={() => setShowAssignPeopleModal(false)} variant="outline">
                取消
              </Button>
              <Button type="submit" className="bg-indigo-600 text-white">
                分配
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default TripManageDetailPage;
