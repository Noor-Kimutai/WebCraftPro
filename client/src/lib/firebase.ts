import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, set, update, onDisconnect, serverTimestamp, get } from "firebase/database";
import { nanoid } from 'nanoid';

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

export const updateGameState = (gameId: string, gameState: any) => {
  const gameRef = ref(db, `games/${gameId}`);
  return update(gameRef, gameState);
};


export const subscribeToMatches = (userId: string, onMatch: (gameId: string) => void) => {
  const matchRef = ref(db, `matches/${userId}`);
  return onValue(matchRef, (snapshot) => {
    const match = snapshot.val();
    if (match && match.gameId) {
      onMatch(match.gameId);
      // Clean up the match after handling it
      set(matchRef, null);
    }
  });
};

// Update the findMatch function to include display names
export const findMatch = async (userId: string) => {
  const waitingRef = ref(db, 'waiting');
  const snapshot = await get(waitingRef);
  const waitingPlayers = snapshot.val() || {};

  // Get current user's data
  const userRef = ref(db, `users/${userId}`);
  const userSnapshot = await get(userRef);
  const userData = userSnapshot.val();

  // Filter out our own user ID and find the earliest waiting player
  const availablePlayers = Object.entries(waitingPlayers)
    .filter(([id]) => id !== userId)
    .sort(([, a]: any, [, b]: any) => a.joinedAt - b.joinedAt);

  if (availablePlayers.length > 0) {
    const [matchedPlayerId] = availablePlayers[0];

    // Get matched player's data
    const matchedPlayerRef = ref(db, `users/${matchedPlayerId}`);
    const matchedPlayerSnapshot = await get(matchedPlayerRef);
    const matchedPlayerData = matchedPlayerSnapshot.val();

    // Create a new game with complete initial state
    const gameId = nanoid();
    const gameData = {
      player1: { 
        id: userId, 
        displayName: userData.displayName,
        score: 0,
        move: null
      },
      player2: { 
        id: matchedPlayerId, 
        displayName: matchedPlayerData.displayName,
        score: 0,
        move: null
      },
      currentRound: 1,
      roundComplete: false,
      roundInProgress: false,
      isTieBreaker: false,
      regularRoundsComplete: false,
      status: 'active',
      createdAt: serverTimestamp()
    };

    // Update all references atomically
    const updates: any = {
      [`games/${gameId}`]: gameData,
      [`matches/${userId}`]: { gameId },
      [`matches/${matchedPlayerId}`]: { gameId },
      [`waiting/${userId}`]: null,
      [`waiting/${matchedPlayerId}`]: null
    };

    await update(ref(db), updates);
    return gameId;
  } else {
    // If no match found, add/update our waiting status
    const waitingPlayerRef = ref(db, `waiting/${userId}`);
    await set(waitingPlayerRef, {
      joinedAt: serverTimestamp()
    });
    return null;
  }
};

// Update addToWaitingList function
export const addToWaitingList = async (userId: string) => {
  await findMatch(userId);
};