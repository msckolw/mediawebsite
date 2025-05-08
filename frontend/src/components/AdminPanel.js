import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';
import { getImageUrl } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL;

const CATEGORIES = [
  'General',
  'Technology',
  'Business',
  'Entertainment',
  'Health',
  'Science',
  'Sports',
  'Politics'
];

const AdminPanel = () => {
  const [news, setNews] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    summary: '',
    image: null,
    source: []
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await axios.get(`${API_URL}/news`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      setFormData({ ...formData, image: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const articleData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        imageUrl: formData.image ? URL.createObjectURL(formData.image) : 'https://via.placeholder.com/300x200'
      };

      await axios.post(`${API_URL}/news`, articleData);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'General',
        summary: '',
        image: null
      });
      
      // Refresh news list
      fetchNews();
    } catch (error) {
      console.error('Error adding news:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/news/${id}`);
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <div className="admin-content">
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                required
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows="5"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="category-select"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="image">Image</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleChange}
                accept="image/*"
              />
            </div>
            <button type="submit" className="submit-button">Add News</button>
          </form>
        </div>

        <div className="news-list-container">
          <h3>Current Articles</h3>
          <div className="news-list">
            {news.map(article => (
              <div key={article._id} className="news-item">
                {article.imageUrl && (
                  <img 
                    src={getImageUrl(article.imageUrl)} 
                    alt={article.title} 
                    className="news-image"
                  />
                )}
                <div className="news-content">
                  <h4>{article.title}</h4>
                  <p className="summary">{article.summary}</p>
                  <p className="category">{article.category}</p>
                  <button 
                    onClick={() => handleDelete(article._id)} 
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 