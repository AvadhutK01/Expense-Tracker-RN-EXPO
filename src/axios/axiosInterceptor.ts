// axiosInterceptor.ts
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';

// Create an Axios instance with base URL from .env
console.log(process.env.EXPO_PUBLIC_API_URL);
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,      // Define API_URL in your .env file
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    // const token = await AsyncStorage.getItem('authToken');
    const token = 'your-auth-token';
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`Response error: ${status}`, data);
      if (status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
      }
    } else if (error.request) {
      console.error('No response:', error.request);
      Alert.alert('Network Error', 'Please check your internet connection.');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
