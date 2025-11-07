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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col lg:flex-row">{/* 修正為 flex 佈局 */}
      {/* 手機端頂部導航 - 只在小螢幕顯示 */}
      <div className="block lg:hidden bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100/80 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              遊覽車管理
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 側邊欄 - 電腦版固定顯示，手機版可收合 */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 xl:w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-all duration-300 ease-out ${
        !isMobile ? 'translate-x-0' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
      } lg:translate-x-0 lg:flex-shrink-0`}>{/* 桌面版用相對定位，flex-shrink-0 防止壓縮 */}
        <div className="flex flex-col h-full">
          {/* Logo 區域 */}
          <div className="flex items-center justify-between h-16 lg:h-20 px-4 lg:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg lg:text-xl font-bold text-white">遊覽車管理</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl text-white/80 hover:bg-white/20 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 用戶信息 */}
          <div className="px-4 lg:px-6 py-4 lg:py-6 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="relative">
                <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-base lg:text-lg font-bold text-white">
                    {user?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base lg:text-lg font-semibold text-gray-900 truncate">{user?.displayName}</p>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{user?.roles?.join(' · ')}</p>
              </div>
            </div>
          </div>

          {/* 導航選單 */}
          <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-1 lg:space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`group flex items-center w-full px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium rounded-xl lg:rounded-2xl transition-all duration-200 ${
                  location.pathname === item.href
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:scale-105'
                }`}
              >
                <span className={`mr-3 lg:mr-4 transition-transform duration-200 ${
                  location.pathname === item.href ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
                {location.pathname === item.href && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>

          {/* 登出按鈕 */}
          <div className="p-3 lg:p-4 border-t border-gray-100 bg-gradient-to-t from-gray-50">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 lg:px-4 py-2 lg:py-3 text-sm font-medium text-gray-700 rounded-xl lg:rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-200 group"
            >
              <svg className="mr-3 lg:mr-4 h-4 w-4 lg:h-5 lg:w-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">登出</span>
            </button>
          </div>
        </div>
      </div>

      {/* 手機端遮罩 - 只在手機版顯示 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主要內容區域 - 手機版全寬，桌面版 flex-1 充滿剩餘空間 */}
      <div className="flex-1 w-full lg:pl-0">
        <main className="min-h-screen pb-20 lg:pb-0 w-full">
          {children}
        </main>
      </div>

      {/* 手機端底部導航 - 只在手機版顯示 */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;