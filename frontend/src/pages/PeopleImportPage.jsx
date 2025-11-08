import Layout from '../components/Layout';

const PeopleImportPage = () => {
  return (
    <Layout>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-4">人員匯入</h1>
          <p className="text-gray-600 mb-6">此頁面為匯入候選乘客的入口，功能尚未完成。接下來會提供 CSV/Excel 上傳、欄位對應與預覽功能。</p>
          <div className="text-sm text-gray-500">目前為占位頁面 — 前端工程師會在此實作完整匯入流程。</div>
        </div>
      </div>
    </Layout>
  );
};

export default PeopleImportPage;
