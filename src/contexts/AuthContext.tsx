import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { backend } from '@/services';

interface StaticUser {
  id: string;
  email?: string;
  wallet_address?: string;
}

interface StaticSession {
  user: StaticUser;
  access_token?: string;
}

interface AuthContextType {
  user: StaticUser | null;
  session: StaticSession | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaticUser | null>(null);
  const [session, setSession] = useState<StaticSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await backend.auth.hasRole(userId, 'admin');
      setIsAdmin(data || false);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = backend.authCore.onAuthStateChange(
      (event: string, session: any) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    backend.authCore.getSession().then((result: any) => {
      const session = result?.data?.session ?? null;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await backend.authCore.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await backend.authCore.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });

    if (data?.user && !error) {
      const referralCode = localStorage.getItem('referralCode');
      if (referralCode) {
        const { data: referrer } = await backend.profiles.getByReferralCode(referralCode);

        if (referrer && referrer.wallet_address) {
          console.log('Referral code found:', referralCode);
        }
        
        localStorage.removeItem('referralCode');
      }
    }

    return { error };
  };

  const signOut = async () => {
    await backend.authCore.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
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