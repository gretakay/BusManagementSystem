import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { tripService, stationService } from '../services/busService';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import StationManager from '../components/StationManager';

// 臨時站點列表（後續從資料庫載入）
const DEFAULT_STATIONS = [
  { id: 1, name: '台北車站', address: '台北市中正區北平西路3號' },
  { id: 2, name: '板橋車站', address: '新北市板橋區縣民大道二段7號' },
  { id: 3, name: '台中車站', address: '台中市中區台灣大道一段1號' },
  { id: 4, name: '台南車站', address: '台南市東區北門路二段4號' },
  { id: 5, name: '高雄車站', address: '高雄市三民區建國二路318號' },
];

// Helper: 驗證行程資料完整性（狀態流轉前必須有車輛、領隊、站點等）
function validateTripData(trip) {
  if (!trip.tripName || !trip.startDate || !trip.endDate || !trip.departureLocation || !trip.destination) {
    return '行程基本資料不完整';
  }
  if (!trip.segments || trip.segments.length === 0) {
    return '至少需要一個段次';
  }
  // 可擴充：檢查車輛、領隊、站點等
  return null;
}

const TripManagementPage = () => {
  const navigate = useNavigate();
  // 刪除相關狀態
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(null);

  // 取消行程（軟刪除）
  const handleCancelTrip = async () => {
    if (!deletingTrip) return;
    try {
      // 串 API，呼叫 tripService.updateTrip({ ...deletingTrip, status: 'cancelled' })
      await tripService.updateTrip({ ...deletingTrip, status: 'cancelled' });
      setTrips(prev => prev.map(t => t.id === deletingTrip.id ? { ...t, status: 'cancelled' } : t));
      setShowDeleteModal(false);
      setDeletingTrip(null);
    } catch (err) {
      alert('取消失敗，請稍後再試');
    }
  };

  // 還原行程
  const handleRestoreTrip = async (trip) => {
    try {
      await tripService.updateTrip({ ...trip, status: 'draft' });
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'draft' } : t));
    } catch (err) {
      alert('還原失敗，請稍後再試');
    }
  };

  // 分頁、搜尋、篩選狀態
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [availableStations, setAvailableStations] = useState(DEFAULT_STATIONS);

  // 新增：多日行程欄位
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
    status: 'draft',
    tripType: 'round_trip', // 'round_trip', 'one_way', 'multi_day'
    boardingMode: 'assigned', // 'assigned', 'free'
    segments: [
      {
        id: 1,
        type: 'outbound',
        date: '',
        time: '08:00',
        stations: [''],
        estimatedDuration: '2',
        notes: ''
      },
      {
        id: 2,
        type: 'return',
        date: '',
        time: '17:00',
        stations: [''],
        estimatedDuration: '2',
        notes: ''
      }
    ]
  });

  // ...existing config arrays (tripTypes, boardingModes, segmentTypes, statusOptions, mockTrips)...

  // 重置表單
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
      status: 'draft',
      tripType: 'round_trip',
      boardingMode: 'assigned',
      segments: [
        {
          id: 1,
          type: 'outbound',
          date: '',
          time: '08:00',
          stations: [],
          estimatedDuration: '2',
          notes: ''
        }
      ]
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await tripService.getTrips();
        // map backend fields to frontend expected shape where possible
        const mapped = (data || []).map(t => ({
          id: t.id,
          tripName: t.name || t.tripName,
          startDate: t.startDate || t.date,
          endDate: t.endDate || t.date,
          departureLocation: t.departureLocation || t.departure || '',
          destination: t.destination || '',
          estimatedPassengers: t.totalCapacity || t.estimatedPassengers || 0,
          actualPassengers: t.totalOnBoard || t.actualPassengers || 0,
          description: t.description || '',
          contactPerson: t.contactPerson || '',
          contactPhone: t.contactPhone || '',
          status: t.status || 'draft',
          tripType: t.tripType || 'round_trip',
          boardingMode: t.boardingMode || (t.buses && t.buses.length ? 'assigned' : 'free'),
          segments: t.segments || []
        }));
        if (mounted) setTrips(mapped.length ? mapped : []);
      } catch (err) {
        console.error('Failed to load trips', err);
        if (mounted) setTrips([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // 新增：前端建立行程前驗證資料完整性
  const handleCreateTrip = (e) => {
    e.preventDefault();
    const errMsg = validateTripData(formData);
    if (errMsg) {
      alert(errMsg);
      return;
    }
    (async () => {
      try {
        const payload = {
          tripName: formData.tripName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          direction: formData.direction || 'outbound',
          description: formData.description,
          status: 'draft',
          departureLocation: formData.departureLocation,
          destination: formData.destination,
          estimatedPassengers: formData.estimatedPassengers,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          tripType: formData.tripType,
          boardingMode: formData.boardingMode,
          segments: formData.segments
        };
        const created = await tripService.createTrip(payload);
        const mapped = {
          id: created.id,
          tripName: created.name || formData.tripName,
          startDate: created.startDate || formData.startDate,
          endDate: created.endDate || formData.endDate,
          departureLocation: formData.departureLocation,
          destination: formData.destination,
          estimatedPassengers: formData.estimatedPassengers,
          actualPassengers: 0,
          description: created.description || formData.description,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          status: created.status || 'draft',
          tripType: formData.tripType,
          boardingMode: formData.boardingMode,
          segments: formData.segments
        };
        setTrips(prev => [mapped, ...prev]);
        setShowCreateForm(false);
        resetForm();
      } catch (err) {
        console.error('Create trip failed', err);
        alert('建立行程失敗，請確認是否有權限或稍後再試');
      }
    })();
  };

  // 編輯行程
  const handleEditTrip = async (e) => {
    e.preventDefault();
    if (!editingTrip) return;
    
    const errMsg = validateTripData(formData);
    if (errMsg) {
      alert(errMsg);
      return;
    }
    
    try {
      const payload = {
        id: editingTrip.id,
        tripName: formData.tripName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        direction: formData.direction || 'outbound',
        description: formData.description,
        status: formData.status,
        departureLocation: formData.departureLocation,
        destination: formData.destination,
        estimatedPassengers: formData.estimatedPassengers,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        tripType: formData.tripType,
        boardingMode: formData.boardingMode,
        segments: formData.segments
      };
      
      await tripService.updateTrip(payload);
      
      // 更新本地列表
      setTrips(prev => prev.map(t => t.id === editingTrip.id ? {
        ...t,
        tripName: formData.tripName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        departureLocation: formData.departureLocation,
        destination: formData.destination,
        estimatedPassengers: formData.estimatedPassengers,
        description: formData.description,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        status: formData.status,
        tripType: formData.tripType,
        boardingMode: formData.boardingMode,
        segments: formData.segments
      } : t));
      
      setShowEditModal(false);
      setEditingTrip(null);
      resetForm();
      alert('行程已更新');
    } catch (err) {
      console.error('Update trip failed', err);
      alert('更新行程失敗，請稍後再試');
    }
  };

  // 刪除行程（確認後）
  const confirmDelete = async () => {
    if (!deletingTrip) return;
    
    try {
      // 呼叫取消 API（軟刪除）
      await tripService.updateTrip({ ...deletingTrip, status: 'cancelled' });
      
      // 從列表移除或更新狀態
      setTrips(prev => prev.map(t => 
        t.id === deletingTrip.id ? { ...t, status: 'cancelled' } : t
      ));
      
      setShowDeleteModal(false);
      setDeletingTrip(null);
      alert('行程已取消');
    } catch (err) {
      console.error('Delete trip failed', err);
      alert('取消行程失敗，請稍後再試');
    }
  };

  // 快速狀態切換
  const handleStatusChange = async (trip, newStatus) => {
    try {
      await tripService.updateTrip({
        id: trip.id,
        tripName: trip.tripName,
        startDate: trip.startDate,
        endDate: trip.endDate,
        direction: trip.direction || 'outbound',
        description: trip.description,
        status: newStatus,
        departureLocation: trip.departureLocation,
        destination: trip.destination,
        estimatedPassengers: trip.estimatedPassengers,
        contactPerson: trip.contactPerson,
        contactPhone: trip.contactPhone,
        tripType: trip.tripType,
        boardingMode: trip.boardingMode,
        segments: trip.segments
      });
      
      // 更新本地列表
      setTrips(prev => prev.map(t => 
        t.id === trip.id ? { ...t, status: newStatus } : t
      ));
      
      alert('狀態已更新');
    } catch (err) {
      console.error('Status change failed', err);
      alert('狀態更新失敗，請稍後再試');
    }
  };

  // 新增：分頁、搜尋、篩選後的 trips
  const filteredTrips = trips
    .filter(t =>
      (!searchTerm || t.tripName.includes(searchTerm) || (t.destination && t.destination.includes(searchTerm))) &&
      (filterStatus === 'all' || t.status === filterStatus || t.status === parseInt(filterStatus))
    );
  const totalPages = Math.ceil(filteredTrips.length / pageSize);
  const pagedTrips = filteredTrips.slice((page - 1) * pageSize, page * pageSize);

  // 新增：loading 狀態顯示
  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center text-gray-500">載入中...</div>
      </Layout>
    );
  }

  // 統計資料
  const stats = {
    total: trips.length,
    draft: trips.filter(t => t.status === 'draft' || t.status === 1).length,
    open: trips.filter(t => t.status === 'open' || t.status === 2).length,
    completed: trips.filter(t => t.status === 'completed' || t.status === 5).length
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
                <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                行程管理
              </h1>
              <p className="text-purple-100">建立和管理旅遊行程，追蹤執行進度</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="bg-white text-indigo-600 hover:bg-gray-100">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增行程
            </Button>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">總行程數</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">草稿</p>
                <p className="text-3xl font-bold text-gray-900">{stats.draft}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">進行中</p>
                <p className="text-3xl font-bold text-green-600">{stats.open}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已完成</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 搜尋與篩選 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Input
                type="text"
                placeholder="搜尋行程名稱或目的地..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">所有狀態</option>
              <option value="1">草稿</option>
              <option value="2">開放</option>
              <option value="3">已關閉</option>
              <option value="4">已取消</option>
              <option value="5">已完成</option>
            </select>
          </div>
        </div>

        {/* 新增行程 Modal 或表單 */}
        <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)} title="新增行程">
          <form onSubmit={handleCreateTrip} className="p-2 md:p-4">
            {/* 基本資料 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行程名稱 *</label>
                <Input placeholder="如：台北一日遊" value={formData.tripName} onChange={e => setFormData(f => ({ ...f, tripName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">預估人數 *</label>
                <Input type="number" placeholder="如：40" value={formData.estimatedPassengers} onChange={e => setFormData(f => ({ ...f, estimatedPassengers: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出發日期 *</label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">結束日期 *</label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出發地點 *</label>
                <Input placeholder="如：台北車站" value={formData.departureLocation} onChange={e => setFormData(f => ({ ...f, departureLocation: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目的地 *</label>
                <Input placeholder="如：九份" value={formData.destination} onChange={e => setFormData(f => ({ ...f, destination: e.target.value }))} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">行程型態 *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={formData.tripType} onChange={e => setFormData(f => ({ ...f, tripType: e.target.value }))} required>
                  <option value="one_way">單程</option>
                  <option value="round_trip">去回程</option>
                  <option value="return_only">僅回程</option>
                </select>
              </div>
            </div>
            {/* 段次設定區塊 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">段次設定</label>
              {formData.tripType === 'one_way' && (
                <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                  <div className="mb-2 font-bold text-gray-800">單程</div>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={formData.segments[0]?.stations?.[0] || ''} 
                    onChange={e => {
                      const newSegments = [...formData.segments];
                      if (!newSegments[0]) newSegments[0] = { stations: [''] };
                      newSegments[0] = { ...newSegments[0], stations: [e.target.value] };
                      setFormData(f => ({ ...f, segments: newSegments }));
                    }}
                  >
                    <option value="">請選擇出發站</option>
                    {availableStations.map(station => (
                      <option key={station.id} value={station.name}>{station.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.tripType === 'round_trip' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                    <div className="mb-2 font-bold text-gray-800">去程</div>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.segments[0]?.stations?.[0] || ''} 
                      onChange={e => {
                        const newSegments = [...formData.segments];
                        if (!newSegments[0]) newSegments[0] = { stations: [''] };
                        newSegments[0] = { ...newSegments[0], stations: [e.target.value] };
                        setFormData(f => ({ ...f, segments: newSegments }));
                      }}
                    >
                      <option value="">請選擇去程出發站</option>
                      {availableStations.map(station => (
                        <option key={station.id} value={station.name}>{station.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                    <div className="mb-2 font-bold text-gray-800">回程</div>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.segments[1]?.stations?.[0] || ''} 
                      onChange={e => {
                        const newSegments = [...formData.segments];
                        if (!newSegments[1]) newSegments[1] = { stations: [''] };
                        newSegments[1] = { ...newSegments[1], stations: [e.target.value] };
                        setFormData(f => ({ ...f, segments: newSegments }));
                      }}
                    >
                      <option value="">請選擇回程出發站</option>
                      {availableStations.map(station => (
                        <option key={station.id} value={station.name}>{station.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {formData.tripType === 'return_only' && (
                <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                  <div className="mb-2 font-bold text-gray-800">僅回程</div>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={formData.segments[0]?.stations?.[0] || ''} 
                    onChange={e => {
                      const newSegments = [...formData.segments];
                      if (!newSegments[0]) newSegments[0] = { stations: [''] };
                      newSegments[0] = { ...newSegments[0], stations: [e.target.value] };
                      setFormData(f => ({ ...f, segments: newSegments }));
                    }}
                  >
                    <option value="">請選擇回程出發站</option>
                    {availableStations.map(station => (
                      <option key={station.id} value={station.name}>{station.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <hr className="my-4" />
            {/* 聯絡資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
                <Input placeholder="如：王小明" value={formData.contactPerson} onChange={e => setFormData(f => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                <Input placeholder="如：0912-345-678" value={formData.contactPhone} onChange={e => setFormData(f => ({ ...f, contactPhone: e.target.value }))} />
              </div>
            </div>
            <hr className="my-4" />
            {/* 備註 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
              <Input placeholder="可填寫特殊需求、注意事項等" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="bg-gray-100">取消</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">建立</Button>
            </div>
          </form>
        </Modal>

        {/* 編輯行程 Modal */}
        <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingTrip(null); }} title="編輯行程">
          <form onSubmit={handleEditTrip} className="p-2 md:p-4">
            {/* 基本資料 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行程名稱 *</label>
                <Input placeholder="如：台北一日遊" value={formData.tripName} onChange={e => setFormData(f => ({ ...f, tripName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">預估人數 *</label>
                <Input type="number" placeholder="如：40" value={formData.estimatedPassengers} onChange={e => setFormData(f => ({ ...f, estimatedPassengers: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出發日期 *</label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">結束日期 *</label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出發地點 *</label>
                <Input placeholder="如：台北車站" value={formData.departureLocation} onChange={e => setFormData(f => ({ ...f, departureLocation: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目的地 *</label>
                <Input placeholder="如：九份" value={formData.destination} onChange={e => setFormData(f => ({ ...f, destination: e.target.value }))} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">行程型態 *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={formData.tripType} onChange={e => setFormData(f => ({ ...f, tripType: e.target.value }))} required>
                  <option value="one_way">單程</option>
                  <option value="round_trip">去回程</option>
                  <option value="return_only">僅回程</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態 *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} required>
                  <option value="draft">草稿</option>
                  <option value="open">開放</option>
                  <option value="closed">已關閉</option>
                  <option value="cancelled">已取消</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>
            {/* 段次設定區塊 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">段次設定</label>
              {formData.tripType === 'one_way' && (
                <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                  <div className="mb-2 font-bold text-gray-800">單程</div>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={formData.segments[0]?.stations?.[0] || ''} 
                    onChange={e => {
                      const newSegments = [...formData.segments];
                      if (!newSegments[0]) newSegments[0] = { stations: [''] };
                      newSegments[0] = { ...newSegments[0], stations: [e.target.value] };
                      setFormData(f => ({ ...f, segments: newSegments }));
                    }}
                  >
                    <option value="">請選擇出發站</option>
                    {availableStations.map(station => (
                      <option key={station.id} value={station.name}>{station.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.tripType === 'round_trip' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                    <div className="mb-2 font-bold text-gray-800">去程</div>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.segments[0]?.stations?.[0] || ''} 
                      onChange={e => {
                        const newSegments = [...formData.segments];
                        if (!newSegments[0]) newSegments[0] = { stations: [''] };
                        newSegments[0] = { ...newSegments[0], stations: [e.target.value] };
                        setFormData(f => ({ ...f, segments: newSegments }));
                      }}
                    >
                      <option value="">請選擇去程出發站</option>
                      {availableStations.map(station => (
                        <option key={station.id} value={station.name}>{station.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                    <div className="mb-2 font-bold text-gray-800">回程</div>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={formData.segments[1]?.stations?.[0] || ''} 
                      onChange={e => {
                        const newSegments = [...formData.segments];
                        if (!newSegments[1]) newSegments[1] = { stations: [''] };
                        newSegments[1] = { ...newSegments[1], stations: [e.target.value] };
                        setFormData(f => ({ ...f, segments: newSegments }));
                      }}
                    >
                      <option value="">請選擇回程出發站</option>
                      {availableStations.map(station => (
                        <option key={station.id} value={station.name}>{station.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {formData.tripType === 'return_only' && (
                <div className="p-3 border rounded-lg mb-2 bg-gray-50">
                  <div className="mb-2 font-bold text-gray-800">僅回程</div>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={formData.segments[0]?.stations?.[0] || ''} 
                    onChange={e => {
                      const newSegments = [...formData.segments];
                      if (!newSegments[0]) newSegments[0] = { stations: [''] };
                      newSegments[0] = { ...newSegments[0], stations: [e.target.value] };
                      setFormData(f => ({ ...f, segments: newSegments }));
                    }}
                  >
                    <option value="">請選擇回程出發站</option>
                    {availableStations.map(station => (
                      <option key={station.id} value={station.name}>{station.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <hr className="my-4" />
            {/* 聯絡資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聯絡人</label>
                <Input placeholder="如：王小明" value={formData.contactPerson} onChange={e => setFormData(f => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                <Input placeholder="如：0912-345-678" value={formData.contactPhone} onChange={e => setFormData(f => ({ ...f, contactPhone: e.target.value }))} />
              </div>
            </div>
            <hr className="my-4" />
            {/* 備註 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
              <Input placeholder="可填寫特殊需求、注意事項等" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setEditingTrip(null); }} className="bg-gray-100">取消</Button>
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">更新</Button>
            </div>
          </form>
        </Modal>

        {/* 刪除確認 Modal */}
        <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletingTrip(null); }} title="確認刪除">
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">確定要刪除此行程嗎？</h3>
            <p className="text-center text-gray-600 mb-2">行程名稱：{deletingTrip?.tripName}</p>
            <p className="text-center text-sm text-gray-500 mb-6">此操作將會把行程狀態改為「已取消」，無法復原。</p>
            <div className="flex justify-center space-x-3">
              <Button type="button" variant="outline" onClick={() => { setShowDeleteModal(false); setDeletingTrip(null); }} className="bg-gray-100">
                取消
              </Button>
              <Button type="button" onClick={confirmDelete} className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
                確認刪除
              </Button>
            </div>
          </div>
        </Modal>

        {/* 行程列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">行程列表</h2>
            <span className="text-sm text-gray-500">{filteredTrips.length} 筆行程</span>
          </div>
          {/* 無資料提示，避免空白畫面 */}
          {!loading && pagedTrips.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">尚無行程</h3>
              <p className="text-gray-500 mb-6">點擊右上角「新增行程」按鈕來建立第一個行程</p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                立即建立
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {pagedTrips.map((trip) => (
              <div key={trip.id} className="p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{trip.tripName}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        trip.status === 'draft' || trip.status === 1 ? 'bg-gray-200 text-gray-700' :
                        trip.status === 'open' || trip.status === 2 ? 'bg-green-200 text-green-700' :
                        trip.status === 'closed' || trip.status === 3 ? 'bg-blue-200 text-blue-700' :
                        trip.status === 'cancelled' || trip.status === 4 ? 'bg-red-200 text-red-700' :
                        'bg-purple-200 text-purple-700'
                      }`}>
                        {trip.status === 'draft' || trip.status === 1 ? '草稿' :
                         trip.status === 'open' || trip.status === 2 ? '開放' :
                         trip.status === 'closed' || trip.status === 3 ? '已關閉' :
                         trip.status === 'cancelled' || trip.status === 4 ? '已取消' : '已完成'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(trip.startDate || trip.date).toLocaleDateString('zh-TW')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{trip.departureLocation || '未設定'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{trip.destination || '未設定'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{trip.estimatedPassengers || trip.totalCapacity || 0} 人</span>
                      </div>
                    </div>
                    {trip.description && (
                      <p className="text-sm text-gray-500 mt-2">{trip.description}</p>
                    )}
                    
                    {/* 快速狀態切換按鈕 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(trip.status === 'draft' || trip.status === 1) && (
                        <button
                          onClick={() => handleStatusChange(trip, 'open')}
                          className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                        >
                          開放報名
                        </button>
                      )}
                      {(trip.status === 'open' || trip.status === 2) && (
                        <button
                          onClick={() => handleStatusChange(trip, 'closed')}
                          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          關閉報名
                        </button>
                      )}
                      {(trip.status === 'closed' || trip.status === 3) && (
                        <button
                          onClick={() => handleStatusChange(trip, 'completed')}
                          className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                        >
                          標記完成
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      onClick={() => navigate(`/trips/${trip.id}`)} 
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      詳情
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingTrip(trip);
                        setFormData({
                          tripName: trip.tripName || '',
                          startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
                          endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
                          departureLocation: trip.departureLocation || '',
                          destination: trip.destination || '',
                          estimatedPassengers: trip.estimatedPassengers || '',
                          contactPerson: trip.contactPerson || '',
                          contactPhone: trip.contactPhone || '',
                          description: trip.description || '',
                          direction: trip.direction || 'outbound',
                          status: trip.status || 'draft',
                          tripType: trip.tripType || 'one_way',
                          boardingMode: trip.boardingMode || 'station',
                          segments: trip.segments || [{ stations: [''] }]
                        });
                        setShowEditModal(true);
                      }} 
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      編輯
                    </Button>
                    <Button 
                      onClick={() => {
                        setDeletingTrip(trip);
                        setShowDeleteModal(true);
                      }} 
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      刪除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                顯示第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredTrips.length)} 筆，共 {filteredTrips.length} 筆
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="disabled:opacity-50"
                >
                  上一頁
                </Button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      onClick={() => setPage(p)}
                      variant={p === page ? 'primary' : 'outline'}
                      size="sm"
                      className={p === page ? 'bg-indigo-600 text-white' : ''}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                  className="disabled:opacity-50"
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TripManagementPage;