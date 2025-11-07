import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const LeaderAssignmentPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTrip, setFilterTrip] = useState('all');

  const [formData, setFormData] = useState({
    leaderId: '',
    tripId: '',
    vehicleId: '',
    segment: 'outbound', // outbound, return, intermediate
    assignmentDate: '',
    startDate: '',
    endDate: '',
    notes: '',
    status: 'assigned'
  });

  // 模擬領隊資料（從人員管理中被指派為領隊的人員）
  const mockLeaders = [
    {
      id: 1,
      personId: 1,
      studentId: 'S001',
      name: '王德明',
      dharmaName: '德明',
      monastery: '台北精舍',
      identity: '師兄',
      phone: '0912-345-678',
      email: 'wang@example.com',
      leaderExpiry: '2025-12-31',
      leaderStatus: 'active',
      experience: ['一日遊', '多日遊', '宗教活動'],
      skills: ['急救證照', '導遊證照', '團康活動'],
      preferredRegions: ['北部', '東部'],
      currentAssignments: 2,
      maxAssignments: 5,
      totalLeaderTrips: 15,
      rating: 4.8
    },
    {
      id: 2,
      personId: 3,
      studentId: 'F001',
      name: '釋悟空',
      dharmaName: '悟空',
      monastery: '高雄精舍',
      identity: '法師',
      phone: '0934-567-890',
      email: 'wukong@example.com',
      leaderExpiry: '2025-11-30',
      leaderStatus: 'active',
      experience: ['朝聖之旅', '靜修活動', '講座活動'],
      skills: ['佛學講座', '禪修指導', '心靈輔導'],
      preferredRegions: ['南部', '中部'],
      currentAssignments: 1,
      maxAssignments: 3,
      totalLeaderTrips: 25,
      rating: 4.9
    },
    {
      id: 3,
      personId: 5,
      studentId: 'L001',
      name: '陳慧明',
      dharmaName: '慧明',
      monastery: '新竹精舍',
      identity: '師姊',
      phone: '0987-654-321',
      email: 'chen@example.com',
      leaderExpiry: '2024-12-15', // 即將到期
      leaderStatus: 'expiring',
      experience: ['親子活動', '文化體驗'],
      skills: ['兒童照護', '活動企劃'],
      preferredRegions: ['北部'],
      currentAssignments: 0,
      maxAssignments: 4,
      totalLeaderTrips: 8,
      rating: 4.6
    }
  ];

  // 模擬行程資料
  const mockTrips = [
    { id: 1, name: '台北陽明山一日遊', date: '2025-11-15', type: '一日遊', status: 'confirmed' },
    { id: 2, name: '九份老街文化之旅', date: '2025-11-20', type: '一日遊', status: 'planning' },
    { id: 3, name: '花蓮太魯閣三日遊', date: '2025-11-25', type: '多日遊', status: 'confirmed' }
  ];

  // 模擬車輛資料
  const mockVehicles = [
    { id: 1, name: '大型遊覽車A', type: 'bus', capacity: 42, plateNumber: 'ABC-1234' },
    { id: 2, name: '中型巴士B', type: 'midibus', capacity: 20, plateNumber: 'DEF-5678' },
    { id: 3, name: '九人座C', type: '9-seater', capacity: 8, plateNumber: 'GHI-9012' }
  ];

  // 模擬指派資料
  const mockAssignments = [
    {
      id: 1,
      leaderId: 1,
      leaderName: '王德明 (德明)',
      tripId: 1,
      tripName: '台北陽明山一日遊',
      vehicleId: 1,
      vehicleName: '大型遊覽車A',
      segment: 'outbound',
      assignmentDate: '2025-11-01',
      startDate: '2025-11-15',
      endDate: '2025-11-15',
      notes: '負責去程導覽',
      status: 'assigned',
      conflictCheck: 'no-conflict'
    },
    {
      id: 2,
      leaderId: 2,
      leaderName: '釋悟空 (悟空)',
      tripId: 2,
      tripName: '九份老街文化之旅',
      vehicleId: 2,
      vehicleName: '中型巴士B',
      segment: 'full-trip',
      assignmentDate: '2025-11-02',
      startDate: '2025-11-20',
      endDate: '2025-11-20',
      notes: '全程隨團法師',
      status: 'assigned',
      conflictCheck: 'no-conflict'
    },
    {
      id: 3,
      leaderId: 1,
      leaderName: '王德明 (德明)',
      tripId: 3,
      tripName: '花蓮太魯閣三日遊',
      vehicleId: 1,
      vehicleName: '大型遊覽車A',
      segment: 'return',
      assignmentDate: '2025-11-03',
      startDate: '2025-11-26',
      endDate: '2025-11-27',
      notes: '負責回程，時間衝突警告',
      status: 'conflict',
      conflictCheck: 'time-conflict'
    }
  ];

  useEffect(() => {
    setLeaders(mockLeaders);
    setTrips(mockTrips);
    setVehicles(mockVehicles);
    setAssignments(mockAssignments);
    setFilteredAssignments(mockAssignments);
  }, []);

  useEffect(() => {
    let filtered = assignments.filter(assignment => {
      const matchesSearch = 
        assignment.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.vehicleName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
      const matchesTrip = filterTrip === 'all' || assignment.tripId === parseInt(filterTrip);

      return matchesSearch && matchesStatus && matchesTrip;
    });

    setFilteredAssignments(filtered);
  }, [searchTerm, filterStatus, filterTrip, assignments]);

  // 檢查時間衝突
  const checkTimeConflict = (leaderId, startDate, endDate, excludeAssignmentId = null) => {
    const conflicts = assignments.filter(assignment => 
      assignment.leaderId === leaderId &&
      assignment.id !== excludeAssignmentId &&
      assignment.status !== 'cancelled' &&
      (
        (startDate <= assignment.endDate && endDate >= assignment.startDate)
      )
    );
    return conflicts;
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    
    // 檢查時間衝突
    const conflicts = checkTimeConflict(
      parseInt(formData.leaderId), 
      formData.startDate, 
      formData.endDate
    );

    const newAssignment = {
      id: assignments.length + 1,
      leaderId: parseInt(formData.leaderId),
      leaderName: leaders.find(l => l.id === parseInt(formData.leaderId))?.name + ' (' + leaders.find(l => l.id === parseInt(formData.leaderId))?.dharmaName + ')',
      tripId: parseInt(formData.tripId),
      tripName: trips.find(t => t.id === parseInt(formData.tripId))?.name,
      vehicleId: parseInt(formData.vehicleId),
      vehicleName: vehicles.find(v => v.id === parseInt(formData.vehicleId))?.name,
      segment: formData.segment,
      assignmentDate: new Date().toISOString().split('T')[0],
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes,
      status: conflicts.length > 0 ? 'conflict' : 'assigned',
      conflictCheck: conflicts.length > 0 ? 'time-conflict' : 'no-conflict'
    };
    
    setAssignments(prev => [newAssignment, ...prev]);
    resetForm();
    setShowCreateForm(false);

    if (conflicts.length > 0) {
      alert(`警告：領隊 ${newAssignment.leaderName} 在此時間段已有其他指派任務！`);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment.id);
    setFormData({
      leaderId: assignment.leaderId.toString(),
      tripId: assignment.tripId.toString(),
      vehicleId: assignment.vehicleId.toString(),
      segment: assignment.segment,
      assignmentDate: assignment.assignmentDate,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      notes: assignment.notes,
      status: assignment.status
    });
    setShowCreateForm(true);
  };

  const handleUpdateAssignment = (e) => {
    e.preventDefault();
    
    const conflicts = checkTimeConflict(
      parseInt(formData.leaderId), 
      formData.startDate, 
      formData.endDate,
      editingAssignment
    );

    setAssignments(prev => prev.map(assignment =>
      assignment.id === editingAssignment
        ? {
            ...assignment,
            leaderId: parseInt(formData.leaderId),
            leaderName: leaders.find(l => l.id === parseInt(formData.leaderId))?.name + ' (' + leaders.find(l => l.id === parseInt(formData.leaderId))?.dharmaName + ')',
            tripId: parseInt(formData.tripId),
            tripName: trips.find(t => t.id === parseInt(formData.tripId))?.name,
            vehicleId: parseInt(formData.vehicleId),
            vehicleName: vehicles.find(v => v.id === parseInt(formData.vehicleId))?.name,
            segment: formData.segment,
            startDate: formData.startDate,
            endDate: formData.endDate,
            notes: formData.notes,
            status: conflicts.length > 0 ? 'conflict' : 'assigned',
            conflictCheck: conflicts.length > 0 ? 'time-conflict' : 'no-conflict'
          }
        : assignment
    ));
    
    resetForm();
    setShowCreateForm(false);
    setEditingAssignment(null);

    if (conflicts.length > 0) {
      alert(`警告：更新後發現時間衝突！`);
    }
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (window.confirm('確定要取消此領隊指派嗎？')) {
      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
    }
  };

  const resetForm = () => {
    setFormData({
      leaderId: '',
      tripId: '',
      vehicleId: '',
      segment: 'outbound',
      assignmentDate: '',
      startDate: '',
      endDate: '',
      notes: '',
      status: 'assigned'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-green-100 text-green-800';
      case 'conflict': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'assigned': return '已指派';
      case 'conflict': return '時間衝突';
      case 'pending': return '待確認';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getSegmentLabel = (segment) => {
    switch (segment) {
      case 'outbound': return '去程';
      case 'return': return '回程';
      case 'intermediate': return '中繼段';
      case 'full-trip': return '全程';
      default: return segment;
    }
  };

  const getLeaderStatusColor = (leader) => {
    if (new Date(leader.leaderExpiry) < new Date()) {
      return 'text-red-600';
    } else if (new Date(leader.leaderExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-8 h-8 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                領隊指派管理
              </h1>
              <p className="text-gray-600">管理領隊與行程車輛的指派，檢查時間衝突與帳號效期</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新增指派
              </Button>
            </div>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-indigo-600">{leaders.length}</div>
            <div className="text-sm text-gray-600">可用領隊</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'assigned').length}
            </div>
            <div className="text-sm text-gray-600">已指派</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">
              {assignments.filter(a => a.status === 'conflict').length}
            </div>
            <div className="text-sm text-gray-600">時間衝突</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {leaders.filter(l => l.leaderStatus === 'expiring').length}
            </div>
            <div className="text-sm text-gray-600">即將到期</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {leaders.reduce((sum, leader) => sum + leader.currentAssignments, 0)}
            </div>
            <div className="text-sm text-gray-600">總指派數</div>
          </div>
        </div>

        {/* 搜尋和篩選 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Input
                type="text"
                placeholder="搜尋領隊、行程或車輛..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">所有狀態</option>
              <option value="assigned">已指派</option>
              <option value="conflict">時間衝突</option>
              <option value="pending">待確認</option>
              <option value="cancelled">已取消</option>
            </select>

            <select
              value={filterTrip}
              onChange={(e) => setFilterTrip(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">所有行程</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 領隊狀態概覽 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">領隊狀態概覽</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaders.map((leader) => (
              <div key={leader.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">
                    {leader.name} ({leader.dharmaName})
                  </h3>
                  <span className={`text-sm font-medium ${getLeaderStatusColor(leader)}`}>
                    {leader.leaderStatus === 'active' ? '正常' : '即將到期'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📱 {leader.phone}</div>
                  <div>🏛️ {leader.monastery}</div>
                  <div>📅 效期至：{leader.leaderExpiry}</div>
                  <div>📊 指派：{leader.currentAssignments}/{leader.maxAssignments}</div>
                  <div>⭐ 評分：{leader.rating}/5.0</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {leader.skills.slice(0, 2).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 新增/編輯指派表單 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingAssignment ? '編輯領隊指派' : '新增領隊指派'}
            </h2>
            <form onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">選擇領隊 *</label>
                  <select
                    value={formData.leaderId}
                    onChange={(e) => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">請選擇領隊</option>
                    {leaders.filter(l => l.leaderStatus === 'active').map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name} ({leader.dharmaName}) - {leader.monastery} ({leader.currentAssignments}/{leader.maxAssignments})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">選擇行程 *</label>
                  <select
                    value={formData.tripId}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">請選擇行程</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name} ({trip.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">選擇車輛 *</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">請選擇車輛</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.plateNumber}) - 載客 {vehicle.capacity} 人
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">負責段次 *</label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="outbound">去程</option>
                    <option value="return">回程</option>
                    <option value="intermediate">中繼段</option>
                    <option value="full-trip">全程</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="開始日期 *"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
                
                <Input
                  label="結束日期 *"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">備註</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="特殊要求或注意事項..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAssignment(null);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                  {editingAssignment ? '更新指派' : '確認指派'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 指派列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            領隊指派列表 ({filteredAssignments.length} 項)
          </h2>
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        🎖️ {assignment.leaderName}
                      </h3>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {getSegmentLabel(assignment.segment)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignment.status)}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                      {assignment.conflictCheck === 'time-conflict' && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          ⚠️ 時間衝突
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">行程：</span>{assignment.tripName}
                      </div>
                      <div>
                        <span className="font-medium">車輛：</span>{assignment.vehicleName}
                      </div>
                      <div>
                        <span className="font-medium">開始：</span>{assignment.startDate}
                      </div>
                      <div>
                        <span className="font-medium">結束：</span>{assignment.endDate}
                      </div>
                    </div>

                    {assignment.notes && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">備註：</span>{assignment.notes}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div>指派日期：{assignment.assignmentDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      編輯
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      取消指派
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              沒有找到符合條件的領隊指派資料
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeaderAssignmentPage;