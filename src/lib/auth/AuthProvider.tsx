"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import type { UserRoleDoc } from "@/types/role";

interface AuthContextValue {
  user: User | null;
  role: UserRoleDoc | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRoleDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    const unsubRole = onSnapshot(doc(getDb(), "roles", user.uid), (snap) => {
      setRole(snap.exists() ? (snap.data() as UserRoleDoc) : null);
    });
    return () => unsubRole();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signOut: () => firebaseSignOut(getFirebaseAuth()),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
