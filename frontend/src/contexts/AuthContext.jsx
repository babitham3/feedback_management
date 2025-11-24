import React, { createContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../api/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // inside AuthProvider

useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (token) {
    setAuthToken(token);
    api.get("/auth/me/")
      .then(res => {
        setUser(res.data);
        // after we restore user, check if there's a pending invite token
        const pending = localStorage.getItem("pending_invite_token");
        if (pending) {
          // attempt accept, but don't block UI
          api.post(`/invites/${pending}/accept/`)
            .then(() => {
              localStorage.removeItem("pending_invite_token");
              // optionally notify user — you can add a toast or state
              console.log("Joined board via pending invite token");
            })
            .catch(err => {
              console.warn("Failed to accept pending invite:", err.response?.data || err.message);
              // leave token so user can try again, or remove depending on UX
            });
        }
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  } else {
    setLoading(false);
  }
}, []);

    const login = async ({ username, password }) => {
  const res = await api.post("/auth/token/", { username, password });
  const access = res.data.access;
  localStorage.setItem("access_token", access);
  setAuthToken(access);
  const me = await api.get("/auth/me/");
  setUser(me.data);

  // after login, check pending invite token too
  const pending = localStorage.getItem("pending_invite_token");
  if (pending) {
    try {
      await api.post(`/invites/${pending}/accept/`);
      localStorage.removeItem("pending_invite_token");
      // optionally return some indicator to UI
      return { user: me.data, joinedWithInvite: true };
    } catch (err) {
      // swallow error, frontend can handle if desired
      console.warn("Failed to accept pending invite after login", err.response?.data || err.message);
    }
  }

  return { user: me.data, joinedWithInvite: false };
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