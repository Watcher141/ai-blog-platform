import { createSlice } from "@reduxjs/toolkit";

const blogSlice = createSlice({
  name: "blog",
  initialState: {
    blogs: [],
    myBlogs: [],
    currentBlog: null
  },
  reducers: {
    setBlogs(state, action) {
      state.blogs = action.payload;
    },
    setMyBlogs(state, action) {
      state.myBlogs = action.payload;
    },
    setCurrentBlog(state, action) {
      state.currentBlog = action.payload;
    }
  }
});

export const { setBlogs, setMyBlogs, setCurrentBlog } = blogSlice.actions;
export default blogSlice.reducer;