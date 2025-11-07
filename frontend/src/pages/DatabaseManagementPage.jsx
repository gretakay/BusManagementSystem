import { useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';

const DatabaseManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState('2025-11-06T23:30:00');

  const databaseStats = {
    totalUsers: 125,
    totalTrips: 8,
    totalBuses: 24,
    totalPeople: 2847,
    totalBoardings: 15632,
    lastUpdate: '2025-11-07T10:15:00'
  };

  const handleImportData = async (type) => {
    setLoading(true);
    setUploadProgress(0);
    
    // 模擬上傳進度
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          alert(`${type} 資料匯入完成！`);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleExportData = (type) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`${type} 資料匯出完成！檔案將開始下載。`);
    }, 2000);
  };

  const handleBackup = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastBackup(new Date().toISOString());
      alert('資料庫備份完成！');
    }, 3000);
  };

  const handleClearData = (type) => {
    if (window.confirm(`確定要清除所有 ${type} 嗎？此操作無法復原！`)) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        alert(`${type} 已清除完成！`);
      }, 2000);
    }
  };

  const dataTypes = [
    { key: 'people', name: '人員資料', icon: '👥', count: databaseStats.totalPeople },
    { key: 'trips', name: '行程資料', icon: '🚌', count: databaseStats.totalTrips },
    { key: 'boardings', name: '上下車記錄', icon: '📋', count: databaseStats.totalBoardings },
    { key: 'users', name: '使用者帳號', icon: '👤', count: databaseStats.totalUsers }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">資料庫管理</h1>
              <p className="text-gray-600">資料匯入、匯出、備份和清除</p>
            </div>
          </div>
        </div>

        {/* 資料庫統計 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">資料庫統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{databaseStats.totalUsers}</div>
              <div className="text-sm text-blue-700">使用者</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{databaseStats.totalTrips}</div>
              <div className="text-sm text-green-700">行程</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{databaseStats.totalPeople.toLocaleString()}</div>
              <div className="text-sm text-purple-700">人員</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{databaseStats.totalBoardings.toLocaleString()}</div>
              <div className="text-sm text-orange-700">上車記錄</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            最後更新：{new Date(databaseStats.lastUpdate).toLocaleString('zh-TW')}
          </div>
        </div>

        {/* 資料匯入/匯出 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 資料匯入 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              資料匯入
            </h2>
            
            {loading && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>上傳進度</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {dataTypes.map((type) => (
                <div key={type.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-500">目前 {type.count.toLocaleString()} 筆</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.json"
                      className="hidden"
                      id={`import-${type.key}`}
                      onChange={() => handleImportData(type.name)}
                    />
                    <label
                      htmlFor={`import-${type.key}`}
                      className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      匯入
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium text-yellow-800">匯入注意事項</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    支援 CSV、Excel 和 JSON 格式。匯入前請確保資料格式正確。
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 資料匯出 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              資料匯出
            </h2>
            
            <div className="space-y-3">
              {dataTypes.map((type) => (
                <div key={type.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-500">共 {type.count.toLocaleString()} 筆</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(type.name)}
                      disabled={loading}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(type.name)}
                      disabled={loading}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600"
              onClick={() => handleExportData('完整資料庫')}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              匯出完整資料庫
            </Button>
          </div>
        </div>

        {/* 備份和維護 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 備份管理 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              資料庫備份
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">上次備份</span>
                  <span className="text-sm text-gray-600">
                    {new Date(lastBackup).toLocaleString('zh-TW')}
                  </span>
                </div>
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
                onClick={handleBackup}
                disabled={loading}
              >
                {loading ? '備份中...' : '立即備份'}
              </Button>
              
              <div className="text-sm text-gray-500">
                建議每天進行資料庫備份，以確保資料安全。
              </div>
            </div>
          </div>

          {/* 資料清除 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              資料清除
            </h2>
            
            <div className="space-y-3">
              {dataTypes.map((type) => (
                <div key={type.key} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium text-gray-900">{type.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearData(type.name)}
                    disabled={loading}
                    className="text-red-600 border-red-300 hover:bg-red-100"
                  >
                    清除
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="font-medium text-red-800">危險操作警告</div>
                  <div className="text-sm text-red-700 mt-1">
                    資料清除後無法復原，請謹慎操作！
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DatabaseManagementPage;