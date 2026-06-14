const FIREBASE_CONFIG = process.env.REACT_APP_FIREBASE_CONFIG;

let firebaseApp = null;
let firebaseAuth = null;

try {
  if (FIREBASE_CONFIG) {
    const config = JSON.parse(FIREBASE_CONFIG);
    const { initializeApp } = require("firebase/app");
    const { getAuth, connectAuthEmulator } = require("firebase/auth");

    firebaseApp = initializeApp(config);
    firebaseAuth = getAuth(firebaseApp);

    if (process.env.REACT_APP_FIREBASE_EMULATOR) {
      connectAuthEmulator(
        firebaseAuth,
        process.env.REACT_APP_FIREBASE_EMULATOR,
      );
    }

    console.log("[Firebase] Client SDK initialized");
  } else {
    console.log(
      "[Firebase] No REACT_APP_FIREBASE_CONFIG set — Firebase auth disabled. Set it in .env to enable.",
    );
  }
} catch (e) {
  console.warn("[Firebase] Failed to initialize Firebase client:", e.message);
}

export function getFirebaseAuth() {
  return firebaseAuth;
}

export function isFirebaseAvailable() {
  return firebaseApp !== null && firebaseAuth !== null;
}

export { firebaseApp, firebaseAuth };
