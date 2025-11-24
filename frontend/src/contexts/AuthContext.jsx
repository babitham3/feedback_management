import React, { createContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../api/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setAuthToken(token);
            api.get('/auth/me')
            .then(res => setUser(res.data))
            .catch(()=>{
                localStorage.removeItem('access_token');
                setAuthToken(null);
                setUser(null);
            })
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    },[]);
    const login = async ({username,password}) => {
        const res = await api.post('/auth/token/',{username,password});
        const access = res.data.access;
        localStorage.setItem('access_token', access);
        setAuthToken(access);
        const me = await api.get('/auth/me/');
        setUser(me.data);
        return me.data;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthToken(null);
        setUser(null);
    };

    const register = async ({username,email,password}) => {
        const res = await api.post('/auth/register/',{username,email,password});
        return res.data;
    };

    return (
        <AuthContext.Provider value={{user,setUser,loading,login,logout,register}}>
            {children}
        </AuthContext.Provider>
    );
}