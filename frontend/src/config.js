// Use environment variable, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// For socket connection (removes '/api' from the end if it exists)
const BASE_URL = API_URL.replace(/\/api$/, '');

export { API_URL, BASE_URL };