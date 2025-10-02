import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, RolePermissions } from '../types';
import { rolePermissions } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: RolePermissions;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<any>;
  logout: () => void;
  verifyEmail: (email: string, code: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && apiService.isAuthenticated();
  const permissions = user ? rolePermissions[user.role] : rolePermissions.USER_CASUAL;

  useEffect(() => {
    // Verificar si hay un usuario guardado al iniciar
    const savedUser = apiService.getCurrentUserFromStorage();
    if (savedUser && apiService.isAuthenticated()) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response: any = await apiService.login(email, password);
      
      console.log('Respuesta del login:', response);
      
      // Manejar dos posibles formatos de respuesta
      let userData, accessToken, refreshToken;
      
      if (response.data && response.data.user) {
        // Formato ApiResponse con data wrapper
        ({ user: userData, accessToken, refreshToken } = response.data);
      } else if (response.user && response.accessToken) {
        // Formato directo (como vemos en el console.log)
        ({ user: userData, accessToken, refreshToken } = response);
      } else {
        throw new Error('Formato de respuesta inesperado');
      }
      
      if (userData && accessToken) {
        // Guardar tokens
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        console.log('Login exitoso, usuario guardado:', userData);
        return response;
      }
      
      throw new Error('No se recibieron datos del usuario');
    } catch (error: any) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      return response;
    } catch (error: any) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.verifyEmail(email, code);
      return response;
    } catch (error: any) {
      console.error('Error en verificación:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.forgotPassword(email);
      return response;
    } catch (error: any) {
      console.error('Error en forgot password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.resetPassword(email, code, newPassword);
      return response;
    } catch (error: any) {
      console.error('Error en reset password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    permissions,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;