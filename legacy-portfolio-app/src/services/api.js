import axios from 'axios';

// Configure the API base URL
// For local development, the backend runs on localhost:8080
// For production, update this to your live API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Stock API endpoints
export const stocksAPI = {
  // Get all stocks
  getAllStocks: () => apiClient.get('/stocks'),
  
  // Get a single stock by ID
  getStockById: (id) => apiClient.get(`/stocks/${id}`),
  
  // Create a new stock
  createStock: (stockData) => apiClient.post('/stocks', stockData),
  
  // Update a stock
  updateStock: (id, stockData) => apiClient.put(`/stocks/${id}`, stockData),
  
  // Delete a stock
  deleteStock: (id) => apiClient.delete(`/stocks/${id}`),
};

// Holdings API endpoints (backend source of truth for portfolio positions)
export const holdingsAPI = {
  getAllHoldings: () => apiClient.get('/holdings'),
  buyStock: (payload) => apiClient.post('/holdings/buy', payload),
  sellStock: (payload) => apiClient.post('/holdings/sell', payload),
};

// Live price API endpoints
export const pricesAPI = {
  getLivePrice: (symbol) => apiClient.get(`/prices/${symbol}`),
  getPriceHistory: (symbol) => apiClient.get(`/prices/${symbol}/history`),
};

// User API endpoints (add as needed)
export const usersAPI = {
  // Add user endpoints here
  createUser: (userData) => apiClient.post('/users', userData),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  // Add more as your backend develops
};

export const portfolioAPI = {
  getAllPortfolios: () => apiClient.get('/portfolio'),
  getPortfolioById: (id) => apiClient.get(`/portfolio/${id}`),
  depositFunds: (id, amount) => apiClient.post(`/portfolio/${id}/deposit`, amount),
  withdrawFunds: (id, amount) => apiClient.post(`/portfolio/${id}/withdraw`, amount),
};

export const transactionsAPI = {
  getAllTransactions: () => apiClient.get('/transactions'),
};

export default apiClient;
