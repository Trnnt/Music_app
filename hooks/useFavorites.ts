import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites_list';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]); // stores song IDs

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load favorites:', e);
    }
  };

  const toggleFavorite = async (songId: string) => {
    try {
      let updated: string[];
      if (favorites.includes(songId)) {
        updated = favorites.filter(id => id !== songId);
      } else {
        updated = [...favorites, songId];
      }
      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to toggle favorite:', e);
    }
  };

  const isFavorite = (songId: string) => favorites.includes(songId);

  return { favorites, toggleFavorite, isFavorite };
}
