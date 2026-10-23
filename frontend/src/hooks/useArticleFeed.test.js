import { renderHook, act, waitFor } from '@testing-library/react';
import io from 'socket.io-client';
import { getArticles } from '../services/api';
import { useArticleFeed } from './useArticleFeed';

jest.mock('socket.io-client', () => jest.fn());
jest.mock('../services/api', () => ({ getArticles: jest.fn(), getArticleByCategory: jest.fn() }));
let handlers;
let socket;
const article = id => ({ _id: id, title: id });
const page = (ids, currentPage = 1, totalPages = 3) => ({ articles: ids.map(article), currentPage, totalPages });
beforeEach(() => {
  handlers = {};
  socket = { on: jest.fn((event, handler) => { handlers[event] = handler; }), disconnect: jest.fn() };
  io.mockReturnValue(socket);
  getArticles.mockReset();
});

test('deduplicates pages and refreshes mutations with authoritative pagination', async () => {
  getArticles.mockResolvedValueOnce(page(['a', 'b']));
  const { result, unmount } = renderHook(() => useArticleFeed());
  await waitFor(() => expect(result.current.loading).toBe(false));
  getArticles.mockResolvedValueOnce(page(['b', 'c'], 2));
  await act(async () => result.current.fetchArticles(2));
  expect(result.current.articles.map(x => x._id)).toEqual(['a', 'b', 'c']);
  for (const event of ['article:created', 'article:updated', 'article:deleted']) {
    getArticles.mockResolvedValueOnce(page(['fresh'], 1, 1));
    await act(async () => handlers[event]());
    expect(result.current.articles.map(x => x._id)).toEqual(['fresh']);
    expect(result.current.pageSettings).toEqual({ currentPage: 1, totalPages: 1 });
  }
  unmount();
  expect(socket.disconnect).toHaveBeenCalled();
});

test('an older load-more response cannot overwrite a newer socket refresh', async () => {
  getArticles.mockResolvedValueOnce(page(['a']));
  const { result } = renderHook(() => useArticleFeed());
  await waitFor(() => expect(result.current.loading).toBe(false));
  let resolveOld;
  getArticles.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  let pending;
  act(() => { pending = result.current.fetchArticles(2); });
  getArticles.mockResolvedValueOnce(page(['new'], 1, 1));
  await act(async () => handlers['article:deleted']());
  await act(async () => { resolveOld(page(['stale'], 2)); await pending; });
  expect(result.current.articles.map(x => x._id)).toEqual(['new']);
});

test('first socket connection reuses the initial fetch; reconnect refreshes news', async () => {
  getArticles.mockResolvedValue(page(['a']));
  const { result } = renderHook(() => useArticleFeed());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => handlers.connect());
  expect(getArticles).toHaveBeenCalledTimes(1);
  getArticles.mockResolvedValueOnce(page(['updated']));
  await act(async () => handlers.connect());
  expect(getArticles).toHaveBeenCalledTimes(2);
  expect(result.current.articles[0]._id).toBe('updated');
});
