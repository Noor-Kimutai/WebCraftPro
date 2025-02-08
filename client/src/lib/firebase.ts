import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, set, update, onDisconnect, serverTimestamp } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Auth functions
export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await setUserOnlineStatus(userId, false);
  }
  return signOut(auth);
};

// Database functions
export const setUserOnlineStatus = async (userId: string, isOnline: boolean) => {
  const userStatusRef = ref(db, `users/${userId}`);

  // Create user presence object
  const status = {
    isOnline,
    lastActive: serverTimestamp(),
    email: auth.currentUser?.email,
    displayName: auth.currentUser?.email?.split('@')[0] // Use email prefix as display name
  };

  if (isOnline) {
    // Set up presence handling
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // If we lose connection, set user as offline
        onDisconnect(userStatusRef).update({
          isOnline: false,
          lastActive: serverTimestamp()
        });

        // Set user as online
        return set(userStatusRef, status);
      }
    });
  } else {
    // Simply set user as offline
    return set(userStatusRef, status);
  }
};

export const subscribeToOnlineUsers = (callback: (users: any) => void) => {
  const usersRef = ref(db, 'users');
  return onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    // Filter and transform users data
    const onlineUsers = Object.entries(users || {}).reduce((acc: any[], [id, data]: [string, any]) => {
      if (data.isOnline) {
        acc.push({
          id,
          displayName: data.displayName,
          email: data.email,
          lastActive: data.lastActive,
          gamesPlayed: data.gamesPlayed || 0
        });
      }
      return acc;
    }, []);
    callback(onlineUsers);
  });
};

export const addToWaitingList = (userId: string) => {
  const waitingRef = ref(db, `waiting/${userId}`);
  return set(waitingRef, {
    joinedAt: serverTimestamp()
  });
};

export const updateGameState = (gameId: string, gameState: any) => {
  const gameRef = ref(db, `games/${gameId}`);
  return update(gameRef, gameState);
};