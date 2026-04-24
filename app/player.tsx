import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedStyle, withTiming, withRepeat, Easing, useSharedValue, 
  withSpring, runOnJS 
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, 
  ChevronDown, ListMusic, Heart, Languages, Settings2 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, memo } from 'react';
import { Image } from 'expo-image';

import { usePlayer } from '@/context/PlayerContext';
import { useImageColors } from '@/hooks/useImageColors';
import { useFavorites } from '@/hooks/useFavorites';
import SongArtwork from '@/components/SongArtwork';
import WaveformProgress from '@/components/WaveformProgress';
import { PremiumBackground } from '@/components/PremiumBackground';
import { GlassView } from '@/components/ui/GlassView';

const { width, height } = Dimensions.get('window');

function isLocalArtwork(artwork: string): boolean {
  if (!artwork) return true;
  if (artwork === '') return true;
  if (artwork.includes('unsplash.com')) return true;
  if (artwork.startsWith('http')) return false;
  return false;
}

const CUSTOM_COVER = require('../assets/images/rimuru.jpg');

const PlayerArtwork = memo(({ artwork, size }: { artwork: string; songTitle: string; size: number }) => {
  const isRemote = artwork && artwork.startsWith('http');
  
  if (!isRemote && (isLocalArtwork(artwork) || !artwork)) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        <Image 
          source={CUSTOM_COVER} 
          style={{ width: size, height: size }} 
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: artwork }} 
      placeholder={CUSTOM_COVER}
      placeholderContentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#1a1a1a',
      }} 
      contentFit="cover"
      transition={300}
      cachePolicy="disk"
    />
  );
});

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { 
    currentSong, playlist, isPlaying, togglePlayPause, 
    nextSong, prevSong, closePlayer, position, duration, seekTo, setPlaylistAndPlay,
    isLooping, isShuffle, toggleLoop, toggleShuffle, isBuffering
  } = usePlayer();

  const colors = useImageColors(currentSong?.artwork, currentSong?.id);
  const { toggleFavorite, isFavorite } = useFavorites();
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEQ, setShowEQ] = useState(false);
  
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepTimerId, setSleepTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  const barHeights = Array.from({length: 24}, () => useSharedValue(4));
  
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        barHeights.forEach(bar => {
          bar.value = withTiming(Math.random() * 40 + 4, { duration: 150 });
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      barHeights.forEach(bar => {
        bar.value = withTiming(4, { duration: 300 });
      });
    }
  }, [isPlaying]);
  
  const setSleepTimer = useCallback((minutes: number) => {
    if (sleepTimerId) clearTimeout(sleepTimerId);
    if (minutes === 0) {
      setSleepMinutes(0);
      setSleepTimerId(null);
      setShowSleepMenu(false);
      return;
    }
    setSleepMinutes(minutes);
    const id = setTimeout(() => {
      if (isPlaying) togglePlayPause();
      setSleepMinutes(0);
      setSleepTimerId(null);
    }, minutes * 60 * 1000);
    setSleepTimerId(id);
    setShowSleepMenu(false);
  }, [sleepTimerId, isPlaying, togglePlayPause]);

  const handleClose = useCallback(() => {
    panY.value = withTiming(height, { duration: 250 }, () => {
      runOnJS(closePlayer)();
      runOnJS(router.back)();
    });
  }, [closePlayer, router]);

  const rotation = useSharedValue(0);
  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 25000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isPlaying]);

  const panY = useSharedValue(0);
  const artworkX = useSharedValue(0);
  
  const verticalGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        panY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        panY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const horizontalGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      artworkX.value = e.translationX * 0.5;
    })
    .onEnd((e) => {
      if (e.translationX > 60 || e.velocityX > 400) {
        artworkX.value = withTiming(width, { duration: 200 }, () => {
          runOnJS(nextSong)();
          artworkX.value = -width;
          artworkX.value = withSpring(0, { damping: 15, stiffness: 100 });
        });
      } else if (e.translationX < -60 || e.velocityX < -400) {
        artworkX.value = withTiming(-width, { duration: 200 }, () => {
          runOnJS(prevSong)();
          artworkX.value = width;
          artworkX.value = withSpring(0, { damping: 15, stiffness: 100 });
        });
      } else {
        artworkX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const composedGesture = Gesture.Simultaneous(verticalGesture, horizontalGesture);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = 1 - (Math.min(panY.value, height * 0.5) / height) * 0.15;
    const opacity = 1 - (Math.min(panY.value, height * 0.4) / height) * 1.5;
    return {
      transform: [{ translateY: panY.value }, { scale }],
      opacity,
    };
  });

  const animatedArtworkStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { translateX: artworkX.value }
    ],
  }));

  if (!currentSong) return null;

  const formatTime = (ms: number) => {
    if (ms <= 0) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const artworkSize = width - 64;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <PremiumBackground colors={colors} />

        <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn} activeOpacity={0.6}>
              <ChevronDown color="#FFFFFF" size={32} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.headerText}>{isBuffering ? 'Loading...' : 'Now Playing'}</Text>
              {sleepMinutes > 0 && <Text style={styles.sleepIndicator}>Sleep in {sleepMinutes}m</Text>}
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => setShowSleepMenu(!showSleepMenu)} style={[styles.iconBtn, {marginRight: 8}]} activeOpacity={0.6}>
                <Text style={{fontSize: 18}}>{sleepMinutes > 0 ? '⏰' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEQ(true)} style={[styles.iconBtn, {marginRight: 12}]} activeOpacity={0.6}>
                <Settings2 color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPlaylist(!showPlaylist)} style={styles.iconBtn} activeOpacity={0.6}>
                <ListMusic color={showPlaylist ? colors.primary : "#FFFFFF"} size={28} />
              </TouchableOpacity>
            </View>
          </View>

          {showSleepMenu && (
            <View style={styles.sleepMenu}>
              {[5, 10, 15, 30, 45, 60, 0].map(mins => (
                <TouchableOpacity key={mins} style={styles.sleepOption} onPress={() => setSleepTimer(mins)} activeOpacity={0.6}>
                  <Text style={[styles.sleepOptionText, sleepMinutes === mins && {color: colors.primary}]}>
                    {mins === 0 ? 'Off' : `${mins} min`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.mainLayout}>
            {showPlaylist ? (
              <GlassView style={styles.overlayContainer}>
                <View style={{padding: 20, flex: 1}}>
                  <Text style={styles.overlayTitle}>Up Next</Text>
                  <FlatList
                    data={playlist}
                    keyExtractor={(s) => s.id}
                    renderItem={({item, index}) => (
                      <TouchableOpacity 
                        style={styles.playlistItem} 
                        onPress={() => { setPlaylistAndPlay(playlist, index); setShowPlaylist(false); }}
                      >
                        <SongArtwork artwork={item.artwork} size={44} borderRadius={22} songTitle={item.title} />
                        <View style={{marginLeft: 12, flex: 1}}>
                          <Text style={[styles.playlistTitle, item.id === currentSong.id && {color: colors.primary}]}>{item.title}</Text>
                          <Text style={styles.playlistArtist}>{item.artist}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </GlassView>
            ) : showLyrics ? (
              <GlassView style={styles.overlayContainer}>
                <View style={{padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={styles.overlayTitle}>Lyrics</Text>
                  <Text style={styles.lyricsPlaceholder}>
                    Searching for lyrics...{"\n"}
                    This feature will be available soon!
                  </Text>
                </View>
              </GlassView>
            ) : (
              <>
                <Animated.View style={[styles.artworkWrapper, animatedArtworkStyle]}>
                  <View style={[styles.artworkShadow, { shadowColor: colors.primary }]} />
                  <PlayerArtwork artwork={currentSong.artwork} songTitle={currentSong.title} size={artworkSize} />
                </Animated.View>

                <View style={styles.visualizerContainer}>
                  {barHeights.map((h, i) => (
                    <Animated.View key={i} style={[styles.visualizerBar, { height: h, backgroundColor: colors.primary, opacity: 0.4 + (i / barHeights.length) * 0.6 }]} />
                  ))}
                </View>
              </>
            )}
          </View>

          <GlassView style={styles.controlsGlass} intensity={30}>
            <View style={styles.songInfo}>
              <View style={{flex: 1}}>
                <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                <Text style={[styles.artist, { color: colors.detail }]} numberOfLines={1}>{currentSong.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLyrics(!showLyrics)} style={[styles.iconBtn, {marginLeft: 12}]}>
                <Languages color={showLyrics ? colors.primary : "rgba(255,255,255,0.6)"} size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleFavorite(currentSong.id)} style={[styles.iconBtn, {marginLeft: 8}]}>
                <Heart color={isFavorite(currentSong.id) ? '#FF4B6E' : 'rgba(255,255,255,0.5)'} size={26} fill={isFavorite(currentSong.id) ? '#FF4B6E' : 'transparent'} />
              </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
              <WaveformProgress position={position} duration={duration} onSeek={seekTo} activeColor={colors.primary} />
              <View style={styles.timeLabels}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.mainControls}>
              <TouchableOpacity onPress={toggleShuffle}>
                <Shuffle color={isShuffle ? colors.primary : "rgba(255,255,255,0.6)"} size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={prevSong}>
                <SkipBack color="#FFF" size={36} fill="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayPause} style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                {isPlaying ? <Pause color="#000" size={32} fill="#000" /> : <Play color="#000" size={32} fill="#000" style={{marginLeft: 4}} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={nextSong}>
                <SkipForward color="#FFF" size={36} fill="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleLoop}>
                <Repeat color={isLooping ? colors.primary : "rgba(255,255,255,0.6)"} size={22} />
              </TouchableOpacity>
            </View>
          </GlassView>
        </View>

        <Modal visible={showEQ} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.eqModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Equalizer</Text>
                <TouchableOpacity onPress={() => setShowEQ(false)}>
                  <Text style={{color: colors.primary, fontWeight: 'bold'}}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.eqContent}>
                <Text style={styles.placeholderText}>Equalizer coming in next update!</Text>
                <View style={styles.eqMock}>
                  {[0.8, 0.4, 0.6, 0.9, 0.5].map((h, i) => (
                    <View key={i} style={[styles.eqBar, {height: 100 * h, backgroundColor: colors.primary}]} />
                  ))}
                </View>
              </View>
            </GlassView>
          </View>
        </Modal>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  iconBtn: { padding: 6 },
  headerText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 8 },
  sleepIndicator: { color: '#1DB954', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  sleepMenu: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginHorizontal: 24, marginBottom: 10 },
  sleepOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', margin: 4 },
  mainLayout: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  artworkWrapper: { width: width - 64, height: width - 64, justifyContent: 'center', alignItems: 'center' },
  artworkShadow: { ...StyleSheet.absoluteFillObject, borderRadius: (width - 64) / 2, opacity: 0.3, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 1, shadowRadius: 40, elevation: 25 },
  visualizerContainer: { flexDirection: 'row', height: 40, alignItems: 'flex-end', gap: 3, marginTop: 30 },
  visualizerBar: { width: 4, borderRadius: 2, minHeight: 4 },
  controlsGlass: { padding: 20, marginBottom: 10, width: '100%' },
  songInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  artist: { fontSize: 16, fontWeight: '500', opacity: 0.8 },
  progressSection: { marginBottom: 25 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontVariant: ['tabular-nums'] },
  mainControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, margin: 10 },
  overlayTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  playlistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  playlistTitle: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  playlistArtist: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  lyricsPlaceholder: { color: 'rgba(255,255,255,0.6)', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  eqModal: { height: height * 0.4, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  eqContent: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 30 },
  eqMock: { flexDirection: 'row', alignItems: 'flex-end', gap: 15, height: 100 },
  eqBar: { width: 20, borderRadius: 10 },
});
