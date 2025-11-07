import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import MobileBottomNav from './MobileBottomNav';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // 手機版預設關閉
  const [isMobile, setIsMobile] = useState(false);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // 電腦版預設開啟側邊欄，手機版預設關閉
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const navigation = [
    {
      name: '首頁',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ['Leader', 'AdminRead', 'AdminWrite', 'SysAdmin']
    },
    {
      name: '掃碼',
      href: '/scan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      roles: ['Leader']
    },
    {
      name: '行程管理',
      href: '/trips',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['AdminRead', 'AdminWrite', 'SysAdmin']
    },
    {
      name: '人員管理',
      href: '/people',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      roles: ['AdminRead', 'AdminWrite', 'SysAdmin']
    },
    {
      name: '報表',
      href: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['AdminRead', 'AdminWrite', 'SysAdmin']
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => user?.roles?.includes(role))
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 手機版：抽屜式側邊欄 */}
      <div className="lg:hidden">
        {/* 手機版頂部導航欄 */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900">遊覽車管理</h1>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* 手機版抽屜式側邊欄 */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* 側邊欄頭部 */}
            <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-purple-500 to-indigo-600">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">遊覽車管理</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-white/80 hover:bg-white/20 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 用戶信息 */}
            <div className="px-6 py-6 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">
                      {user?.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-gray-900 truncate">{user?.displayName}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.roles?.join(' · ')}</p>
                </div>
              </div>
            </div>

            {/* 導航選單 */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {filteredNavigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <span className="mr-4">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                  {location.pathname === item.href && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </nav>

            {/* 登出按鈕 */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
              >
                <svg className="mr-4 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">登出</span>
              </button>
            </div>
          </div>
        </div>

        {/* 手機版遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 手機版主內容 - 卡片式設計 */}
        <div className="p-4">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <main className="pb-20">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* 桌面版：典型後台佈局 */}
      <div className="hidden lg:flex h-screen bg-gray-100 overflow-hidden">
        <div className="flex w-full">
          {/* 桌面版側邊欄 */}
          <div className="w-80 bg-gradient-to-b from-purple-50 to-indigo-50 border-r border-gray-200">
            <div className="h-full flex flex-col">
              {/* Logo 區域 */}
              <div className="flex items-center h-20 px-6 bg-gradient-to-r from-purple-500 to-indigo-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-white">遊覽車管理</h1>
                </div>
              </div>

              {/* 用戶信息 */}
              <div className="px-6 py-6 border-b border-purple-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">
                        {user?.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900 truncate">{user?.displayName}</p>
                    <p className="text-sm text-purple-600 truncate">{user?.roles?.join(' · ')}</p>
                  </div>
                </div>
              </div>

              {/* 導航選單 */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {filteredNavigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      location.pathname === item.href
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                    }`}
                  >
                    <span className="mr-4">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                    {location.pathname === item.href && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}
              </nav>

              {/* 登出按鈕 */}
              <div className="p-4 border-t border-purple-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                >
                  <svg className="mr-4 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">登出</span>
                </button>
              </div>
            </div>
          </div>

          {/* 桌面版主內容區域 */}
          <div className="flex-1 h-full overflow-y-auto bg-gray-50">
            <main className="min-h-full">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* 手機端底部導航 */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;