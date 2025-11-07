import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userIdentifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLeaderMode, setIsLeaderMode] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const password = isLeaderMode ? null : formData.password;
      
      if (!isLeaderMode && !password) {
        setError('請輸入密碼');
        setLoading(false);
        return;
      }

      await authService.login(formData.userIdentifier, password);
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* 中央大卡片 */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* 網格佈局：手機單欄，桌面雙欄 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          
          {/* 左側：登入表單區 */}
          <div className="p-6 lg:p-10 flex flex-col justify-center">
            {/* 系統名稱 */}
            <div className="text-center mb-6 lg:mb-8">
              <div className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">遊覽車管理系統</h1>
              <p className="text-sm lg:text-base text-gray-600">智能化行程管理平台</p>
            </div>

            {/* 歡迎文字 */}
            <div className="text-center mb-6">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">歡迎回來</h2>
              <p className="text-sm text-gray-600">請選擇登入方式並輸入您的資訊</p>
            </div>

            {/* 登入模式切換 */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setIsLeaderMode(true)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isLeaderMode 
                      ? 'bg-white text-purple-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  領隊登入
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaderMode(false)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !isLeaderMode 
                      ? 'bg-white text-purple-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  管理員登入
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* 登入表單 */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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

              <Button
                type="submit"
                size="lg"
                className={`w-full bg-gradient-to-r ${
                  isLeaderMode 
                    ? 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700' 
                    : 'from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                } text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
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
                    <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </Button>
            </form>

            {/* 測試帳號小卡片 */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">測試帳號</h3>
              <div className="text-xs text-purple-700 space-y-1">
                <p><span className="font-medium">系統管理員:</span> sysadmin / 123</p>
                <p><span className="font-medium">一般管理員:</span> admin / 123</p>
                <p><span className="font-medium">唯讀管理員:</span> readonly / 123</p>
              </div>
            </div>
          </div>

          {/* 右側：介紹區 - 桌面版顯示 */}
          <div className="hidden lg:flex bg-gradient-to-br from-purple-500 to-indigo-600 flex-col justify-center items-center text-center text-white p-10">
            <div className="max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold mb-4">智能化管理</h2>
              <p className="text-lg text-purple-100 mb-8">提升旅遊體驗的專業平台</p>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">即時車輛追蹤</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">QR碼快速登車</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">智能人員配置</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-sm">數據分析報告</span>
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