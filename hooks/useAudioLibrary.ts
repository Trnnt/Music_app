import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';
import { Song } from '@/constants/data';

// Directories that typically contain recordings/non-music audio (Reduced for maximum visibility)
const EXCLUDED_DIRS = [
  'whatsapp/media/whatsapp voice notes',
  'telegram/telegram audio',
];

// Music file extensions we want
const MUSIC_EXTENSIONS = ['.mp3', '.m4a', '.flac', '.wav', '.ogg', '.aac', '.wma', '.opus', '.mp4a', '.webm', '.weba'];

// Try to extract artist/title from filename patterns like "Artist - Title" or "Title"
function parseFilename(filename: string): { title: string; artist: string } {
  // Remove extension
  const name = filename.replace(/\.[^/.]+$/, '');
  
  // Common separators: " - ", " _ ", " – "
  const separators = [' - ', ' – ', ' — ', ' _ '];
  for (const sep of separators) {
    const parts = name.split(sep);
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(sep).trim(),
      };
    }
  }
  
  // No separator found, just use filename as title  
  return { title: name.trim(), artist: 'Unknown Artist' };
}

// Extract folder name from URI to use as album
function extractFolderName(uri: string): string {
  try {
    // URI format: content://... or file:///storage/emulated/0/Music/AlbumName/song.mp3
    const decoded = decodeURIComponent(uri);
    const parts = decoded.split('/');
    if (parts.length >= 2) {
      return parts[parts.length - 2] || 'Unknown Album';
    }
  } catch {}
  return 'Unknown Album';
}

function isLikelyMusicFile(filename: string, uri: string, durationSecs: number): boolean {
  const lowerFilename = filename.toLowerCase();
  const lowerUri = uri.toLowerCase();
  
  // Check extension
  const hasValidExt = MUSIC_EXTENSIONS.some(ext => lowerFilename.endsWith(ext));
  if (!hasValidExt) return false;
  
  // Exclude only very short snippets (< 5 seconds)
  if (durationSecs > 0 && durationSecs < 5) return false;
  
  // Minimal exclusion for voice notes only
  for (const dir of EXCLUDED_DIRS) {
    if (lowerUri.includes(dir)) return false;
  }
  
  return true;
}

export interface AlbumData {
  name: string;
  songs: Song[];
  artworkSample?: string;
}

export interface ArtistData {
  name: string;
  songs: Song[];
  songCount: number;
}

export type SortOrder = 'title' | 'date';

export function useAudioLibrary() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<ArtistData[]>([]);
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOrder>('date');
  
  const isExpoGo = Constants.appOwnership === 'expo';

  const loadAudioFiles = async (isManualRefresh = false) => {
    if (isExpoGo) {
      console.warn("Running in Expo Go: Local audio requires custom build. Use Online tab to search songs.");
      setSongs([]);
      setIsLoading(false);
      return;
    }

    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const currentPermission = await MediaLibrary.getPermissionsAsync();
      let hasPermission = currentPermission.status === 'granted';
      
      if (!hasPermission && currentPermission.canAskAgain) {
        const res = await MediaLibrary.requestPermissionsAsync();
        hasPermission = res.status === 'granted';
      }

      if (!hasPermission) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Fetch all audio assets in batches
      let allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let endCursor: string | undefined;
      
      while (hasNextPage) {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: ['audio'],
          first: 500,
          after: endCursor,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });
        
        allAssets = [...allAssets, ...media.assets];
        hasNextPage = media.hasNextPage;
        endCursor = media.endCursor;
        
        if (allAssets.length >= 3000) break;
      }

      // Process and group songs
      const localSongs: Song[] = [];
      const artistMap = new Map<string, Song[]>();
      const albumMap = new Map<string, Song[]>();

      for (const asset of allAssets) {
        if (!isLikelyMusicFile(asset.filename, asset.uri, asset.duration)) continue;

        const parsed = parseFilename(asset.filename);
        const albumName = extractFolderName(asset.uri);

        const song: Song = {
          id: asset.id,
          title: parsed.title,
          artist: parsed.artist,
          album: albumName,
          artwork: '', 
          duration: asset.duration,
          uri: asset.uri,
          creationTime: asset.creationTime,
        };

        localSongs.push(song);
        
        const artistSongs = artistMap.get(parsed.artist) || [];
        artistSongs.push(song);
        artistMap.set(parsed.artist, artistSongs);
        
        const albumSongs = albumMap.get(albumName) || [];
        albumSongs.push(song);
        albumMap.set(albumName, albumSongs);
      }

      // Internal sorting for performance
      if (sortBy === 'title') {
        localSongs.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        localSongs.sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
      }

      const artistList: ArtistData[] = Array.from(artistMap.entries())
        .map(([name, songs]) => ({ name, songs, songCount: songs.length }))
        .sort((a, b) => b.songCount - a.songCount);

      const albumList: AlbumData[] = Array.from(albumMap.entries())
        .map(([name, songs]) => ({ name, songs }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setSongs(localSongs);
      setArtists(artistList);
      setAlbums(albumList);
    } catch (error) {
      console.warn('Error fetching audio files:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAudioFiles();
  }, [isExpoGo, sortBy]);

  return { 
    songs, 
    artists, 
    albums, 
    isLoading, 
    isRefreshing, 
    sortBy, 
    setSortBy, 
    refreshLibrary: () => loadAudioFiles(true) 
  };
}
