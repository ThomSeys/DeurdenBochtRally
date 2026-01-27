import { createContext, useContext, type ReactNode } from 'react';
import { useRouteLoaderData } from 'react-router';

interface Participant {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_admin: boolean;
  profile_photo_url?: string;
  qr_code?: string;
  checked_in?: boolean;
  // Add other fields as needed
}

interface AuthContextType {
  user: Participant | null;
  participant: Participant | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Get user data from root loader
  const rootData = useRouteLoaderData('root') as { user?: Participant } | undefined;
  
  const user = rootData?.user ?? null;
  const participant = user; // In this app, user and participant are the same
  const isAdmin = user?.is_admin ?? false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        participant,
        isAdmin,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
