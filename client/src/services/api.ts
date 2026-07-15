import axios from 'axios';
import { User, Country, Region, MarketPrice, MarketOrder, Battle, ChatMessage, Alliance } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    apiClient.post('/auth/register', { username, email, password }),
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),
  logout: () => apiClient.post('/auth/logout'),
};

// Game API
export const gameAPI = {
  getWorld: () => apiClient.get('/game/world'),
  getCountry: (countryId: string) => apiClient.get(`/game/country/${countryId}`),
  getMyCountry: () => apiClient.get('/game/my-country'),
  createCountry: (countryName: string) =>
    apiClient.post('/game/country/create', { countryName }),
  getRegion: (regionId: string) => apiClient.get(`/game/region/${regionId}`),
};

// Market API
export const marketAPI = {
  getPrices: () => apiClient.get('/market/prices'),
  getOrders: (resourceType?: string, orderType?: string) =>
    apiClient.get('/market/orders', { params: { resource_type: resourceType, order_type: orderType } }),
  createOrder: (resourceType: string, quantity: number, unitPrice: number, orderType: string) =>
    apiClient.post('/market/order', { resource_type: resourceType, quantity, unit_price: unitPrice, order_type: orderType }),
  buyFromOrder: (orderId: string, quantity: number) =>
    apiClient.post('/market/buy', { order_id: orderId, quantity }),
};

// Military API
export const militaryAPI = {
  getDefense: (regionId: string) => apiClient.get(`/military/defense/${regionId}`),
  launchDrone: (targetRegionId: string, targetType: string) =>
    apiClient.post('/military/drone', { targetRegionId, targetType }),
  attackRegion: (fromRegionId: string, toRegionId: string, troopsCount: number) =>
    apiClient.post('/military/attack', { fromRegionId, toRegionId, troopsCount }),
  getBattles: (countryId?: string) =>
    apiClient.get('/military/battles', { params: { countryId } }),
  upgradePVO: (regionId: string) =>
    apiClient.post('/military/pvo/upgrade', { regionId }),
};

// Chat API
export const chatAPI = {
  getGlobalChat: (limit?: number) =>
    apiClient.get('/chat/global', { params: { limit } }),
  sendMessage: (message: string, chatType: string) =>
    apiClient.post('/chat/message', { message, chatType }),
  createAlliance: (allianceName: string) =>
    apiClient.post('/chat/alliance/create', { allianceName }),
  joinAlliance: (allianceId: string) =>
    apiClient.post('/chat/alliance/join', { allianceId }),
  getAlliances: () =>
    apiClient.get('/chat/alliances'),
};

export default apiClient;
