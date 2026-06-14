// Firebase auth replaced with self-hosted JWT auth.
// All auth functions now live in services/auth.js
import { registerUser, loginUser, logoutUser, getToken } from "../services/auth";

// Google login removed — was tied to Firebase. Keeping the export so
// imports don't break; callers should hide/disable the Google button.
const loginWithGoogle = () => {
  throw new Error("Google login is not available with the current auth provider.");
};

export { registerUser, loginUser, loginWithGoogle, logoutUser, getToken };
