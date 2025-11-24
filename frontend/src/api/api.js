import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/feedback-api/v1";

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: false,
});

export function setAuthToken(token){
    if(token){
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }else{
        delete api.defaults.headers.common['Authorization'];
    }
}

export default api;