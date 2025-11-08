import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import { signalRService } from './services/signalRService';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import UserManagementPage from './pages/UserManagementPage';
import DatabaseManagementPage from './pages/DatabaseManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import VehicleManagementPage from './pages/VehicleManagementPage';
import TripManagementPage from './pages/TripManagementPage';
import StationManagementPage from './pages/StationManagementPage';
import PeopleManagementPage from './pages/PeopleManagementPage';
import LeaderAssignmentPage from './pages/LeaderAssignmentPage';
import QRScanPage from './pages/QRScanPage';
import TripRegistrationImportPage from './pages/TripRegistrationImportPage';

// 受保護的路由組件
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // 初始化 SignalR 連線
        await signalRService.initialize();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router basename="/BusManagementSystem">
      <Routes>
        {/* 登入頁面 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 受保護的首頁 */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 其他受保護的路由 */}
        <Route 
          path="/scan" 
          element={
            <ProtectedRoute>
              <QRScanPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/trips" 
          element={
            <ProtectedRoute>
              <TripManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/stations" 
          element={
            <ProtectedRoute>
              <StationManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vehicles" 
          element={
            <ProtectedRoute>
              <VehicleManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assignments" 
          element={
            <ProtectedRoute>
              <LeaderAssignmentPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/people" 
          element={
            <ProtectedRoute>
              <PeopleManagementPage />
            </ProtectedRoute>
          } 
        />

        {/* 人員匯入頁面已移除（專案內已有其他匯入實作） */}
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">報表管理</h1>
                  <p className="text-gray-600">此功能正在開發中...</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/trips/import"
          element={
            <ProtectedRoute>
              <TripRegistrationImportPage />
            </ProtectedRoute>
          }
        />
        
        {/* 系統管理路由 */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <UserManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/database" 
          element={
            <ProtectedRoute>
              <DatabaseManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute>
              <SystemSettingsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/menu" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">功能選單</h1>
                  <p className="text-gray-600">更多管理功能和設定選項...</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">系統管理</h1>
                  <p className="text-gray-600">系統管理員專用功能...</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        {/* 404 頁面 */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 text-xl mb-8">找不到您要的頁面</p>
                <a 
                  href="/" 
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  回到首頁
                </a>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
