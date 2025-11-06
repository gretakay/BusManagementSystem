import { authService } from '../services/authService';

const MobileBottomNav = () => {
  const user = authService.getCurrentUser();
  const isLeader = authService.hasRole('Leader');
  const isAdmin = authService.hasRole('AdminRead') || authService.hasRole('AdminWrite') || authService.hasRole('SysAdmin');

  const navigation = [
    {
      name: '首頁',
      href: '/',
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ['Leader', 'AdminRead', 'AdminWrite', 'SysAdmin']
    }
  ];

  // 根據角色動態添加導航項目
  if (isLeader) {
    navigation.push({
      name: '掃碼',
      href: '/scan',
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      roles: ['Leader']
    });
  }

  if (isAdmin) {
    navigation.push(
      {
        name: '行程',
        href: '/trips',
        icon: (active) => (
          <svg className={`w-6 h-6 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        roles: ['AdminRead', 'AdminWrite', 'SysAdmin']
      },
      {
        name: '人員',
        href: '/people',
        icon: (active) => (
          <svg className={`w-6 h-6 ${active ? 'text-orange-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        roles: ['AdminRead', 'AdminWrite', 'SysAdmin']
      }
    );
  }

  // 添加更多選項
  navigation.push({
    name: '更多',
    href: '/menu',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-gray-800' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    roles: ['Leader', 'AdminRead', 'AdminWrite', 'SysAdmin']
  });

  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => user?.roles?.includes(role))
  );

  const currentPath = window.location.pathname;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {filteredNavigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 transition-all duration-200 ${
                isActive 
                  ? 'bg-gray-50 transform scale-105' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="mb-1">
                {item.icon(isActive)}
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;