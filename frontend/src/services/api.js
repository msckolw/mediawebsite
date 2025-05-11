import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to construct image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Articles API
export const getArticles = async (page=1) => {
  try {
    const response = await api.get('/news?page='+page);
    console.log(response)
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch articles');
  }
};

export const getArticle = async (id) => {
  try {
    const response = await api.get(`/news/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch article');
  }
};

export const deleteArticle = async (id) => {
  try {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  } catch (error) {
    let status = error.response.status;
    throw new Error(status)
  }
};

export const getSourceType = async () => {
  try {
    const response = await api.get(`/source`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch sources');
  }
};

export const getArticleByCategory = async (cat,page=1) => {
  try {
    const response = await api.get(`/category/${cat}?page=${page}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch article');
  }
};

// Auth API
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const addArticle = async (data) => {
  try {
    const response = await api.post('/news', data);
    return response.data;
  } catch (error) {
    let status = error.response.status;
    throw new Error(status)
  }
};

// Upload API
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};

export default api; 