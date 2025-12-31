// Utility functions for managing bookmarks in localStorage

export const getBookmarks = () => {
  try {
    return JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
  } catch (error) {
    console.error('Error reading bookmarks:', error);
    return [];
  }
};

export const addBookmark = (article) => {
  try {
    const existingBookmarks = getBookmarks();
    const bookmarkData = {
      id: article._id,
      title: article.title,
      summary: article.summary,
      imageUrl: article.imageUrl,
      category: article.category,
      createdAt: article.createdAt,
      bookmarkedAt: new Date().toISOString()
    };
    
    // Check if already bookmarked
    if (!existingBookmarks.some(bookmark => bookmark.id === article._id)) {
      existingBookmarks.push(bookmarkData);
      localStorage.setItem('bookmarkedArticles', JSON.stringify(existingBookmarks));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return false;
  }
};

export const removeBookmark = (articleId) => {
  try {
    const existingBookmarks = getBookmarks();
    const updatedBookmarks = existingBookmarks.filter(bookmark => bookmark.id !== articleId);
    localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
};

export const isBookmarked = (articleId) => {
  try {
    const bookmarks = getBookmarks();
    return bookmarks.some(bookmark => bookmark.id === articleId);
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

export const clearAllBookmarks = () => {
  try {
    localStorage.removeItem('bookmarkedArticles');
    return true;
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
    return false;
  }
};