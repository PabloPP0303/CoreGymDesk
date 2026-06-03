import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/theme';

interface Perfil {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  rol: string;
  peso: number;
  altura: number;
}

interface AuthContextType {
  usuario: any;
  perfil: Perfil | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  actualizarPerfil: (datos: Partial<Perfil>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  async function cargarSesion() {
    try {
      const tokenGuardado = await AsyncStorage.getItem('token');
      if (tokenGuardado) {
        setToken(tokenGuardado);
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${tokenGuardado}` },
        });
        setUsuario(res.data.user);
        setPerfil(res.data.perfil);
      }
    } catch (e) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { user, session, perfil } = res.data;
    await AsyncStorage.setItem('token', session.access_token);
    setToken(session.access_token);
    setUsuario(user);
    setPerfil(perfil);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setPerfil(null);
  }

  async function actualizarPerfil(datos: Partial<Perfil>) {
    const res = await axios.put(`${API_URL}/usuarios`, datos, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPerfil(res.data);
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil, token, loading, login, logout, actualizarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}