// Unsplash hook removed — cover images now use saved DB images or CSS gradients.
// Keeping file so imports don't break.
export default function useUnsplash() {
  return { images: [], loading: false, searchImages: async () => [] };
}
