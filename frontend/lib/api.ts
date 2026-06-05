import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: API_BASE });

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tripwise_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUTH
export const registerUser = (data: { name: string; email: string; password: string }) =>
  api.post('/api/auth/register', data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post('/api/auth/login', data);

// RECOMMENDATIONS
export interface RecommendationRequest {
  cityName?: string;
  userLat?: number;
  userLng?: number;
  days: number;
  budget: number;
  preferences?: string[];
  travelMode?: string;
}

export const getRecommendations = (data: RecommendationRequest) =>
  api.post('/api/recommendations', data);

// ON-DEMAND ITINERARY
export interface ItineraryRequest {
  destinationName: string;
  days: number;
  budget: number;
  preferences?: string[];
  travelMode?: string;
}

export const getItinerary = (data: ItineraryRequest) =>
  api.post('/api/recommendations/itinerary', data);

// TRIPS — save, list, get, delete
export const saveTrip = (data: any) => api.post('/api/trips', data);
export const getMyTrips = () => api.get('/api/trips');
export const getTripById = (id: string) => api.get(`/api/trips/${id}`);
export const deleteTrip = (id: string) => api.delete(`/api/trips/${id}`);