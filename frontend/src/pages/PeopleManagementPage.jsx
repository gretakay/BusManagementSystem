import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const PeopleManagementPage = () => {
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrip, setFilterTrip] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterIdentity, setFilterIdentity] = useState('all');
  const [filterLeader, setFilterLeader] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    monastery: '',
    name: '',
    dharmaName: '',
    identity: '',
    gender: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    specialNeeds: '',
    notes: '',
    tripId: null
  });

  // 精舍別選項
  const monasteries = [
    '台北精舍', '台中精舍', '高雄精舍', '花蓮精舍', '台南精舍', 
    '桃園精舍', '新竹精舍', '嘉義精舍', '宜蘭精舍', '台東精舍'
  ];

  // 身分別選項
  const identities = [
    '法師', '師兄', '師姊', '志工', '職工', '學員', '訪客', '其他'
  ];

  // 性別選項
  const genders = [
    { value: 'male', label: '男', icon: '👨' },
    { value: 'female', label: '女', icon: '👩' }
  ];

  // 特殊需求選項
  const specialNeedsOptions = [
    '輪椅', '拐杖', '素食', '過敏', '慢性病', '行動不便', '視力不佳', '聽力不佳'
  ];

  // 模擬行程資料（從行程管理獲取）
  const trips = [
    { id: 1, name: '台北陽明山一日遊', date: '2025-11-15' },
    { id: 2, name: '九份老街文化之旅', date: '2025-11-20' },
    { id: 3, name: '花蓮太魯閣三日遊', date: '2025-11-25' }
  ];

  // 範例人員資料
  const mockPeople = [
    {
      id: 1,
      studentId: 'S001',
      monastery: '台北精舍',
      name: '王德明',
      dharmaName: '德明',
      identity: '師兄',
      gender: 'male',
      phone: '0912-345-678',
      emergencyContact: '王媽媽',
      emergencyPhone: '02-2345-6789',
      specialNeeds: ['素食'],
      notes: '',
      tripId: 1,
      tripName: '台北陽明山一日遊',
      registeredAt: '2025-11-01T10:00:00',
      status: 'confirmed',
      qrCode: 'QR001',
      isLeader: true,
      leaderExpiry: '2025-12-31',
      leaderAssignedDate: '2025-01-15',
      leaderStatus: 'active'
    },
    {
      id: 2,
      studentId: 'S002',
      monastery: '台中精舍',
      name: '李慧心',
      dharmaName: '慧心',
      identity: '師姊',
      gender: 'female',
      phone: '0923-456-789',
      emergencyContact: '李先生',
      emergencyPhone: '04-2345-6789',
      specialNeeds: ['素食', '輪椅'],
      notes: '需要協助上下車',
      tripId: 1,
      tripName: '台北陽明山一日遊',
      registeredAt: '2025-11-02T14:30:00',
      status: 'confirmed',
      qrCode: 'QR002'
    },
    {
      id: 3,
      studentId: 'F001',
      monastery: '高雄精舍',
      name: '釋悟空',
      dharmaName: '悟空',
      identity: '法師',
      gender: 'male',
      phone: '0934-567-890',
      emergencyContact: '',
      emergencyPhone: '',
      specialNeeds: [],
      notes: '隨團法師',
      tripId: 2,
      tripName: '九份老街文化之旅',
      registeredAt: '2025-11-03T09:15:00',
      status: 'confirmed',
      qrCode: 'QR003',
      isLeader: true,
      leaderExpiry: '2025-11-30',
      leaderAssignedDate: '2025-02-01',
      leaderStatus: 'active'
    },
    {
      id: 4,
      studentId: 'V001',
      monastery: '花蓮精舍',
      name: '陳志工',
      dharmaName: '智慧',
      identity: '志工',
      gender: 'male',
      phone: '0945-678-901',
      emergencyContact: '陳太太',
      emergencyPhone: '03-345-6789',
      specialNeeds: ['素食'],
      notes: '',
      tripId: null,
      tripName: null,
      registeredAt: '2025-11-04T16:20:00',
      status: 'pending',
      qrCode: 'QR004'
    }
  ];

  useEffect(() => {
    setPeople(mockPeople);
    setFilteredPeople(mockPeople);
  }, []);

  useEffect(() => {
    let filtered = people.filter(person => {
      const matchesSearch = 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.dharmaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.monastery.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTrip = filterTrip === 'all' || 
        (filterTrip === 'assigned' && person.tripId) ||
        (filterTrip === 'unassigned' && !person.tripId) ||
        person.tripId === parseInt(filterTrip);

      const matchesGender = filterGender === 'all' || person.gender === filterGender;
      const matchesIdentity = filterIdentity === 'all' || person.identity === filterIdentity;
      const matchesLeader = filterLeader === 'all' || 
        (filterLeader === 'leader' && person.isLeader) ||
        (filterLeader === 'non-leader' && !person.isLeader);

      return matchesSearch && matchesTrip && matchesGender && matchesIdentity && matchesLeader;
    });

    setFilteredPeople(filtered);
  }, [searchTerm, filterTrip, filterGender, filterIdentity, filterLeader, people]);

  const handleCreatePerson = (e) => {
    e.preventDefault();
    const newPerson = {
      id: people.length + 1,
      ...formData,
      specialNeeds: formData.specialNeeds ? formData.specialNeeds.split(',').map(s => s.trim()) : [],
      tripName: selectedTrip ? trips.find(t => t.id === parseInt(selectedTrip))?.name : null,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
      qrCode: `QR${String(people.length + 1).padStart(3, '0')}`
    };
    
    setPeople(prev => [newPerson, ...prev]);
    resetForm();
    setShowCreateForm(false);
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person.id);
    setFormData({
      studentId: person.studentId,
      monastery: person.monastery,
      name: person.name,
      dharmaName: person.dharmaName,
      identity: person.identity,
      gender: person.gender,
      phone: person.phone || '',
      emergencyContact: person.emergencyContact || '',
      emergencyPhone: person.emergencyPhone || '',
      specialNeeds: person.specialNeeds ? person.specialNeeds.join(', ') : '',
      notes: person.notes || '',
      tripId: person.tripId
    });
    setSelectedTrip(person.tripId ? String(person.tripId) : '');
    setShowCreateForm(true);
  };

  const handleUpdatePerson = (e) => {
    e.preventDefault();
    setPeople(prev => prev.map(person =>
      person.id === editingPerson
        ? {
            ...person,
            ...formData,
            specialNeeds: formData.specialNeeds ? formData.specialNeeds.split(',').map(s => s.trim()) : [],
            tripName: selectedTrip ? trips.find(t => t.id === parseInt(selectedTrip))?.name : null
          }
        : person
    ));
    resetForm();
    setShowCreateForm(false);
    setEditingPerson(null);
  };

  const handleDeletePerson = (personId) => {
    if (window.confirm('確定要刪除這位人員嗎？')) {
      setPeople(prev => prev.filter(person => person.id !== personId));
    }
  };

  // 指派為領隊
  const handleAssignLeader = (personId) => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 預設一年期限
    
    if (window.confirm('確定要指派此人員為領隊嗎？領隊帳號效期為一年。')) {
      setPeople(prev => prev.map(person =>
        person.id === personId
          ? {
              ...person,
              isLeader: true,
              leaderExpiry: expiryDate.toISOString().split('T')[0],
              leaderAssignedDate: new Date().toISOString().split('T')[0],
              leaderStatus: 'active'
            }
          : person
      ));
    }
  };

  // 取消領隊資格
  const handleRevokeLeader = (personId) => {
    if (window.confirm('確定要取消此人員的領隊資格嗎？')) {
      setPeople(prev => prev.map(person =>
        person.id === personId
          ? {
              ...person,
              isLeader: false,
              leaderExpiry: null,
              leaderAssignedDate: null,
              leaderStatus: null
            }
          : person
      ));
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      monastery: '',
      name: '',
      dharmaName: '',
      identity: '',
      gender: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      specialNeeds: '',
      notes: '',
      tripId: null
    });
    setSelectedTrip('');
  };

  const handleImportData = () => {
    // TODO: 實際的檔案匯入功能
    const sampleData = [
      {
        studentId: 'S005',
        monastery: '新竹精舍',
        name: '張慈悲',
        dharmaName: '慈悲',
        identity: '師姊',
        gender: 'female'
      },
      {
        studentId: 'S006',
        monastery: '桃園精舍',
        name: '劉智慧',
        dharmaName: '智慧',
        identity: '師兄',
        gender: 'male'
      }
    ];

    const importedPeople = sampleData.map((data, index) => ({
      id: people.length + index + 1,
      ...data,
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      specialNeeds: [],
      notes: '',
      tripId: null,
      tripName: null,
      registeredAt: new Date().toISOString(),
      status: 'pending',
      qrCode: `QR${String(people.length + index + 1).padStart(3, '0')}`
    }));

    setPeople(prev => [...importedPeople, ...prev]);
    setShowImportForm(false);
    alert(`成功匯入 ${sampleData.length} 筆資料`);
  };

  const getGenderDisplay = (gender) => {
    const genderConfig = genders.find(g => g.value === gender);
    return genderConfig || { label: gender, icon: '👤' };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'pending': return '待確認';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                人員管理
              </h1>
              <p className="text-gray-600">管理參團人員資料，包含學號、精舍別、法名等資訊</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowImportForm(true)}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                匯入資料
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新增人員
              </Button>
            </div>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">{people.length}</div>
            <div className="text-sm text-gray-600">總人數</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {people.filter(p => p.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600">已確認</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {people.filter(p => p.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">待確認</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {people.filter(p => p.tripId).length}
            </div>
            <div className="text-sm text-gray-600">已分配行程</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {people.filter(p => p.isLeader).length}
            </div>
            <div className="text-sm text-gray-600">🎖️ 領隊</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {people.filter(p => p.specialNeeds && p.specialNeeds.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">特殊需求</div>
          </div>
        </div>

        {/* 搜尋和篩選 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                type="text"
                placeholder="搜尋姓名、法名、學號或精舍..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={filterTrip}
              onChange={(e) => setFilterTrip(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">所有行程</option>
              <option value="assigned">已分配行程</option>
              <option value="unassigned">未分配行程</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>

            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">所有性別</option>
              {genders.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.icon} {gender.label}
                </option>
              ))}
            </select>

            <select
              value={filterIdentity}
              onChange={(e) => setFilterIdentity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">所有身分</option>
              {identities.map((identity) => (
                <option key={identity} value={identity}>
                  {identity}
                </option>
              ))}
            </select>

            <select
              value={filterLeader}
              onChange={(e) => setFilterLeader(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">全部人員</option>
              <option value="leader">🎖️ 僅領隊</option>
              <option value="non-leader">👥 非領隊</option>
            </select>
          </div>
        </div>

        {/* 匯入資料表單 */}
        {showImportForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">匯入人員資料</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">匯入格式說明</h3>
                <p className="text-blue-800 text-sm mb-2">Excel/CSV 檔案應包含以下欄位：</p>
                <div className="text-blue-700 text-sm space-y-1">
                  <div>• 學號 (必填)</div>
                  <div>• 精舍別 (必填)</div>
                  <div>• 姓名 (必填)</div>
                  <div>• 法名 (必填)</div>
                  <div>• 身分別 (必填)</div>
                  <div>• 性別 (必填)</div>
                  <div>• 電話 (選填)</div>
                  <div>• 緊急聯絡人 (選填)</div>
                  <div>• 緊急聯絡電話 (選填)</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇檔案</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportForm(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleImportData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  確認匯入
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 新增/編輯人員表單 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPerson ? '編輯人員資料' : '新增人員'}
            </h2>
            <form onSubmit={editingPerson ? handleUpdatePerson : handleCreatePerson} className="space-y-4">
              {/* 基本資料 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="學號 *"
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  placeholder="例：S001"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">精舍別 *</label>
                  <select
                    value={formData.monastery}
                    onChange={(e) => setFormData(prev => ({ ...prev, monastery: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">選擇精舍</option>
                    {monasteries.map((monastery) => (
                      <option key={monastery} value={monastery}>
                        {monastery}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="姓名 *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="真實姓名"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="法名 *"
                  type="text"
                  value={formData.dharmaName}
                  onChange={(e) => setFormData(prev => ({ ...prev, dharmaName: e.target.value }))}
                  placeholder="法名"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">身分別 *</label>
                  <select
                    value={formData.identity}
                    onChange={(e) => setFormData(prev => ({ ...prev, identity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">選擇身分</option>
                    {identities.map((identity) => (
                      <option key={identity} value={identity}>
                        {identity}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性別 *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">選擇性別</option>
                    {genders.map((gender) => (
                      <option key={gender.value} value={gender.value}>
                        {gender.icon} {gender.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 聯絡資訊 */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">聯絡資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="手機號碼"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0912-345-678"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">分配行程</label>
                    <select
                      value={selectedTrip}
                      onChange={(e) => {
                        setSelectedTrip(e.target.value);
                        setFormData(prev => ({ ...prev, tripId: e.target.value ? parseInt(e.target.value) : null }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">未分配行程</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name} ({trip.date})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input
                    label="緊急聯絡人"
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="緊急聯絡人姓名"
                  />
                  
                  <Input
                    label="緊急聯絡電話"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    placeholder="緊急聯絡人電話"
                  />
                </div>
              </div>

              {/* 特殊需求 */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">特殊需求與備註</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">特殊需求</label>
                    <Input
                      type="text"
                      value={formData.specialNeeds}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialNeeds: e.target.value }))}
                      placeholder="例：素食, 輪椅, 過敏 (用逗號分隔)"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {specialNeedsOptions.map((need) => (
                        <button
                          key={need}
                          type="button"
                          onClick={() => {
                            const currentNeeds = formData.specialNeeds ? formData.specialNeeds.split(',').map(s => s.trim()) : [];
                            if (currentNeeds.includes(need)) {
                              const updatedNeeds = currentNeeds.filter(n => n !== need);
                              setFormData(prev => ({ ...prev, specialNeeds: updatedNeeds.join(', ') }));
                            } else {
                              setFormData(prev => ({ ...prev, specialNeeds: [...currentNeeds, need].join(', ') }));
                            }
                          }}
                          className={`px-3 py-1 text-sm rounded-full border ${
                            formData.specialNeeds && formData.specialNeeds.includes(need)
                              ? 'bg-purple-100 border-purple-300 text-purple-800'
                              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {need}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">備註</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="其他需要注意的事項..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPerson(null);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-purple-500 to-indigo-600">
                  {editingPerson ? '更新資料' : '新增人員'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 人員列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            人員名單 ({filteredPeople.length} 人)
          </h2>
          <div className="space-y-4">
            {filteredPeople.map((person) => {
              const genderDisplay = getGenderDisplay(person.gender);
              
              return (
                <div key={person.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{genderDisplay.icon}</span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {person.name} ({person.dharmaName})
                        </h3>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {person.studentId}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          {person.identity}
                        </span>
                        {person.isLeader && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            person.leaderStatus === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            🎖️ 領隊
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(person.status)}`}>
                          {getStatusLabel(person.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">精舍：</span>{person.monastery}
                        </div>
                        <div>
                          <span className="font-medium">性別：</span>{genderDisplay.label}
                        </div>
                        {person.phone && (
                          <div>
                            <span className="font-medium">電話：</span>{person.phone}
                          </div>
                        )}
                        {person.tripName && (
                          <div>
                            <span className="font-medium">行程：</span>{person.tripName}
                          </div>
                        )}
                      </div>

                      {person.isLeader && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-green-600 font-medium">🎖️ 領隊資訊</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">指派日期：</span>
                              <span className="text-gray-600">{person.leaderAssignedDate}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">帳號效期：</span>
                              <span className={`${new Date(person.leaderExpiry) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                                {person.leaderExpiry}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">狀態：</span>
                              <span className={`${person.leaderStatus === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {person.leaderStatus === 'active' ? '正常' : '即將到期'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {person.specialNeeds && person.specialNeeds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-sm text-gray-600 font-medium">特殊需求：</span>
                          {person.specialNeeds.map((need, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              {need}
                            </span>
                          ))}
                        </div>
                      )}

                      {person.notes && (
                        <div className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">備註：</span>{person.notes}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div>QR碼：{person.qrCode}</div>
                        <div>註冊時間：{new Date(person.registeredAt).toLocaleString('zh-TW')}</div>
                        {person.emergencyContact && (
                          <div>緊急聯絡人：{person.emergencyContact}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPerson(person)}
                      >
                        編輯
                      </Button>
                      {!person.isLeader ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignLeader(person.id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          指派領隊
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeLeader(person.id)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          取消領隊
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        QR碼
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePerson(person.id)}
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

          {filteredPeople.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              沒有找到符合條件的人員資料
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PeopleManagementPage;