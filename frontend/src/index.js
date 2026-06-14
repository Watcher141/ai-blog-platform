import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import { Provider, useDispatch } from "react-redux";
import { store } from "./store/store";
import { setUser, logout } from "./features/authSlice";

import App from "./App";

import { verifyToken } from "./services/auth";
import "./styles/global.css";

function AuthLoader() {
  const dispatch = useDispatch();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const result = await verifyToken();
      if (result) {
        dispatch(
          setUser({
            user: {
              id: result.user.id,
              uid: result.user.id,
              email: result.user.email,
              displayName: result.user.displayName,
            },
            token: result.token,
          }),
        );
      } else {
        dispatch(logout());
      }
      setAuthReady(true);
    };
    init();
  }, [dispatch]);

  if (!authReady) return null;

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <AuthLoader />
  </Provider>,
);
