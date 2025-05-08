const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  articles: `${API_BASE_URL}/articles`,
  categories: `${API_BASE_URL}/categories`,
  auth: `${API_BASE_URL}/auth`,
  media: `${API_BASE_URL}/media`
};

export default API_ENDPOINTS; 