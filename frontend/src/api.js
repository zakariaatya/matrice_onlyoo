import axios from "axios";

const envBaseUrl = process.env.REACT_APP_API_URL;
const runtimeBaseUrl = `${window.location.protocol}//${window.location.hostname}:4000/api`;
const baseURL =
  envBaseUrl && !envBaseUrl.includes("localhost") ? envBaseUrl : runtimeBaseUrl;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eol_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
