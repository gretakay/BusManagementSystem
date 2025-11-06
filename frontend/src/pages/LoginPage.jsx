import { useState } from 'react';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

const LoginPage = () => {
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
      window.location.href = '/'; // 登入成功後跳轉到首頁
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">遊覽車管理系統</h1>
            <p className="text-gray-600">請登入您的帳號</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                  <p className="text-sm text-danger-700">{error}</p>
                </div>
              )}
              
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="leaderMode"
                  checked={isLeaderMode}
                  onChange={(e) => setIsLeaderMode(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="leaderMode" className="text-sm text-gray-700">
                  我是領隊（學號登入）
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {loading ? '登入中...' : '登入'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">測試帳號:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>管理員: admin / 123</p>
                  <p>系統管理員: sysadmin / 123</p>
                  <p>只讀管理員: readonly / 123</p>
                  <p>領隊: 需要先在系統中指派學員為領隊才能登入</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;