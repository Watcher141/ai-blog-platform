import { auth } from "./firebase";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = () =>
  signInWithPopup(auth, provider);

export const logoutUser = () =>
  signOut(auth);

export const getToken = async () => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
};