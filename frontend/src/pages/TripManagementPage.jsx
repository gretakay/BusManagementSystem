import { useState, useEffect } from 'react';
import Modal from '../components/ui/Modal';
import { tripService } from '../services/busService';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import StationManager from '../components/StationManager';

const TripManagementPage = () => {
      // 分頁、搜尋、篩選狀態
      const [page, setPage] = useState(1);
      const [pageSize, setPageSize] = useState(5);
      const [keyword, setKeyword] = useState('');
      const [filterStatus, setFilterStatus] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTrip, setEditingTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  // 分頁、搜尋、篩選後的 trips
  const filteredTrips = trips
    .filter(t =>
      (!keyword || t.tripName.includes(keyword) || t.destination.includes(keyword)) &&
      (!filterStatus || t.status === filterStatus)
    );
  const totalPages = Math.ceil(filteredTrips.length / pageSize);
  const pagedTrips = filteredTrips.slice((page - 1) * pageSize, page * pageSize);
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
    status: 'planning',
    tripType: 'round_trip', // 'round_trip', 'one_way', 'multi_day'
    boardingMode: 'assigned', // 'assigned' (指派上車), 'free' (自由上車)
    segments: [
      {
        id: 1,
        type: 'outbound',
        date: '',
        time: '08:00',
        stations: [], // 改為站點陣列，支援多站點
        estimatedDuration: '2',
        notes: ''
      }
    ]
  });

  const tripTypes = [
    { value: 'one_way', label: '單程', description: '只有去程，不返回' },
    { value: 'round_trip', label: '來回', description: '去程和回程在同一天' },
    { value: 'multi_day', label: '多日遊', description: '跨多天的行程，可能有多個段次' }
  ];

  const boardingModes = [
    { 
      value: 'assigned', 
      label: '指派上車', 
      description: '乘客需分配到指定車輛，掃碼時驗證是否為該車乘客',
      icon: '🎯',
      color: 'text-blue-600'
    },
    { 
      value: 'free', 
      label: '自由上車', 
      description: '乘客可自由選擇車輛，掃碼後直接登記上車',
      icon: '🆓',
      color: 'text-green-600'
    }
  ];

  const segmentTypes = [
    { value: 'outbound', label: '去程', icon: '🚌', color: 'text-green-600' },
    { value: 'return', label: '回程', icon: '🏠', color: 'text-blue-600' },
    { value: 'intermediate', label: '中段', icon: '📍', color: 'text-purple-600' }
  ];

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
      leadersAssigned: 1,
      tripType: 'round_trip',
      boardingMode: 'assigned',
      segments: [
        {
          id: 1,
          type: 'outbound',
          date: '2025-11-15',
          time: '08:00',
          stations: [
            { id: 1, name: '台北車站', type: 'pickup', stopDuration: 0 },
            { id: 4, name: '西門町', type: 'pickup', stopDuration: 10 },
            { id: 6, name: '陽明山國家公園', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '1.5',
          vehicleAssigned: 'ABC-1234',
          leaderAssigned: '領隊小王',
          status: 'confirmed'
        },
        {
          id: 2,
          type: 'return',
          date: '2025-11-15',
          time: '17:00',
          stations: [
            { id: 6, name: '陽明山國家公園', type: 'pickup', stopDuration: 0 },
            { id: 4, name: '西門町', type: 'dropoff', stopDuration: 5 },
            { id: 1, name: '台北車站', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '1.5',
          vehicleAssigned: 'ABC-1234',
          leaderAssigned: '領隊小王',
          status: 'confirmed'
        }
      ]
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
      leadersAssigned: 0,
      tripType: 'multi_day',
      boardingMode: 'free',
      segments: [
        {
          id: 1,
          type: 'outbound',
          date: '2025-11-20',
          time: '09:00',
          stations: [
            { id: 2, name: '松山機場', type: 'pickup', stopDuration: 0 },
            { id: 5, name: '九份老街', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '1',
          status: 'planning'
        },
        {
          id: 2,
          type: 'return',
          date: '2025-11-21',
          time: '15:00',
          stations: [
            { id: 5, name: '九份老街', type: 'pickup', stopDuration: 0 },
            { id: 2, name: '松山機場', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '1',
          status: 'planning'
        }
      ]
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
      leadersAssigned: 2,
      tripType: 'multi_day',
      boardingMode: 'assigned',
      segments: [
        {
          id: 1,
          type: 'outbound',
          date: '2025-11-25',
          time: '07:00',
          stations: [
            { id: 1, name: '台北車站', type: 'pickup', stopDuration: 0 },
            { id: 8, name: '花蓮火車站', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '3',
          vehicleAssigned: 'DEF-5678',
          leaderAssigned: '領隊阿明',
          status: 'confirmed'
        },
        {
          id: 2,
          type: 'intermediate',
          date: '2025-11-26',
          time: '08:30',
          stations: [
            { id: 8, name: '花蓮火車站', type: 'pickup', stopDuration: 0 },
            { name: '太魯閣國家公園', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '0.5',
          vehicleAssigned: 'GHI-9012',
          leaderAssigned: '領隊小美',
          status: 'confirmed'
        },
        {
          id: 3,
          type: 'return',
          date: '2025-11-27',
          time: '16:00',
          stations: [
            { id: 8, name: '花蓮火車站', type: 'pickup', stopDuration: 0 },
            { id: 1, name: '台北車站', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '3',
          vehicleAssigned: 'DEF-5678',
          leaderAssigned: '領隊阿明',
          status: 'confirmed'
        }
      ]
    }
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await tripService.getTrips();
        // map backend fields to frontend expected shape where possible
        const mapped = (data || []).map(t => ({
          id: t.id,
          tripName: t.name || t.tripName,
          startDate: t.date || t.startDate,
          endDate: t.date || t.endDate,
          departureLocation: t.departureLocation || t.departure || '',
          destination: t.destination || '',
          estimatedPassengers: t.totalCapacity || t.estimatedPassengers || 0,
          actualPassengers: t.totalOnBoard || t.actualPassengers || 0,
          description: t.description || '',
          contactPerson: t.contactPerson || '',
          contactPhone: t.contactPhone || '',
          status: t.status || 'planning',
          tripType: t.tripType || 'round_trip',
          boardingMode: t.boardingMode || (t.buses && t.buses.length ? 'assigned' : 'free'),
          segments: t.segments || []
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

  const handleCreateTrip = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = {
          Name: formData.tripName,
          Date: formData.startDate,
          Direction: formData.tripType,
          Description: formData.description
        };
        const created = await tripService.createTrip(payload);
        const mapped = {
          id: created.id,
          tripName: created.name || formData.tripName,
          startDate: created.date || formData.startDate,
          endDate: created.date || formData.endDate || formData.startDate,
          departureLocation: formData.departureLocation,
          destination: formData.destination,
          estimatedPassengers: formData.estimatedPassengers,
          actualPassengers: 0,
          description: created.description || formData.description,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          status: created.status || 'planning',
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

  const handleTripTypeChange = (tripType) => {
    let defaultSegments = [];
    
    if (tripType === 'one_way') {
      defaultSegments = [
        {
          id: 1,
          type: 'outbound',
          date: formData.startDate,
          time: '08:00',
          stations: [],
          estimatedDuration: '2',
          notes: ''
        }
      ];
    } else if (tripType === 'round_trip') {
      defaultSegments = [
        {
          id: 1,
          type: 'outbound',
          date: formData.startDate,
          time: '08:00',
          stations: [],
          estimatedDuration: '2',
          notes: ''
        },
        {
          id: 2,
          type: 'return',
          date: formData.endDate || formData.startDate,
          time: '17:00',
          stations: [],
          estimatedDuration: '2',
          notes: ''
        }
      ];
    } else if (tripType === 'multi_day') {
      defaultSegments = [
        {
          id: 1,
          type: 'outbound',
          date: formData.startDate,
          time: '08:00',
          stations: [],
          estimatedDuration: '2',
          notes: ''
        }
      ];
    }

    setFormData(prev => ({
      ...prev,
      tripType,
      segments: defaultSegments
    }));
  };

  const addSegment = () => {
    const newSegment = {
      id: formData.segments.length + 1,
      type: 'intermediate',
      date: formData.endDate || formData.startDate,
      time: '09:00',
      stations: [],
      estimatedDuration: '1',
      notes: ''
    };
    
    setFormData(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment]
    }));
  };

  const removeSegment = (segmentId) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.filter(s => s.id !== segmentId)
    }));
  };

  const updateSegment = (segmentId, field, value) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.map(s => 
        s.id === segmentId ? { ...s, [field]: value } : s
      )
    }));
  };

  const updateSegmentStations = (segmentId, stations) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.map(s => 
        s.id === segmentId ? { ...s, stations } : s
      )
    }));
  };

  const addStationToSegment = (segmentId, station, stopDuration = 0) => {
    const stationWithDuration = {
      ...station,
      type: 'pickup', // 預設為上車點，使用者可以後續修改
      stopDuration
    };
    
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.map(s => 
        s.id === segmentId 
          ? { ...s, stations: [...s.stations, stationWithDuration] }
          : s
      )
    }));
  };

  const removeStationFromSegment = (segmentId, stationIndex) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.map(s => 
        s.id === segmentId 
          ? { ...s, stations: s.stations.filter((_, index) => index !== stationIndex) }
          : s
      )
    }));
  };

  const updateStationInSegment = (segmentId, stationIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.map(s => 
        s.id === segmentId 
          ? {
              ...s,
              stations: s.stations.map((station, index) => 
                index === stationIndex ? { ...station, [field]: value } : station
              )
            }
          : s
      )
    }));
  };

  const getRouteDisplay = (stations) => {
    if (!stations || stations.length === 0) return '尚未設定路線';
    if (stations.length === 1) return stations[0].name;
    return stations.map(s => s.name).join(' → ');
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
      status: 'planning',
      tripType: 'round_trip',
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

  const getStatusDisplay = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig || { label: status, color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  const getSegmentTypeDisplay = (type) => {
    const typeConfig = segmentTypes.find(t => t.value === type);
    return typeConfig || { label: type, icon: '📍', color: 'text-gray-600' };
  };

  const getTripTypeDisplay = (type) => {
    const typeConfig = tripTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
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
            const count = filteredTrips.filter(t => t.status === status.value).length;
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">行程類型</label>
                  <select
                    value={formData.tripType}
                    onChange={(e) => handleTripTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {tripTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 上車模式選擇 */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">上車模式</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boardingModes.map((mode) => (
                    <div
                      key={mode.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.boardingMode === mode.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, boardingMode: mode.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{mode.icon}</span>
                        <div className="flex-1">
                          <div className={`font-medium ${mode.color}`}>
                            {mode.label}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {mode.description}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.boardingMode === mode.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.boardingMode === mode.value && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="預估人數"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.estimatedPassengers}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedPassengers: parseInt(e.target.value) }))}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">總天數</label>
                  <div className="text-lg font-medium text-gray-900 px-3 py-2 bg-gray-50 rounded-lg">
                    {formData.startDate && formData.endDate 
                      ? getDaysCount(formData.startDate, formData.endDate) 
                      : '-'} 天
                  </div>
                </div>
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

              {/* 段次管理 */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">行程段次安排</h3>
                  {formData.tripType === 'multi_day' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSegment}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      新增段次
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.segments.map((segment, index) => {
                    const segmentDisplay = getSegmentTypeDisplay(segment.type);
                    return (
                      <div key={segment.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{segmentDisplay.icon}</span>
                            <span className={`font-medium ${segmentDisplay.color}`}>
                              段次 {index + 1}: {segmentDisplay.label}
                            </span>
                          </div>
                          {formData.segments.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSegment(segment.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              移除
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <Input
                            label="日期"
                            type="date"
                            value={segment.date}
                            onChange={(e) => updateSegment(segment.id, 'date', e.target.value)}
                            required
                          />
                          
                          <Input
                            label="時間"
                            type="time"
                            value={segment.time}
                            onChange={(e) => updateSegment(segment.id, 'time', e.target.value)}
                            required
                          />

                          <Input
                            label="預估車程（小時）"
                            type="number"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={segment.estimatedDuration}
                            onChange={(e) => updateSegment(segment.id, 'estimatedDuration', e.target.value)}
                          />
                        </div>

                        {/* 站點路線管理 */}
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">
                            路線設定 ({segment.stations?.length || 0} 個站點)
                          </h5>
                          
                          {/* 當前路線顯示 */}
                          {segment.stations && segment.stations.length > 0 && (
                            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                              <div className="text-sm font-medium text-gray-700 mb-2">當前路線：</div>
                              <div className="space-y-2">
                                {segment.stations.map((station, stationIndex) => (
                                  <div key={stationIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm font-medium text-gray-600">
                                        {stationIndex + 1}.
                                      </span>
                                      <span className="font-medium">{station.name}</span>
                                      <select
                                        value={station.type || 'pickup'}
                                        onChange={(e) => updateStationInSegment(segment.id, stationIndex, 'type', e.target.value)}
                                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                                      >
                                        <option value="pickup">上車點</option>
                                        <option value="dropoff">下車點</option>
                                        <option value="transfer">轉乘點</option>
                                      </select>
                                      {station.stopDuration > 0 && (
                                        <span className="text-xs text-gray-500">
                                          停留 {station.stopDuration} 分鐘
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={station.stopDuration || 0}
                                        onChange={(e) => updateStationInSegment(segment.id, stationIndex, 'stopDuration', parseInt(e.target.value))}
                                        className="w-16 text-xs px-2 py-1 border border-gray-300 rounded"
                                        placeholder="停留分鐘"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeStationFromSegment(segment.id, stationIndex)}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        移除
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 站點選擇器 */}
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">選擇站點：</div>
                            <StationManager
                              mode="single"
                              onStationSelect={(station) => addStationToSegment(segment.id, station, 0)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">段次類型</label>
                            <select
                              value={segment.type}
                              onChange={(e) => updateSegment(segment.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {segmentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <div className="text-sm text-gray-600">
                              <div className="font-medium">路線預覽：</div>
                              <div className="text-gray-900">{getRouteDisplay(segment.stations)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                          <textarea
                            value={segment.notes || ''}
                            onChange={(e) => updateSegment(segment.id, 'notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="特殊需求或注意事項..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
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

        {/* 搜尋與篩選區塊 */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
          <input
            type="text"
            className="border rounded px-3 py-2 mb-2 md:mb-0"
            placeholder="搜尋行程名稱或目的地"
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            style={{ minWidth: 200 }}
          />
          <select
            className="border rounded px-3 py-2 mb-2 md:mb-0"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            style={{ minWidth: 150 }}
          >
            <option value="">全部狀態</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* 行程列表（分頁） */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">行程列表</h2>
          <div className="space-y-4">
            {pagedTrips.map((trip) => {
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
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {getTripTypeDisplay(trip.tripType)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          trip.boardingMode === 'assigned' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {trip.boardingMode === 'assigned' ? '🎯 指派上車' : '🆓 自由上車'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {trip.segments?.length || 0} 段次
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
                          {trip.segments && trip.segments.length > 0 
                            ? getRouteDisplay(trip.segments[0].stations)
                            : `${trip.departureLocation} → ${trip.destination}`
                          }
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTrip(trip);
                          setShowEditModal(true);
                        }}
                      >
                        編輯
                      </Button>
                      {trip.status === 'planning' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          開始執行
                        </Button>
                      )}
                      {trip.status === 'confirmed' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => alert('管理行程功能待開發')}>管理行程</Button>
                      )}
                    </div>
                        {/* 編輯行程彈窗，放在最外層 */}
                        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="編輯行程">
                          {editingTrip && (
                            <form
                              onSubmit={async e => {
                                e.preventDefault();
                                try {
                                  // 呼叫 API 更新行程
                                  const payload = {
                                    id: editingTrip.id,
                                    tripName: editingTrip.tripName,
                                    startDate: editingTrip.startDate,
                                    endDate: editingTrip.endDate,
                                    departureLocation: editingTrip.departureLocation,
                                    destination: editingTrip.destination,
                                    estimatedPassengers: editingTrip.estimatedPassengers,
                                    description: editingTrip.description,
                                    contactPerson: editingTrip.contactPerson,
                                    contactPhone: editingTrip.contactPhone,
                                    status: editingTrip.status,
                                    tripType: editingTrip.tripType,
                                    boardingMode: editingTrip.boardingMode,
                                    segments: editingTrip.segments
                                  };
                                  await tripService.updateTrip(payload);
                                  // 更新 trips 狀態
                                  setTrips(prev => prev.map(t => t.id === editingTrip.id ? { ...editingTrip } : t));
                                  setShowEditModal(false);
                                } catch (err) {
                                  alert('更新失敗，請稍後再試');
                                }
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-medium mb-1">行程名稱</label>
                                <input className="w-full border rounded px-3 py-2" value={editingTrip.tripName} onChange={e => setEditingTrip({ ...editingTrip, tripName: e.target.value })} />
                              </div>
                              <div className="flex space-x-2">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium mb-1">開始日期</label>
                                  <input type="date" className="w-full border rounded px-3 py-2" value={editingTrip.startDate} onChange={e => setEditingTrip({ ...editingTrip, startDate: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-sm font-medium mb-1">結束日期</label>
                                  <input type="date" className="w-full border rounded px-3 py-2" value={editingTrip.endDate} onChange={e => setEditingTrip({ ...editingTrip, endDate: e.target.value })} />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">出發地</label>
                                <input className="w-full border rounded px-3 py-2" value={editingTrip.departureLocation} onChange={e => setEditingTrip({ ...editingTrip, departureLocation: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">目的地</label>
                                <input className="w-full border rounded px-3 py-2" value={editingTrip.destination} onChange={e => setEditingTrip({ ...editingTrip, destination: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">預估人數</label>
                                <input type="number" className="w-full border rounded px-3 py-2" value={editingTrip.estimatedPassengers} onChange={e => setEditingTrip({ ...editingTrip, estimatedPassengers: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">描述</label>
                                <textarea className="w-full border rounded px-3 py-2" value={editingTrip.description} onChange={e => setEditingTrip({ ...editingTrip, description: e.target.value })} />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowEditModal(false)}>取消</Button>
                                <Button type="submit">儲存</Button>
                              </div>
                            </form>
                          )}
                        </Modal>
                  </div>

                  {/* 展開的詳細資訊 */}
                  {selectedTrip === trip.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                      {/* 段次詳情 */}
                      {trip.segments && trip.segments.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-3">段次安排</h4>
                          <div className="space-y-3">
                            {trip.segments.map((segment, index) => {
                              const segmentDisplay = getSegmentTypeDisplay(segment.type);
                              return (
                                <div key={segment.id} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{segmentDisplay.icon}</span>
                                      <span className={`font-medium ${segmentDisplay.color}`}>
                                        段次 {index + 1}: {segmentDisplay.label}
                                      </span>
                                      {segment.status && (
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusDisplay(segment.status).color}`}>
                                          {getStatusDisplay(segment.status).label}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {segment.date} {segment.time}
                                    </div>
                                  </div>
                                  
                                  <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">路線：</span>
                                    {getRouteDisplay(segment.stations)}
                                    <span className="ml-4 font-medium">預估車程：</span>
                                    {segment.estimatedDuration} 小時
                                  </div>

                                  {/* 站點詳細資訊 */}
                                  {segment.stations && segment.stations.length > 1 && (
                                    <div className="text-sm text-gray-600 mb-2">
                                      <div className="font-medium mb-1">站點詳情：</div>
                                      <div className="space-y-1 ml-2">
                                        {segment.stations.map((station, stationIndex) => (
                                          <div key={stationIndex} className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-400">{stationIndex + 1}.</span>
                                            <span>{station.name}</span>
                                            <span className="text-xs px-1 py-0.5 bg-gray-100 rounded">
                                              {station.type === 'pickup' ? '上車' : station.type === 'dropoff' ? '下車' : '轉乘'}
                                            </span>
                                            {station.stopDuration > 0 && (
                                              <span className="text-xs text-orange-600">
                                                停留{station.stopDuration}分鐘
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {(segment.vehicleAssigned || segment.leaderAssigned) && (
                                    <div className="text-sm text-gray-600">
                                      {segment.vehicleAssigned && (
                                        <span className="mr-4">
                                          <span className="font-medium">車輛：</span>{segment.vehicleAssigned}
                                        </span>
                                      )}
                                      {segment.leaderAssigned && (
                                        <span>
                                          <span className="font-medium">領隊：</span>{segment.leaderAssigned}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {segment.notes && (
                                    <div className="text-sm text-gray-500 mt-2 italic">
                                      備註：{segment.notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
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
          {/* 分頁按鈕 */}
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>上一頁</Button>
            <span>第 {page} / {totalPages || 1} 頁</span>
            <Button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>下一頁</Button>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1 ml-2">
              {[5, 10, 20].map(size => <option key={size} value={size}>{size} 筆/頁</option>)}
            </select>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TripManagementPage;