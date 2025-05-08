import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../services/api';

const ArticleDetail = () => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`${API_URL}/news/${id}`);
        setArticle(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch article');
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div className="article-detail">
      <h1>{article.title}</h1>
      <div className="article-meta">
        <span className="author">By {article.author}</span>
        <span className="date">{new Date(article.publishedAt).toLocaleDateString()}</span>
      </div>
      {article.imageUrl && (
        <div className="article-image">
          <img src={getImageUrl(article.imageUrl)} alt={article.title} />
        </div>
      )}
      <div className="article-content">
        <p>{article.content}</p>
      </div>
    </div>
  );
};

export default ArticleDetail; 