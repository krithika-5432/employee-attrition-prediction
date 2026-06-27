import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE });

export const uploadDataset = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/upload', form);
};

export const predict = (data: any) => api.post('/predict', data);
export const simulate = (data: any) => api.post('/simulate', data);
export const batchAnalysis = (data?: any) => api.post('/batch-analysis', data || {});
export const getPerformance = () => api.get('/performance');
export const getFeatureImportance = () => api.get('/feature-importance');
export const getDatasetAnalytics = () => api.get('/dataset-analytics');
