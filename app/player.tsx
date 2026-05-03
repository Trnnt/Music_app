import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedStyle, withTiming, withRepeat, Easing, useSharedValue, 
  withSpring, runOnJS, FadeIn, FadeInDown, FadeInUp
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, 
  ChevronDown, ListMusic, Heart, Languages, Settings2, MoreVertical 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { usePlayer } from '../context/PlayerContext';
import { useImageColors } from '../hooks/useImageColors';
import { useFavorites } from '../hooks/useFavorites';
import SongArtwork from '../components/SongArtwork';
import WaveformProgress from '../components/WaveformProgress';
import { PremiumBackground } from '../components/PremiumBackground';
import { GlassView } from '../components/ui/GlassView';
import { Theme } from '../constants/Theme';

const { width, height } = Dimensions.get('window');
const CUSTOM_COVER = require('../assets/images/rimuru.jpg');

const PlayerArtwork = memo(({ artwork, size }: { artwork: string; size: number }) => {
  const isRemote = artwork && artwork.startsWith('http');
  
  return (
    <View style={[styles.artworkContainer, { width: size, height: size }]}>
      <Image 
        source={isRemote ? { uri: artwork } : CUSTOM_COVER} 
        placeholder={CUSTOM_COVER}
        style={{ width: size, height: size, borderRadius: size / 2 }} 
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
      />
    </View>
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

  // Animation values
  const rotation = useSharedValue(0);
  const panY = useSharedValue(0);
  const artworkX = useSharedValue(0);
  const barHeights = Array.from({length: 30}, () => useSharedValue(4));

  // Mock Lyrics Logic
  const lyrics = useMemo(() => {
    if (!currentSong) return [];
    return [
      { time: 0, text: "♪ Instrumental Intro ♪" },
      { time: 5000, text: `Listening to ${currentSong.title}` },
      { time: 10000, text: `Artist: ${currentSong.artist}` },
      { time: 15000, text: "Rimuru Music Premium" },
      { time: 20000, text: "Experience the magic of sound" },
      { time: 25000, text: "Every beat, every rhythm..." },
      { time: 30000, text: "Perfectly synced for you." },
      { time: 35000, text: "♪ Musical Interlude ♪" },
      { time: 45000, text: "Enjoy the high fidelity audio." },
      { time: 55000, text: "This is your personal music journey." }
    ];
  }, [currentSong?.id]);

  const currentLyricIndex = useMemo(() => {
    const index = lyrics.findIndex((l, i) => {
      const next = lyrics[i + 1];
      return position >= l.time && (!next || position < next.time);
    });
    return index === -1 ? 0 : index;
  }, [position, lyrics]);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 30000, easing: Easing.linear }),
        -1,
        false
      );
      const interval = setInterval(() => {
        barHeights.forEach(bar => {
          bar.value = withTiming(Math.random() * 30 + 4, { duration: 150 });
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      barHeights.forEach(bar => {
        bar.value = withTiming(4, { duration: 300 });
      });
    }
  }, [isPlaying]);

  const handleClose = useCallback(() => {
    panY.value = withTiming(height, { duration: 250 }, () => {
      runOnJS(closePlayer)();
      runOnJS(router.back)();
    });
  }, [closePlayer, router]);

  const verticalGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) panY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        panY.value = withSpring(0);
      }
    });

  const horizontalGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      artworkX.value = e.translationX * 0.4;
    })
    .onEnd((e) => {
      if (e.translationX > 60 || e.velocityX > 400) {
        artworkX.value = withTiming(width, { duration: 200 }, () => {
          runOnJS(nextSong)();
          artworkX.value = -width;
          artworkX.value = withSpring(0);
        });
      } else if (e.translationX < -60 || e.velocityX < -400) {
        artworkX.value = withTiming(-width, { duration: 200 }, () => {
          runOnJS(prevSong)();
          artworkX.value = width;
          artworkX.value = withSpring(0);
        });
      } else {
        artworkX.value = withSpring(0);
      }
    });

  const composedGesture = Gesture.Simultaneous(verticalGesture, horizontalGesture);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panY.value }],
  }));

  const animatedArtworkStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { translateX: artworkX.value }
    ],
  }));

  if (!currentSong) return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const artworkSize = width * 0.72;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <PremiumBackground colors={colors} />

        <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + Theme.spacing.md }]}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
              <ChevronDown color={Theme.colors.text} size={32} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerSub}>{isBuffering ? 'BUFFERING...' : 'PLAYING FROM LIBRARY'}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>{currentSong.album || 'Unknown Album'}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <MoreVertical color={Theme.colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainLayout}>
            {showPlaylist ? (
              <Animated.View entering={FadeIn} style={styles.overlayWrapper}>
                <GlassView style={styles.overlayContainer} intensity={40}>
                  <Text style={styles.overlayTitle}>Up Next</Text>
                  <FlatList
                    data={playlist}
                    keyExtractor={(s) => s.id}
                    renderItem={({item, index}) => (
                      <TouchableOpacity 
                        style={styles.playlistItem} 
                        onPress={() => { setPlaylistAndPlay(playlist, index); setShowPlaylist(false); }}
                      >
                        <SongArtwork artwork={item.artwork} size={48} borderRadius={Theme.radius.md} songTitle={item.title} />
                        <View style={styles.playlistText}>
                          <Text style={[styles.playlistTitle, item.id === currentSong.id && {color: Theme.colors.primary}]}>{item.title}</Text>
                          <Text style={styles.playlistArtist}>{item.artist}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </GlassView>
              </Animated.View>
            ) : showLyrics ? (
              <Animated.View entering={FadeInUp} style={styles.overlayWrapper}>
                <GlassView style={styles.overlayContainer} intensity={40}>
                  <Text style={styles.overlayTitle}>Lyrics</Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {lyrics.map((lyric, idx) => {
                      const isActive = idx === currentLyricIndex;
                      return (
                        <Text 
                          key={idx} 
                          style={[
                            styles.lyricLine, 
                            isActive && { color: Theme.colors.primary, fontSize: 24, fontWeight: '900', opacity: 1 }
                          ]}
                        >
                          {lyric.text}
                        </Text>
                      );
                    })}
                    <View style={{height: 100}} />
                  </ScrollView>
                </GlassView>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown} style={styles.artworkCenter}>
                <Animated.View style={[styles.artworkWrapper, animatedArtworkStyle]}>
                  <View style={[styles.artworkShadow, { shadowColor: colors.primary || Theme.colors.primary }]} />
                  <PlayerArtwork artwork={currentSong.artwork} size={artworkSize} />
                </Animated.View>

                <View style={styles.visualizerContainer}>
                  {barHeights.map((h, i) => (
                    <Animated.View 
                      key={i} 
                      style={[
                        styles.visualizerBar, 
                        { 
                          height: h, 
                          backgroundColor: colors.primary || Theme.colors.primary, 
                          opacity: 0.3 + (i / barHeights.length) * 0.7 
                        }
                      ]} 
                    />
                  ))}
                </View>
              </Animated.View>
            )}
          </View>

          <GlassView style={styles.controlsGlass} intensity={25}>
            <View style={styles.songMeta}>
              <View style={{flex: 1}}>
                <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(currentSong.id)} style={styles.heartBtn}>
                <Heart 
                  color={isFavorite(currentSong.id) ? Theme.colors.heart : 'rgba(255,255,255,0.4)'} 
                  size={30} 
                  fill={isFavorite(currentSong.id) ? Theme.colors.heart : 'transparent'} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <WaveformProgress position={position} duration={duration} onSeek={seekTo} activeColor={colors.primary || Theme.colors.primary} />
              <View style={styles.timeLabels}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.playbackControls}>
              {/* Shuffle */}
              <TouchableOpacity onPress={toggleShuffle} style={styles.sideControlBtn}>
                <Shuffle color={isShuffle ? colors.primary || Theme.colors.primary : 'rgba(255,255,255,0.45)'} size={22} />
                {isShuffle && <View style={[styles.activeDot, { backgroundColor: colors.primary || Theme.colors.primary }]} />}
              </TouchableOpacity>

              {/* Previous */}
              <TouchableOpacity onPress={prevSong} style={styles.skipBtn}>
                <SkipBack color="#FFF" size={34} fill="#FFF" />
              </TouchableOpacity>

              {/* Play / Pause — the big center button */}
              <TouchableOpacity
                onPress={togglePlayPause}
                style={[styles.playBtn, { backgroundColor: colors.primary || Theme.colors.primary }]}
                activeOpacity={0.8}
              >
                <View style={styles.playBtnInner}>
                  {isPlaying
                    ? <Pause color="#000" size={38} fill="#000" />
                    : <Play color="#000" size={38} fill="#000" style={{ marginLeft: 5 }} />}
                </View>
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity onPress={nextSong} style={styles.skipBtn}>
                <SkipForward color="#FFF" size={34} fill="#FFF" />
              </TouchableOpacity>

              {/* Repeat */}
              <TouchableOpacity onPress={toggleLoop} style={styles.sideControlBtn}>
                <Repeat color={isLooping ? colors.primary || Theme.colors.primary : 'rgba(255,255,255,0.45)'} size={22} />
                {isLooping && <View style={[styles.activeDot, { backgroundColor: colors.primary || Theme.colors.primary }]} />}
              </TouchableOpacity>
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity onPress={() => setShowLyrics(!showLyrics)} style={styles.footerBtn}>
                <Languages color={showLyrics ? Theme.colors.primary : 'rgba(255,255,255,0.6)'} size={22} />
                <Text style={[styles.footerBtnText, showLyrics && {color: Theme.colors.primary}]}>Lyrics</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPlaylist(!showPlaylist)} style={styles.footerBtn}>
                <ListMusic color={showPlaylist ? Theme.colors.primary : 'rgba(255,255,255,0.6)'} size={22} />
                <Text style={[styles.footerBtnText, showPlaylist && {color: Theme.colors.primary}]}>Queue</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEQ(true)} style={styles.footerBtn}>
                <Settings2 color="rgba(255,255,255,0.6)" size={22} />
                <Text style={styles.footerBtnText}>EQ</Text>
              </TouchableOpacity>
            </View>
          </GlassView>
        </View>

        <Modal visible={showEQ} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <GlassView style={styles.eqModal} intensity={60}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Equalizer</Text>
                <TouchableOpacity onPress={() => setShowEQ(false)}>
                  <Text style={{color: Theme.colors.primary, fontWeight: 'bold'}}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.eqContent}>
                <Text style={styles.eqComingSoon}>Vibrant EQ Coming in V3 Update!</Text>
                <View style={styles.eqMock}>
                  {[0.7, 0.4, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
                    <View key={i} style={[styles.eqBar, {height: 100 * h, backgroundColor: Theme.colors.primary}]} />
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
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: Theme.spacing.lg },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: Theme.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Theme.spacing.md },
  iconBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerSub: { color: Theme.colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: Theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  mainLayout: { flex: 1, justifyContent: 'center' },
  artworkCenter: { alignItems: 'center' },
  artworkWrapper: { position: 'relative' },
  artworkShadow: { 
    ...StyleSheet.absoluteFillObject, 
    borderRadius: 999, 
    opacity: 0.4, 
    shadowOffset: { width: 0, height: 20 }, 
    shadowOpacity: 1, 
    shadowRadius: 40, 
    elevation: 25 
  },
  artworkContainer: { borderRadius: 999, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  visualizerContainer: { flexDirection: 'row', height: 40, alignItems: 'flex-end', gap: 4, marginTop: 40 },
  visualizerBar: { width: 5, borderRadius: 2.5, minHeight: 4 },
  controlsGlass: { padding: Theme.spacing.lg, borderRadius: Theme.radius.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  songMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.lg },
  title: { color: Theme.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  artist: { color: Theme.colors.textSecondary, fontSize: 18, fontWeight: '500', marginTop: 4 },
  heartBtn: { marginLeft: Theme.spacing.md },
  progressContainer: { marginBottom: Theme.spacing.xl },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Theme.spacing.sm },
  timeText: { color: Theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  playbackControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.xl, paddingHorizontal: 4 },
  sideControlBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  activeDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3, alignSelf: 'center' },
  skipBtn: { width: 54, height: 54, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  playBtnInner: { justifyContent: 'center', alignItems: 'center' },
  footerActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.lg },
  footerBtn: { alignItems: 'center', flex: 1 },
  footerBtnText: { color: Theme.colors.textSecondary, fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  overlayWrapper: { ...StyleSheet.absoluteFillObject, padding: Theme.spacing.md },
  overlayContainer: { flex: 1, borderRadius: Theme.radius.lg, padding: Theme.spacing.lg, overflow: 'hidden' },
  overlayTitle: { color: Theme.colors.text, fontSize: 24, fontWeight: '900', marginBottom: Theme.spacing.lg },
  playlistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md },
  playlistText: { marginLeft: Theme.spacing.md, flex: 1 },
  playlistTitle: { color: Theme.colors.text, fontSize: 16, fontWeight: '700' },
  playlistArtist: { color: Theme.colors.textSecondary, fontSize: 13 },
  lyricLine: { color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  eqModal: { height: height * 0.45, borderTopLeftRadius: Theme.radius.xl, borderTopRightRadius: Theme.radius.xl, padding: Theme.spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { color: Theme.colors.text, fontSize: 20, fontWeight: '800' },
  eqContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eqComingSoon: { color: Theme.colors.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: Theme.spacing.xl },
  eqMock: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  eqBar: { width: 24, borderRadius: 12 },
});
