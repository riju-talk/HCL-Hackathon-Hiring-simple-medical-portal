import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, checkHealth } from "@/lib/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
    
        const healthResponse = await checkHealth();
        if (!healthResponse.success) {
          console.error('API is not available');
          setLoading(false);
          return;
        }

  
        try {
          const response = await getCurrentUser();
          if (response.success && response.user) {
            setUser({
              id: response.user.userId,
              email: response.user.email,
              role: response.user.role,
              name: response.user.fullName
            });
          }
        } catch (authError) {
         
        }
      } catch (error) {
        // API not available, silently ignore
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await apiLogin({ email, password, role });
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          name: response.user.fullName
        };
        setUser(userData);
        return userData;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, name, role) => {
    try {
      const response = await apiRegister({ 
        email, 
        password, 
        fullName: name, 
        role 
      });
      
      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          name: response.user.fullName
        };
        setUser(userData);
        return userData;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const updateProfile = (updates) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
