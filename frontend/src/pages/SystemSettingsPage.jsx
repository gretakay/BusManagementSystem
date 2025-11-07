import { useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const SystemSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    systemName: '遊覽車管理系統',
    qrCodeExpiry: 30,
    autoBackupEnabled: true,
    autoBackupTime: '02:00',
    emailNotifications: true,
    smsNotifications: false,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    defaultTripDays: 7,
    busCapacityWarning: 90
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    // 模擬 API 呼叫
    setTimeout(() => {
      setLoading(false);
      alert('設定已儲存！');
    }, 1500);
  };

  const handleResetSettings = () => {
    if (window.confirm('確定要重設為預設值嗎？')) {
      setSettings({
        systemName: '遊覽車管理系統',
        qrCodeExpiry: 30,
        autoBackupEnabled: true,
        autoBackupTime: '02:00',
        emailNotifications: true,
        smsNotifications: false,
        maxLoginAttempts: 5,
        sessionTimeout: 60,
        defaultTripDays: 7,
        busCapacityWarning: 90
      });
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">系統設定</h1>
                <p className="text-gray-600">系統參數、通知設定和自動化配置</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleResetSettings}>
                重設預設值
              </Button>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-red-600"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? '儲存中...' : '儲存設定'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本設定 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              基本設定
            </h2>
            
            <div className="space-y-4">
              <Input
                label="系統名稱"
                type="text"
                value={settings.systemName}
                onChange={(e) => updateSetting('systemName', e.target.value)}
                placeholder="輸入系統名稱"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR 碼有效期限 (秒)
                </label>
                <select
                  value={settings.qrCodeExpiry}
                  onChange={(e) => updateSetting('qrCodeExpiry', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 秒</option>
                  <option value={30}>30 秒</option>
                  <option value={60}>1 分鐘</option>
                  <option value={120}>2 分鐘</option>
                  <option value={300}>5 分鐘</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  預設行程期限 (天)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.defaultTripDays}
                  onChange={(e) => updateSetting('defaultTripDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車輛容量警告閾值 (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={settings.busCapacityWarning}
                  onChange={(e) => updateSetting('busCapacityWarning', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  當車輛載客率超過此值時會顯示警告
                </p>
              </div>
            </div>
          </div>

          {/* 安全性設定 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              安全性設定
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大登入嘗試次數
                </label>
                <select
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value={3}>3 次</option>
                  <option value={5}>5 次</option>
                  <option value={10}>10 次</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  會話逾時 (分鐘)
                </label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value={30}>30 分鐘</option>
                  <option value={60}>1 小時</option>
                  <option value={120}>2 小時</option>
                  <option value={480}>8 小時</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">密碼政策</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    最少 8 個字元
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    包含大小寫字母
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    包含數字
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              通知設定
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <div className="font-medium text-gray-900">電子郵件通知</div>
                  <div className="text-sm text-gray-500">重要事件和警告通知</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <div className="font-medium text-gray-900">簡訊通知</div>
                  <div className="text-sm text-gray-500">緊急事件即時通知</div>
                </div>
              </label>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">通知時機</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• 車輛容量超過警告閾值</div>
                  <div>• 乘客重複上車</div>
                  <div>• 系統錯誤和異常</div>
                  <div>• 資料庫備份完成</div>
                </div>
              </div>
            </div>
          </div>

          {/* 備份設定 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              自動備份設定
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoBackupEnabled}
                  onChange={(e) => updateSetting('autoBackupEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-900">啟用自動備份</div>
                  <div className="text-sm text-gray-500">每日自動備份資料庫</div>
                </div>
              </label>

              {settings.autoBackupEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    備份時間
                  </label>
                  <input
                    type="time"
                    value={settings.autoBackupTime}
                    onChange={(e) => updateSetting('autoBackupTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    建議選擇系統使用量較低的時間
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">備份保留政策</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• 保留最近 30 天的備份</div>
                  <div>• 每月保留一份備份</div>
                  <div>• 每年保留一份備份</div>
                  <div>• 自動清理過期備份</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 系統資訊 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            系統資訊
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium text-gray-900">系統版本</div>
              <div className="text-lg font-bold text-gray-600">v1.0.0</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium text-gray-900">資料庫版本</div>
              <div className="text-lg font-bold text-gray-600">PostgreSQL 16</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium text-gray-900">最後更新</div>
              <div className="text-lg font-bold text-gray-600">2025-11-07</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettingsPage;