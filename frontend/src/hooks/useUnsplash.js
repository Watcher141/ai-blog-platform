import { useState, useCallback } from "react";

const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

export default function useUnsplash() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchImages = useCallback(async (query, count = 1) => {
    if (!query?.trim() || !UNSPLASH_KEY) return [];
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
      );
      const data = await res.json();
      const results =
        data.results?.map((img) => ({
          url: img.urls.regular,
          thumb: img.urls.thumb,
          alt: img.alt_description || query,
          author: img.user.name,
          authorLink: img.user.links.html,
        })) || [];
      setImages(results);
      return results;
    } catch (err) {
      console.error("Unsplash error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { images, loading, searchImages };
}
