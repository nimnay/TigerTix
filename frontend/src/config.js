// frontend/src/config.js
const API_CONFIG = {
  CLIENT_SERVICE: process.env.REACT_APP_API_URL || 'http://localhost:6001',
  AUTH_SERVICE: process.env.REACT_APP_AUTH_URL || 'http://localhost:3001',
  LLM_SERVICE: process.env.REACT_APP_LLM_URL || 'http://localhost:7001',
  ADMIN_SERVICE: process.env.REACT_APP_ADMIN_URL || 'http://localhost:5001'
};

export default API_CONFIG;