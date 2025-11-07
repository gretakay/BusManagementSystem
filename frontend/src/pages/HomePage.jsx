import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { tripService, busService } from '../services/busService';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Layout from '../components/Layout';

const HomePage = () => {
  const [trips, setTrips] = useState([]);
  const [myBuses, setMyBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const user = authService.getCurrentUser();
  const isLeader = authService.hasRole('Leader');
  const isAdmin = authService.hasRole('AdminRead') || authService.hasRole('AdminWrite') || authService.hasRole('SysAdmin');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 如果是管理員，載入行程列表
      if (isAdmin) {
        const tripsData = await tripService.getTrips();
        setTrips(tripsData.data || []);
      }
      
      // 如果是領隊，載入我的車輛
      if (isLeader) {
        const busesData = await busService.getMyBuses();
        setMyBuses(busesData.data || []);
      }
    } catch (error) {
      setError('載入資料失敗');
      console.error('載入資料錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full px-1 sm:px-4 lg:px-8 xl:px-12 py-2 sm:py-4 lg:py-6">{/* 手機版最小邊距，桌面版充足邊距 */}
          {/* 頁面標題 */}
          <div className="mb-2 sm:mb-4 lg:mb-6">{/* 響應式間距 */}
            <div className="bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-2 sm:p-4 lg:p-6 shadow-xl border border-white/20">{/* 響應式圓角和內邊距 */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-1 lg:mb-0">
                  <h1 className="text-base sm:text-lg lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-0.5 sm:mb-1">
                    歡迎回來，{user?.displayName}
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-lg">
                    {new Date().toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>系統運行正常</span>
                  </div>
                  <div className="flex items-center space-x-2 px-2 py-1 lg:px-3 lg:py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs lg:text-sm font-medium text-blue-700">{user?.roles?.join(' · ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-2 sm:mb-3 lg:mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <div className="flex items-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium text-xs sm:text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 sm:space-y-3 lg:space-y-6">{/* 響應式間距 */}
            {/* 領隊專用區域 */}
            {isLeader && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-blue-600 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    我的車輛
                  </h2>
                  {myBuses.length > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {myBuses.length} 輛車輛
                    </div>
                  )}
                </div>
                
                {myBuses.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-3 sm:p-4 lg:p-8 text-center shadow-xl border border-white/20">
                    <div className="mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg sm:rounded-xl lg:rounded-3xl flex items-center justify-center mx-auto mb-1 sm:mb-2">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-10 lg:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-gray-900 mb-0.5 sm:mb-1">目前沒有分配到車輛</h3>
                      <p className="text-gray-500 text-xs sm:text-sm lg:text-base">請聯絡管理員進行車輛分配</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 lg:gap-4">{/* 響應式網格間距 */}
                    {myBuses.map((bus) => (
                      <div key={bus.id} className="group bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-2 sm:p-3 lg:p-5 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{bus.name}</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">{bus.tripName}</span>
                        </div>
                        
                        <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">{/* 響應式間距 */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-gray-600">容量</span>
                            <span className="text-xs lg:text-sm font-bold text-gray-900">{bus.capacity} 人</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-gray-600">已分配</span>
                            <span className="text-xs lg:text-sm font-bold text-blue-600">{bus.assignedCount} 人</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm text-gray-600">已上車</span>
                            <span className={`text-xs lg:text-sm font-bold ${bus.boardedCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {bus.boardedCount} 人
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">上車進度</span>
                              <span className="text-xs font-medium text-gray-700">
                                {bus.assignedCount > 0 ? Math.round((bus.boardedCount / bus.assignedCount) * 100) : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${bus.assignedCount > 0 ? (bus.boardedCount / bus.assignedCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <a 
                            href={`/scan?busId=${bus.id}`}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 px-3 rounded-xl text-xs lg:text-sm font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            開始掃碼
                          </a>
                          <a 
                            href={`/buses/${bus.id}/roster`}
                            className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-3 rounded-xl text-xs lg:text-sm font-bold hover:bg-gray-200 transform hover:scale-105 transition-all duration-200"
                          >
                            查看名單
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 管理員專用區域 */}
            {isAdmin && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base lg:text-2xl font-bold text-gray-900 flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-7 lg:h-7 text-purple-600 mr-1 sm:mr-2 lg:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    最近行程
                  </h2>
                  <a 
                    href="/trips" 
                    className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium bg-purple-50 px-1.5 sm:px-2 lg:px-4 py-0.5 sm:py-1 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl hover:bg-purple-100 transition-colors"
                  >
                    查看全部
                  </a>
                </div>
                
                {trips.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-lg rounded-xl lg:rounded-3xl p-4 lg:p-12 text-center shadow-xl border border-white/20">
                    <div className="mb-3">
                      <div className="w-12 h-12 lg:w-24 lg:h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl lg:rounded-3xl flex items-center justify-center mx-auto mb-2 lg:mb-4">
                        <svg className="w-6 h-6 lg:w-12 lg:h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-1 lg:mb-2">目前沒有行程</h3>
                      <p className="text-gray-500 mb-3 lg:mb-6 text-sm lg:text-base">建立您的第一個行程來開始管理遊覽車</p>
                      <a 
                        href="/trips/new"
                        className="inline-flex items-center px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs lg:text-sm font-bold rounded-xl lg:rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        建立第一個行程
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {trips.slice(0, 4).map((trip) => (
                      <div key={trip.id} className="group bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">{trip.name}</h3>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            trip.status === 'Open' ? 'bg-green-100 text-green-800' :
                            trip.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trip.status === 'Open' ? '進行中' : 
                             trip.status === 'Draft' ? '草稿' : '已結束'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {new Date(trip.date).toLocaleDateString('zh-TW')}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-blue-50 rounded-2xl p-3 text-center">
                            <p className="text-blue-600 font-medium">車輛數</p>
                            <p className="text-2xl font-bold text-blue-800">{trip.totalBuses}</p>
                          </div>
                          <div className="bg-purple-50 rounded-2xl p-3 text-center">
                            <p className="text-purple-600 font-medium">總容量</p>
                            <p className="text-2xl font-bold text-purple-800">{trip.totalCapacity}</p>
                          </div>
                          <div className="bg-orange-50 rounded-2xl p-3 text-center">
                            <p className="text-orange-600 font-medium">已分配</p>
                            <p className="text-2xl font-bold text-orange-800">{trip.totalAssigned}</p>
                          </div>
                          <div className="bg-green-50 rounded-2xl p-3 text-center">
                            <p className="text-green-600 font-medium">已上車</p>
                            <p className="text-2xl font-bold text-green-800">{trip.totalBoarded}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 快速操作區域 */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 text-green-600 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                快速操作
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-4">{/* 響應式網格間距 */}
                {isLeader && (
                  <a href="/scan" className="group bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-2 sm:p-3 lg:p-5 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-gradient-to-r from-blue-100 to-blue-200 rounded-md sm:rounded-lg lg:rounded-2xl flex items-center justify-center mx-auto mb-1 sm:mb-1 lg:mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-xs lg:text-sm font-bold text-gray-900">掃碼</p>
                  </a>
                )}
                
                {isAdmin && (
                  <>
                    <a href="/people/new" className="group bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-2 sm:p-3 lg:p-5 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-gradient-to-r from-green-100 to-green-200 rounded-md sm:rounded-lg lg:rounded-2xl flex items-center justify-center mx-auto mb-1 sm:mb-1 lg:mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-xs lg:text-sm font-bold text-gray-900">新增人員</p>
                    </a>
                    <a href="/trips/new" className="group bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-2 sm:p-3 lg:p-5 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-gradient-to-r from-purple-100 to-purple-200 rounded-md sm:rounded-lg lg:rounded-2xl flex items-center justify-center mx-auto mb-1 sm:mb-1 lg:mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-xs lg:text-sm font-bold text-gray-900">新增行程</p>
                    </a>
                    <a href="/reports" className="group bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-3xl p-2 sm:p-3 lg:p-5 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-gradient-to-r from-orange-100 to-orange-200 rounded-md sm:rounded-lg lg:rounded-2xl flex items-center justify-center mx-auto mb-1 sm:mb-1 lg:mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-xs lg:text-sm font-bold text-gray-900">統計報告</p>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;