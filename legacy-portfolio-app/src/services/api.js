import axios from "axios";

// In local dev we use the Vite proxy (/api -> :8080).
// In non-dev builds, default to same-origin backend paths (no /api prefix)
// unless VITE_API_URL is explicitly provided.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const stocksAPI = {
  getAllStocks: () => apiClient.get("/stocks"),
  getStockById: (id) => apiClient.get(`/stocks/${id}`),
  createStock: (stockData) => apiClient.post("/stocks", stockData),
  updateStock: (id, stockData) => apiClient.put(`/stocks/${id}`, stockData),
  deleteStock: (id) => apiClient.delete(`/stocks/${id}`),
};

export const holdingsAPI = {
  getAllHoldings: () => apiClient.get("/holdings"),
  buyStock: (payload) => apiClient.post("/holdings/buy", payload),
  sellStock: (payload) => apiClient.post("/holdings/sell", payload),
};

export const pricesAPI = {
  getLivePrice: (symbol) => apiClient.get(`/prices/${symbol}`),
  getPriceHistory: (symbol) => apiClient.get(`/prices/${symbol}/history`),
};

export const usersAPI = {
  createUser: (userData) => apiClient.post("/users", userData),
  getUserById: (id) => apiClient.get(`/users/${id}`),
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
