import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const mockUser = {
  name: 'Nikshit Saini',
  email: 'nikshit@example.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://i.pravatar.cc/100?img=33',
  addresses: [
    { id: 1, label: 'Home', street: '123 Oak Street, Apt 4B', city: 'San Francisco', state: 'CA', zip: '94102', isDefault: true },
    { id: 2, label: 'Office', street: '456 Market Street, Floor 12', city: 'San Francisco', state: 'CA', zip: '94105', isDefault: false },
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const signIn = (email, password) => {
    // Mock sign-in — accept any credentials
    setUser(mockUser);
    return true;
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
