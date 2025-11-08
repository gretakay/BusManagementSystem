import { useState } from 'react';
import Layout from '../components/Layout';
import importService from '../services/importService';

const TripRegistrationImportPage = () => {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewRows([]);
    setMessage(null);
    setImportResult(null);
  };

  const handlePreview = async () => {
    if (!file) return setMessage('請先選擇要上傳的 CSV 檔案。');
    setLoading(true);
    setMessage(null);
    try {
      const data = await importService.preview(file);
      // 期待後端回傳 { preview: [ ...rows ], meta: {...} }
      setPreviewRows(data.preview || []);
      setMessage(data.message || '已產生預覽，請檢查欄位');
    } catch (err) {
      console.error(err);
      setMessage('產生預覽失敗：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!previewRows.length) return setMessage('請先產生預覽再執行匯入。');
    setLoading(true);
    setMessage(null);
    try {
      // 預設把 preview 資料傳給後端執行，後端會回傳 importId 與 summary
      const payload = { preview: previewRows };
      const res = await importService.execute(payload);
      setImportResult(res);
      setMessage('匯入完成');
    } catch (err) {
      console.error(err);
      setMessage('匯入失敗：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!importResult?.importId) return setMessage('找不到可回滾的匯入 ID');
    setLoading(true);
    setMessage(null);
    try {
      const res = await importService.rollback(importResult.importId);
      setMessage('回滾完成');
      setImportResult(null);
      setPreviewRows([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage('回滾失敗：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-4">行程報名匯入</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">上傳 CSV 檔案</label>
            <input type="file" accept=".csv" onChange={handleFileChange} />
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <button onClick={handlePreview} className="px-4 py-2 bg-blue-600 text-white rounded-lg" disabled={loading}>產生預覽</button>
            <button onClick={handleExecute} className="px-4 py-2 bg-green-600 text-white rounded-lg" disabled={loading || !previewRows.length}>執行匯入</button>
            <button onClick={handleRollback} className="px-4 py-2 bg-red-600 text-white rounded-lg" disabled={loading || !importResult}>回滾匯入</button>
          </div>

          {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}

          {previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm table-auto border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {Object.keys(previewRows[0]).map((col) => (
                      <th key={col} className="px-3 py-2 text-left border">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="px-3 py-2 border">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 50 && <div className="text-xs text-gray-500 mt-2">僅顯示前 50 列預覽</div>}
            </div>
          )}

          {importResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm">匯入 ID：{importResult.importId}</div>
              <div className="text-sm">已建立：{importResult.createdCount || 0} 筆</div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default TripRegistrationImportPage;
