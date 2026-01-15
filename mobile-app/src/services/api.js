import axios from 'axios';

// API Configuration - using production backend for APK build
const API_BASE_URL = 'https://nobiasmedia.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Get all articles
export const getArticles = async (page = 1) => {
  try {
    console.log('Fetching articles from:', `${API_BASE_URL}/news?page=${page}`);
    const response = await api.get(`/news?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    // Return mock data if API fails
    return {
      articles: [
        {
          _id: '1',
          title: 'Sample News Article',
          summary: 'This is a sample news article for testing purposes.',
          category: 'politics',
          imageUrl: 'https://via.placeholder.com/300x200',
        }
      ],
      currentPage: 1,
      totalPages: 1,
    };
  }
};

// Get articles by category
export const getArticlesByCategory = async (category, page = 1) => {
  try {
    const response = await api.get(`/category/${category}?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category articles:', error);
    return { articles: [], currentPage: 1, totalPages: 1 };
  }
};

// Get single article
export const getArticle = async (id) => {
  try {
    const response = await api.get(`/news/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
};

export default api;