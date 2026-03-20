import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import blogReducer from "../features/blogSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer
  }
});