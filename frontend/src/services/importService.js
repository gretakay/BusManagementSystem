import apiClient from './api.js';

const importService = {
  // 上傳檔案並取得預覽（multipart/form-data）
  async preview(file) {
    const form = new FormData();
    form.append('file', file);

    const response = await apiClient.post('/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  // 執行匯入：依後端 API 規格傳送資料
  // payload 可以是後端 preview 回傳的內容或一個包含 options 的物件
  async execute(payload) {
    const response = await apiClient.post('/import/execute', payload);
    return response.data;
  },

  // 回滾匯入（使用 importId 或 rollback token）
  async rollback(importId) {
    const response = await apiClient.post('/import/rollback', { importId });
    return response.data;
  }
};

export default importService;
