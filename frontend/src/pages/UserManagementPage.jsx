import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    roles: []
  });

  const roles = [
    { value: 'Leader', label: '領隊', description: '負責車輛管理和乘客掃碼' },
    { value: 'AdminRead', label: '只讀管理員', description: '可查看所有資料但不能修改' },
    { value: 'AdminWrite', label: '讀寫管理員', description: '可管理行程、車輛和人員' },
    { value: 'SysAdmin', label: '系統管理員', description: '完整系統管理權限' }
  ];

  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      displayName: '管理員',
      roles: ['AdminWrite'],
      isActive: true,
      lastLogin: '2025-11-07T10:30:00'
    },
    {
      id: 2,
      username: 'sysadmin',
      displayName: '系統管理員',
      roles: ['SysAdmin'],
      isActive: true,
      lastLogin: '2025-11-07T09:15:00'
    },
    {
      id: 3,
      username: 'leader001',
      displayName: '領隊小王',
      roles: ['Leader'],
      isActive: true,
      lastLogin: '2025-11-06T14:45:00'
    }
  ];

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const handleCreateUser = (e) => {
    e.preventDefault();
    // TODO: 實際的 API 呼叫
    console.log('Creating user:', formData);
    setShowCreateForm(false);
    setFormData({ username: '', displayName: '', password: '', roles: [] });
  };

  const handleRoleChange = (roleValue, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, roleValue]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roles: prev.roles.filter(role => role !== roleValue)
      }));
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                帳號管理
              </h1>
              <p className="text-gray-600">建立、編輯和管理系統使用者帳號</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新增帳號
            </Button>
          </div>
        </div>

        {/* 建立帳號表單 */}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">建立新帳號</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="使用者名稱"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="輸入使用者名稱"
                  required
                />
                <Input
                  label="顯示名稱"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="輸入顯示名稱"
                  required
                />
              </div>
              
              <Input
                label="密碼"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="輸入密碼"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">角色權限</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <label key={role.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role.value)}
                        onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{role.label}</div>
                        <div className="text-sm text-gray-500">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-purple-500 to-indigo-600">
                  建立帳號
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 帳號列表 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">現有帳號</h2>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.displayName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {user.roles.map((role) => (
                        <span key={role} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {roles.find(r => r.value === role)?.label || role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? '啟用' : '停用'}
                    </div>
                    <div className="text-xs text-gray-500">
                      上次登入: {new Date(user.lastLogin).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.id)}
                    className={user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
                  >
                    {user.isActive ? '停用' : '啟用'}
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    編輯
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserManagementPage;