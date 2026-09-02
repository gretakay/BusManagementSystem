"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import type { UserRoleDoc } from "@/types/role";

const ROLE_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

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
  const [retryToken, setRetryToken] = useState(0);

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

    let cancelled = false;
    let unsubRole: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    setRoleLoading(true);
    setRoleError(false);

    function subscribe(attempt: number) {
      unsubRole = onSnapshot(
        doc(getDb(), "roles", user!.uid),
        (snap) => {
          if (cancelled) return;
          setRole(snap.exists() ? (snap.data() as UserRoleDoc) : null);
          setRoleLoading(false);
          setRoleError(false);
        },
        (err) => {
          if (cancelled) return;
          console.error("roles/{uid} listener failed", err);
          if (attempt < ROLE_RETRY_DELAYS_MS.length) {
            retryTimer = setTimeout(() => {
              if (cancelled) return;
              subscribe(attempt + 1);
            }, ROLE_RETRY_DELAYS_MS[attempt]);
          } else {
            setRoleLoading(false);
            setRoleError(true);
          }
        },
      );
    }

    subscribe(0);

    return () => {
      cancelled = true;
      unsubRole?.();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [user, retryToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        roleLoading,
        roleError,
        retryRole: () => setRetryToken((n) => n + 1),
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
