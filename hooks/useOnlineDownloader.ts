import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { Song } from '@/constants/data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

const DOWNLOAD_DIR = FileSystem.documentDirectory + 'downloads/';
const DOWNLOADED_METADATA_KEY = '@downloaded_metadata';

export function useOnlineDownloader() {
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { syncWithServer, user } = useAuth();
  
  const [downloadedSongs, setDownloadedSongs] = useState<Song[]>([]);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    initDownloader();
  }, []);

  const initDownloader = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
      }
      
      const storedMetadata = await AsyncStorage.getItem(DOWNLOADED_METADATA_KEY);
      if (storedMetadata) {
        const parsed: Song[] = JSON.parse(storedMetadata);
        setDownloadedSongs(parsed);
      }
    } catch (e) {
      console.error('Error initializing downloader:', e);
    }
  };

  const search = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // iTunes Search API - works everywhere, no API key, huge catalog
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=30`
      );
      const data = await res.json();
      
      if (data.results) {
        const mappedResults: Song[] = data.results
          .filter((item: any) => item.previewUrl) // Only include tracks with preview
          .map((item: any) => ({
            id: item.trackId?.toString() || Date.now().toString(),
            title: item.trackName || 'Unknown',
            artist: item.artistName || 'Unknown',
            artwork: (item.artworkUrl100 || '').replace('100x100', '600x600'),
            duration: item.trackTimeMillis || 30000,
            uri: item.previewUrl,
          }));
        
        setSearchResults(mappedResults);
      }
    } catch (e) {
      console.error('iTunes Search Error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const downloadTrack = async (song: Song) => {
    if (!song.uri) return;

    try {
      setIsDownloading(prev => ({ ...prev, [song.id]: true }));
      setDownloadProgress(prev => ({ ...prev, [song.id]: 0 }));

      const fileUri = DOWNLOAD_DIR + `${song.id}.mp3`;

      const downloadResumable = FileSystem.createDownloadResumable(
        song.uri,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(prev => ({ ...prev, [song.id]: progress }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download failed');

      const localSong: Song = {
        ...song,
        uri: result.uri,
      };

      const updatedList = [...downloadedSongs, localSong];
      setDownloadedSongs(updatedList);
      await AsyncStorage.setItem(DOWNLOADED_METADATA_KEY, JSON.stringify(updatedList));

      // 🛰️ Cloud Auto-Backup
      if (user) {
        await syncWithServer(user, undefined, updatedList);
      }

    } catch (e) {
      console.error('Failed to download track:', e);
    } finally {
      setIsDownloading(prev => ({ ...prev, [song.id]: false }));
      setDownloadProgress(prev => ({ ...prev, [song.id]: 0 }));
    }
  };
  
  const removeDownloadedTrack = async (songId: string) => {
    try {
      const fileUri = DOWNLOAD_DIR + `${songId}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
      
      const updatedList = downloadedSongs.filter(s => s.id !== songId);
      setDownloadedSongs(updatedList);
      await AsyncStorage.setItem(DOWNLOADED_METADATA_KEY, JSON.stringify(updatedList));

      // 🛰️ Cloud Sync Removal
      if (user) {
        await syncWithServer(user, undefined, updatedList);
      }
      
    } catch(e) {
       console.error('Failed to remove track', e);
    }
  };

  return {
    searchResults,
    isSearching,
    downloadedSongs,
    isDownloading,
    downloadProgress,
    search,
    downloadTrack,
    removeDownloadedTrack
  };
}
