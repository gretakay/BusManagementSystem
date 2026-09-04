"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import { onSnapshotWithRetry, useRetryToken } from "@/lib/firebase/onSnapshotWithRetry";
import type { UserRoleDoc } from "@/types/role";

interface AuthContextValue {
  user: User | null;
  role: UserRoleDoc | null;
  loading: boolean;
  roleLoading: boolean;
  roleError: boolean;
  retryRole: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  roleLoading: true,
  roleError: false,
  retryRole: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRoleDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState(false);
  const [retryToken, retryRole] = useRetryToken();

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
      setRoleLoading(false);
      setRoleError(false);
      return;
    }

    setRoleLoading(true);
    setRoleError(false);

    const unsub = onSnapshotWithRetry(
      doc(getDb(), "roles", user.uid),
      (snap) => {
        setRole(snap.exists() ? (snap.data() as UserRoleDoc) : null);
        setRoleLoading(false);
        setRoleError(false);
      },
      () => {
        setRoleLoading(false);
        setRoleError(true);
      },
    );

    return () => unsub();
  }, [user, retryToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        roleLoading,
        roleError,
        retryRole,
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
