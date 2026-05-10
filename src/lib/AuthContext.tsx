import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { User } from '@/src/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous auth failed", error);
          setLoading(false);
        }
        return;
      }
      
      setUser(fbUser);

      // Automatically register user if they don't exist
      const userRef = doc(db, 'users', fbUser.uid);
      try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          const newUser = {
            displayName: 'Guest',
            role: 'unassigned',
            points: 0,
            streak: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newUser).catch(e => {
            console.error('Failed to create internal user doc:', e);
            throw e;
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      }
      
      const unsubscribeDoc = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile({ id: snapshot.id, ...snapshot.data() } as User);
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
        setLoading(false);
      });
      
      return () => unsubscribeDoc();
    });
    
    return () => unsubscribeAuth();
  }, []);

  const signIn = async () => {
    // If not signed in, auto sign in
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
