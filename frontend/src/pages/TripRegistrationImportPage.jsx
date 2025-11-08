import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import importService from '../services/importService';

// 可對應的內部欄位清單（可擴充）
const INTERNAL_FIELDS = [
  '',
  'name',
  'studentId',
  'room',
  'gender',
  'phone',
  'tripId',
  'tripDate',
  'note',
];

const defaultDateFormats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy'];

const TripRegistrationImportPage = () => {
  const [file, setFile] = useState(null);
  const [rawPreviewRows, setRawPreviewRows] = useState([]);
  const [rows, setRows] = useState([]); // editable preview rows
  const [mapping, setMapping] = useState({});
  const [dateFormat, setDateFormat] = useState(defaultDateFormats[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const suggestedMapping = useMemo(() => {
    if (!rawPreviewRows || !rawPreviewRows.length) return {};
    const first = rawPreviewRows[0];
    const keys = Object.keys(first);
    const m = {};
    keys.forEach(k => {
      const key = k.toLowerCase();
      if (key.includes('name')) m[k] = 'name';
      else if (key.includes('student')) m[k] = 'studentId';
      else if (key.includes('room') || key.includes('dorm')) m[k] = 'room';
      else if (key.includes('gender')) m[k] = 'gender';
      else if (key.includes('phone') || key.includes('tel')) m[k] = 'phone';
      else if (key.includes('date')) m[k] = 'tripDate';
      else if (key.includes('trip') || key.includes('行程')) m[k] = 'tripId';
      else m[k] = '';
    });
    return m;
  }, [rawPreviewRows]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setRawPreviewRows([]);
    setRows([]);
    setMapping({});
    setMessage(null);
    setImportResult(null);
  };

  const handlePreview = async () => {
    if (!file) return setMessage('請先選擇要上傳的 CSV/Excel 檔案。');
    setLoading(true);
    setMessage(null);
    try {
      const data = await importService.preview(file);
      const preview = data.preview || [];
      setRawPreviewRows(preview);
      setRows(preview.map(r => ({ ...r, _include: true })));
      setMapping(suggestedMapping);
      setMessage('已產生預覽，請檢查並調整欄位對應與資料。');
    } catch (err) {
      console.error(err);
      setMessage('產生預覽失敗：' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (rowIndex, key, value) => {
    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], [key]: value };
      return copy;
    });
  };

  const toggleInclude = (rowIndex) => {
    setRows(prev => {
      const copy = [...prev];
      copy[rowIndex]._include = !copy[rowIndex]._include;
      return copy;
    });
  };

  const handleExecute = async () => {
    const toImport = rows.filter(r => r._include).map(r => {
      const mapped = {};
      Object.entries(mapping).forEach(([col, field]) => {
        if (!field) return;
        mapped[field] = r[col];
      });
      return mapped;
    });

    if (!toImport.length) return setMessage('沒有選取任何要匯入的資料。');

    setLoading(true);
    setMessage(null);
    try {
      const payload = { preview: toImport, dateFormat };
      const res = await importService.execute(payload);
      setImportResult(res);
      const hist = JSON.parse(localStorage.getItem('importHistory') || '[]');
      hist.unshift({ id: res.importId, created: new Date().toISOString(), summary: res });
      localStorage.setItem('importHistory', JSON.stringify(hist.slice(0, 50)));
      setMessage('匯入完成');
    } catch (err) {
      console.error(err);
      setMessage('匯入失敗：' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    const importId = importResult?.importId;
    if (!importId) return setMessage('找不到可回滾的匯入 ID');
    setLoading(true);
    setMessage(null);
    try {
      await importService.rollback(importId);
      setMessage('回滾完成');
      setImportResult(null);
      setRows([]);
      setRawPreviewRows([]);
      setFile(null);
      const hist = JSON.parse(localStorage.getItem('importHistory') || '[]');
      const idx = hist.findIndex(h => h.id === importId);
      if (idx >= 0) { hist[idx].rolledBack = true; localStorage.setItem('importHistory', JSON.stringify(hist)); }
    } catch (err) {
      console.error(err);
      setMessage('回滾失敗：' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const importHistory = JSON.parse(localStorage.getItem('importHistory') || '[]');

  return (
    <Layout>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-4">行程報名匯入</h1>

          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">上傳 CSV/Excel 檔案</label>
            <input type="file" accept=", application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv" onChange={handleFileChange} />
            <div className="mt-3 flex items-center space-x-3">
              <button onClick={handlePreview} className="px-4 py-2 bg-blue-600 text-white rounded-lg" disabled={loading}>產生預覽</button>
              <div className="text-sm text-gray-500">支援 CSV / Excel，上傳後系統會嘗試解析並產生預覽</div>
            </div>
          </section>

          {rawPreviewRows.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">步驟 1：欄位對應 (請確認每個上傳欄位對應到系統欄位)</h2>
              <div className="overflow-auto mb-4">
                <table className="min-w-full text-sm table-auto border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 border">上傳欄位</th>
                      <th className="px-3 py-2 border">對應系統欄位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(rawPreviewRows[0]).map((col) => (
                      <tr key={col} className="bg-white">
                        <td className="px-3 py-2 border">{col}</td>
                        <td className="px-3 py-2 border">
                          <select value={mapping[col] || ''} onChange={(e) => setMapping(prev => ({ ...prev, [col]: e.target.value }))} className="p-1 border rounded">
                            {INTERNAL_FIELDS.map(f => (
                              <option key={f} value={f}>{f || '-- 不匯入 --'}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-2">
                <label className="text-sm mr-2">日期格式 (若有日期欄位)：</label>
                <select className="p-1 border rounded" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  {defaultDateFormats.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

            </section>
          )}

          {rows.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">步驟 2：預覽與校正 (可編輯)</h2>
              <div className="overflow-auto">
                <table className="min-w-full text-sm table-auto border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 border">#</th>
                      <th className="px-2 py-2 border">包含</th>
                      {Object.keys(rows[0]).filter(k => k !== '_include').map(col => (
                        <th key={col} className="px-3 py-2 border">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-2 border text-right">{idx + 1}</td>
                        <td className="px-2 py-2 border text-center">
                          <input type="checkbox" checked={!!row._include} onChange={() => toggleInclude(idx)} />
                        </td>
                        {Object.keys(row).filter(k => k !== '_include').map((col) => (
                          <td key={col} className="px-3 py-2 border">
                            <input className="w-full p-1 border rounded text-sm" value={row[col] ?? ''} onChange={(e) => updateCell(idx, col, e.target.value)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center space-x-3">
                <button onClick={handleExecute} className="px-4 py-2 bg-green-600 text-white rounded-lg" disabled={loading}>執行匯入</button>
                <button onClick={handleRollback} className="px-4 py-2 bg-red-600 text-white rounded-lg" disabled={loading || !importResult}>回滾匯入</button>
                <div className="text-sm text-gray-500">可在表格中直接修正錯誤資料或取消勾選不匯入的列。</div>
              </div>
            </section>
          )}

          {importResult && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-2">匯入結果</h2>
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div>匯入 ID：{importResult.importId}</div>
                <div>建立數量：{importResult.createdCount || importResult.createdIds?.length || 0}</div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-2">匯入歷史 (本機暫存)</h2>
            {importHistory.length === 0 && <div className="text-sm text-gray-500">尚無匯入紀錄</div>}
            {importHistory.length > 0 && (
              <ul className="space-y-2 text-sm">
                {importHistory.map(h => (
                  <li key={h.id} className="p-2 border rounded bg-white flex justify-between items-center">
                    <div>
                      <div>匯入 ID：{h.id}</div>
                      <div className="text-xs text-gray-500">時間：{new Date(h.created).toLocaleString()}</div>
                    </div>
                    <div className="text-sm">
                      {h.rolledBack ? <span className="text-red-500">已回滾</span> : <span className="text-green-600">已完成</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {message && <div className="mt-4 text-sm text-gray-700">{message}</div>}

        </div>
      </div>
    </Layout>
  );
};

export default TripRegistrationImportPage;
