import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("healthpartner_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password, role) => {
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      role,
      name: email.split("@")[0],
    };

    localStorage.setItem("healthpartner_user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const register = async (email, password, name, role) => {
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      role,
      name,
    };

    localStorage.setItem("healthpartner_user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem("healthpartner_user");
    setUser(null);
  };

  const updateProfile = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("healthpartner_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
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
