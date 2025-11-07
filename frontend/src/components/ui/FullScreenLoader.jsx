const FullScreenLoader = ({ message = "載入中..." }) => {
  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600 mx-auto"></div>
        </div>
        <p className="text-gray-600 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};

export default FullScreenLoader;