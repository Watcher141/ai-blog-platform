import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import { Provider, useDispatch } from "react-redux";
import { store } from "./store/store";
import { setUser, logout } from "./features/authSlice";

import App from "./App";

import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./styles/global.css";

function AuthLoader() {
  const dispatch = useDispatch();
  const [authReady, setAuthReady] = useState(false); // ✅ wait for auth

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken(true);
        dispatch(
          setUser({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            },
            token,
          }),
        );
      } else {
        dispatch(logout());
      }
      setAuthReady(true); // ✅ auth state resolved
    });

    return () => unsubscribe();
  }, [dispatch]);

  // ✅ Don't render app until Firebase has restored session
  if (!authReady) return null;

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <AuthLoader />
  </Provider>,
);
