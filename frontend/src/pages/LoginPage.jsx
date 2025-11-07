import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userIdentifier: '', // 改為更通用的名稱
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLeaderMode, setIsLeaderMode] = useState(false); // 是否為領隊模式

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 如果是領隊模式，則不傳密碼
      const password = isLeaderMode ? null : formData.password;
      
      // 如果不是領隊模式但沒有密碼，則提示錯誤
      if (!isLeaderMode && !password) {
        setError('請輸入密碼');
        setLoading(false);
        return;
      }

      await authService.login(formData.userIdentifier, password);
      
      // 登入成功後使用 navigate 重定向
      navigate('/', { replace: true });
    } catch (error) {
      setError(error.response?.data?.message || '登入失敗，請檢查帳號密碼');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 滿版設計：移除所有邊距和容器限制 */}
      <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
        {/* 左側：登入表單區域 - 手機全寬，桌面版一半 */}
        <div className="flex items-center justify-center p-0 sm:p-2 lg:p-4">
          <div className="w-full">{/* 手機版完全全寬 */}
        {/* 主登入卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-none sm:rounded-lg lg:rounded-2xl shadow-2xl border border-white/20 overflow-hidden min-h-screen sm:min-h-0">{/* 手機版無圓角、全高度 */}
          {/* 頭部區域 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 lg:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">遊覽車管理系統</h1>
            <p className="text-sm text-blue-100">智能化行程管理平台</p>
          </div>

          {/* 表單區域 */}
          <div className="p-4 sm:p-6 lg:p-8">{/* 桌面版更大的內邊距 */}
            <div className="mb-4 lg:mb-6 text-center">{/* 桌面版更大的間距 */}
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-1 lg:mb-2">歡迎回來</h2>
              <p className="text-sm lg:text-base text-gray-600">請選擇登入方式並輸入您的資訊</p>
            </div>

            {/* 登入模式切換 */}
            <div className="mb-4 lg:mb-6">{/* 桌面版更大的間距 */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setIsLeaderMode(false)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !isLeaderMode 
                      ? 'bg-white text-blue-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  管理員登入
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaderMode(true)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isLeaderMode 
                      ? 'bg-white text-purple-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  領隊登入
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Input
                  label={isLeaderMode ? "學號" : "帳號/Email"}
                  name="userIdentifier"
                  type="text"
                  value={formData.userIdentifier}
                  onChange={handleChange}
                  placeholder={isLeaderMode ? "請輸入學號" : "請輸入帳號或Email"}
                  required
                  disabled={loading}
                />

                {!isLeaderMode && (
                  <Input
                    label="密碼"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="請輸入密碼"
                    required
                    disabled={loading}
                  />
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className={`w-full bg-gradient-to-r ${
                  isLeaderMode 
                    ? 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' 
                    : 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                } text-white font-bold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    登入中...
                  </div>
                ) : (
                  <>
                    {isLeaderMode ? '領隊登入' : '管理員登入'}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* 測試帳號資訊 */}
        <div className="mt-4 bg-white/60 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold text-gray-900 mb-1">測試帳號</h3>
            <p className="text-xs text-gray-600">開發測試階段可用帳號</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">管理員帳號</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><span className="font-medium">系統管理員:</span> sysadmin / 123</p>
                <p><span className="font-medium">一般管理員:</span> admin / 123</p>
                <p><span className="font-medium">唯讀管理員:</span> readonly / 123</p>
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <h4 className="font-semibold text-purple-900 mb-2 text-sm">領隊登入</h4>
              <div className="text-xs text-purple-700 space-y-1">
                <p>需要管理員先在系統中</p>
                <p>指派學員為領隊角色</p>
                <p>才能使用學號登入</p>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
        
        {/* 右側裝飾區域 - 大螢幕才顯示 */}
        <div className="hidden lg:block bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative h-full flex items-center justify-center p-8">
            <div className="text-center text-white">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">智能化管理</h2>
              <p className="text-xl text-blue-100 mb-6">提升旅遊體驗的專業平台</p>
              <div className="space-y-4 text-left">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  <span>即時車輛追蹤</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  <span>QR碼快速登車</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  <span>智能人員配置</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;