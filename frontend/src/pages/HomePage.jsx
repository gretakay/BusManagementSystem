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
      <div className="p-4 space-y-6">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            歡迎回來，{user?.displayName}
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('zh-TW', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <p className="text-danger-700">{error}</p>
          </div>
        )}

        {/* 領隊專用區域 */}
        {isLeader && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">我的車輛</h2>
            {myBuses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">目前沒有分配到車輛</p>
                  <p className="text-sm text-gray-400 mt-2">請聯絡管理員進行車輛分配</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBuses.map((bus) => (
                  <Card key={bus.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{bus.name}</h3>
                        <span className="text-sm text-gray-500">{bus.tripName}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">容量:</span>
                          <span className="text-sm font-medium">{bus.capacity} 人</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">分配:</span>
                          <span className="text-sm font-medium">{bus.assignedCount} 人</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">已上車:</span>
                          <span className={`text-sm font-medium ${bus.boardedCount > 0 ? 'text-success-600' : 'text-gray-500'}`}>
                            {bus.boardedCount} 人
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${bus.assignedCount > 0 ? (bus.boardedCount / bus.assignedCount) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            上車率: {bus.assignedCount > 0 ? Math.round((bus.boardedCount / bus.assignedCount) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <a 
                          href={`/scan?busId=${bus.id}`}
                          className="flex-1 bg-primary-600 text-white text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          開始掃碼
                        </a>
                        <a 
                          href={`/buses/${bus.id}/roster`}
                          className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          查看名單
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 管理員專用區域 */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">最近行程</h2>
              <a 
                href="/trips" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                查看全部
              </a>
            </div>
            
            {trips.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v6m-4-3v3m8-3v3m4-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-4">目前沒有行程</p>
                  <a 
                    href="/trips/new"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                  >
                    建立第一個行程
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {trips.slice(0, 4).map((trip) => (
                  <Card key={trip.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          trip.status === 'Open' ? 'bg-success-100 text-success-800' :
                          trip.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-warning-100 text-warning-800'
                        }`}>
                          {trip.status === 'Open' ? '進行中' : 
                           trip.status === 'Draft' ? '草稿' : '已結束'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(trip.date).toLocaleDateString('zh-TW')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">車輛數</p>
                          <p className="font-medium">{trip.totalBuses}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">總容量</p>
                          <p className="font-medium">{trip.totalCapacity}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">已分配</p>
                          <p className="font-medium">{trip.totalAssigned}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">已上車</p>
                          <p className="font-medium text-success-600">{trip.totalBoarded}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 快速操作區域 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">快速操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLeader && (
              <a href="/scan" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-200">
                <div className="text-2xl mb-2">📱</div>
                <p className="text-sm font-medium text-gray-900">掃碼</p>
              </a>
            )}
            
            {isAdmin && (
              <>
                <a href="/people/new" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-200">
                  <div className="text-2xl mb-2">👤</div>
                  <p className="text-sm font-medium text-gray-900">新增人員</p>
                </a>
                <a href="/trips/new" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-200">
                  <div className="text-2xl mb-2">📅</div>
                  <p className="text-sm font-medium text-gray-900">新增行程</p>
                </a>
                <a href="/reports" className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-200">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm font-medium text-gray-900">查看報表</p>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;