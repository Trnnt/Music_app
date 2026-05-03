import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Song } from '../constants/data';

interface PlayerContextType {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  isPlayerOpen: boolean;
  isLooping: boolean;
  isShuffle: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;
  setPlaylistAndPlay: (list: Song[], startIndex: number) => void;
  togglePlayPause: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  nextSong: () => void;
  prevSong: () => void;
  openPlayer: () => void;
  closePlayer: () => void;
  seekTo: (millis: number) => void;
  stopAndClear: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const lastActionTime = useRef(0);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failedSongsRef = useRef<Set<string>>(new Set()); // Track songs that failed to load
  const loadingIdRef = useRef<string>(''); // Track which song we're currently loading

  const currentSong = currentSongIndex >= 0 && currentSongIndex < playlist.length 
    ? playlist[currentSongIndex] 
    : null;

  // Initialize Audio once
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('Failed to set audio mode', e);
      }
    };
    initAudio();
    
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (soundRef.current) {
       soundRef.current.setIsLoopingAsync(isLooping).catch(() => {});
    }
  }, [isLooping]);

  // Playback status handler
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.warn('Playback error:', status.error);
        // Auto-skip on playback error
        skipToNextSafe();
      }
      return;
    }
    
    setPosition(status.positionMillis);
    setDuration(status.durationMillis ?? 0);
    setIsBuffering(status.isBuffering ?? false);
    
    // Sync play state (but ignore for 1s after user action to avoid flicker)
    if (Date.now() - lastActionTime.current > 1000) {
      setIsPlaying(status.isPlaying);
    }
    
    if (status.didJustFinish && !status.isLooping) {
      if (isShuffle) {
        const nextIdx = Math.floor(Math.random() * playlist.length);
        setCurrentSongIndex(nextIdx);
      } else {
        skipToNextSafe();
      }
    }
  }, [isShuffle, playlist.length]);

  // Skip to next song safely (used for error recovery)
  const skipToNextSafe = useCallback(() => {
    setCurrentSongIndex(prev => {
      if (playlist.length === 0) return prev;
      return (prev + 1) % playlist.length;
    });
  }, [playlist.length]);

  // Load song when index changes - with error recovery and timeout
  useEffect(() => {
    let isCancelled = false;

    async function loadSong() {
      if (!currentSong || !currentSong.uri) return;
      
      const songId = currentSong.id;
      loadingIdRef.current = songId;
      
      // Skip songs that have already failed to avoid infinite loop
      if (failedSongsRef.current.has(songId)) {
        // If ALL songs in playlist have failed, stop
        if (failedSongsRef.current.size >= playlist.length) {
          console.warn('All songs in playlist failed to load');
          setIsPlaying(false);
          return;
        }
        // Skip to next
        skipToNextSafe();
        return;
      }

      setIsBuffering(true);

      try {
        // Unload previous sound
        if (soundRef.current) {
          const oldSound = soundRef.current;
          soundRef.current = null;
          try { await oldSound.stopAsync(); } catch {}
          try { await oldSound.unloadAsync(); } catch {}
        }

        if (isCancelled) return;

        // Set a timeout — if song doesn't load in 8 seconds, skip
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = setTimeout(() => {
          if (loadingIdRef.current === songId && !isCancelled) {
            console.warn('Song load timeout, skipping:', currentSong.title);
            failedSongsRef.current.add(songId);
            skipToNextSafe();
          }
        }, 8000);

        const { sound } = await Audio.Sound.createAsync(
          { uri: currentSong.uri },
          { 
            shouldPlay: true, 
            isLooping, 
            progressUpdateIntervalMillis: 500, 
            volume: 1.0,
          },
          onPlaybackStatusUpdate
        );
        
        if (!isCancelled && loadingIdRef.current === songId) {
          // Clear timeout since we loaded successfully
          if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
          
          soundRef.current = sound;
          setIsPlaying(true);
          setIsBuffering(false);
          
          // Clear this song from failed set if it was there
          failedSongsRef.current.delete(songId);
        } else {
          await sound.unloadAsync().catch(() => {});
        }
      } catch (e) {
        console.warn("Failed to load song:", currentSong.title, e);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        
        if (!isCancelled) {
          failedSongsRef.current.add(songId);
          setIsBuffering(false);
          // Auto-skip to next song on error
          skipToNextSafe();
        }
      } 
    }
    
    loadSong();

    return () => {
      isCancelled = true;
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [currentSongIndex, playlist]);

  const setPlaylistAndPlay = useCallback((list: Song[], startIndex: number) => {
    // Reset failed songs when loading a new playlist
    failedSongsRef.current.clear();
    setPlaylist(list);
    setCurrentSongIndex(startIndex);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    lastActionTime.current = Date.now();
    if (isPlaying) {
      setIsPlaying(false);
      soundRef.current.pauseAsync().catch(() => {});
    } else {
      setIsPlaying(true);
      soundRef.current.playAsync().catch(() => {});
    }
  }, [isPlaying]);

  const toggleLoop = useCallback(() => setIsLooping(prev => !prev), []);
  const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
  
  const nextSong = useCallback(() => {
    if (playlist.length === 0) return;
    lastActionTime.current = Date.now();
    setIsPlaying(false);
    if (isShuffle) {
      setCurrentSongIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentSongIndex(prev => (prev + 1) % playlist.length);
    }
  }, [playlist.length, isShuffle]);
  
  const prevSong = useCallback(() => {
    if (playlist.length === 0) return;
    lastActionTime.current = Date.now();
    setIsPlaying(false);
    setCurrentSongIndex(prev => (prev - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const seekTo = useCallback(async (millis: number) => {
    if (soundRef.current) {
      setPosition(millis);
      soundRef.current.setPositionAsync(millis).catch(() => {});
    }
  }, []);

  const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
  const closePlayer = useCallback(() => setIsPlayerOpen(false), []);

  const stopAndClear = useCallback(async () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlaylist([]);
    setCurrentSongIndex(-1);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setIsBuffering(false);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        playlist,
        isPlaying,
        isPlayerOpen,
        isLooping,
        isShuffle,
        position,
        duration,
        isBuffering,
        setPlaylistAndPlay,
        togglePlayPause,
        toggleLoop,
        toggleShuffle,
        nextSong,
        prevSong,
        openPlayer,
        closePlayer,
        seekTo,
        stopAndClear,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
