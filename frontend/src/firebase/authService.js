import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export const registerUser = async (email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  // ✅ Send verification email immediately after register
  await sendEmailVerification(res.user);
  return res;
};

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = () => signInWithPopup(auth, provider);

export const logoutUser = () => signOut(auth);

export const getToken = async () => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
};
