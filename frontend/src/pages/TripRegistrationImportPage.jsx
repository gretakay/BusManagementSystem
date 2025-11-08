import Layout from '../components/Layout';

const TripRegistrationImportPage = () => {
  return (
    <Layout>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-4">行程報名匯入</h1>
          <p className="text-gray-600 mb-6">此頁面為匯入行程報名的入口，功能尚未完成。接下來會提供 CSV/Excel 上傳、欄位對應、候選人選擇與預覽。</p>
          <div className="text-sm text-gray-500">目前為占位頁面 — 前端工程師會在此實作完整匯入流程。</div>
        </div>
      </div>
    </Layout>
  );
};

export default TripRegistrationImportPage;
