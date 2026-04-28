// Use Render for production, localhost for development
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://nobiasmedia.onrender.com/api'
    : 'http://localhost:5002/api');

export { API_URL }; 