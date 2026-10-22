import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { BASE_URL } from '../config';
import { getArticles, getArticleByCategory } from '../services/api';

export const useArticleFeed = category => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pageSettings, setPageSettings] = useState({ currentPage: 1, totalPages: 0 });
  const generation = useRef(0);
  const fetching = useRef(false);
  const fetchArticles = useCallback(async (page = 1) => {
    if (page > 1 && fetching.current) return;
    const request = ++generation.current;
    fetching.current = true;
    setBusy(true);
    setError('');
    try {
      const result = category ? await getArticleByCategory(category, page) : await getArticles(page);
      if (request !== generation.current) return;
      setArticles(previous => Array.from(new Map(
        (page === 1 ? result.articles : [...previous, ...result.articles]).map(article => [article._id, article])
      ).values()));
      setPageSettings({ currentPage: result.currentPage, totalPages: result.totalPages });
    } catch {
      if (request === generation.current) setError('Could not load the latest news. Please try again.');
    } finally {
      if (request === generation.current) {
        fetching.current = false;
        setBusy(false);
        setLoading(false);
      }
    }
  }, [category]);

  const invalidateRequests = useCallback(() => { ++generation.current; }, []);
  useEffect(() => {
    setLoading(true);
    setArticles([]);
    setPageSettings({ currentPage: 1, totalPages: 0 });
    fetchArticles(1);
    const socket = io(BASE_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 5 });
    // Refetch page one after a mutation/reconnect: offset pages may have shifted.
    // Request generations discard any older page response already in flight.
    const refresh = () => fetchArticles(1);
    ['article:created', 'article:updated', 'article:deleted', 'connect'].forEach(event => socket.on(event, refresh));
    return () => {
      invalidateRequests();
      fetching.current = false;
      socket.disconnect();
    };
  }, [fetchArticles, invalidateRequests]);

  return { articles, loading, busy, error, pageSettings, fetchArticles };
};
