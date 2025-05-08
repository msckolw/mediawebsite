import React, { createContext, useState, useContext, useEffect } from 'react';
import { getArticles, getArticle } from '../services/api';

const ArticleContext = createContext();

export const ArticleProvider = ({ children }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticle = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getArticle(id);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <ArticleContext.Provider
      value={{
        articles,
        loading,
        error,
        fetchArticles,
        fetchArticle
      }}
    >
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}; 