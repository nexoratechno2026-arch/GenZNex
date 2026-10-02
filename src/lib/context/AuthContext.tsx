"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/client";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logoutUser,
} from "../firebase/auth";
import type { UserDoc, UserRole } from "@/types/schema";

interface AuthContextType {
  user: User | null;
  userProfile: UserDoc | null;
  role: UserRole;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: "student",
  loading: true,
  signInWithEmail: async () => { throw new Error("Uninitialized"); },
  signUpWithEmail: async () => { throw new Error("Uninitialized"); },
  signInWithGoogle: async () => { throw new Error("Uninitialized"); },
  logout: async () => {},
  refreshClaims: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserDoc | null>(null);
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(true);

  // Fetch token custom claims (role)
  const resolveRole = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setRole("student");
      return;
    }
    try {
      const tokenResult = await getIdTokenResult(firebaseUser, true);
      const claimRole = tokenResult.claims.role as UserRole | undefined;
      if (claimRole && ["student", "trainer", "admin"].includes(claimRole)) {
        setRole(claimRole);
      } else {
        setRole("student");
      }
    } catch (err) {
      console.warn("Failed to fetch custom claims:", err);
      setRole("student");
    }
  };

  const refreshClaims = async () => {
    if (user) {
      await resolveRole(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await resolveRole(currentUser);

        // Listen to Firestore profile updates
        const userRef = doc(db, "users", currentUser.uid);
        const unsubProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserDoc;
            setUserProfile(data);
            if (data.role) {
              setRole(data.role);
            }
          }
        });

        setLoading(false);
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setRole("student");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout: logoutUser,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
