import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
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
import { Theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const CUSTOM_COVER = require('../assets/images/rimuru.jpg');

const PlayerArtwork = memo(({ artwork, size, isPlaying }: { artwork: string; size: number; isPlaying: boolean }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(rotation.value); 
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const isRemote = artwork && artwork.startsWith('http');
  
  return (
    <Animated.View style={[styles.artworkContainer, { width: size, height: size }, animatedStyle]}>
      <Image 
        source={isRemote ? { uri: artwork } : CUSTOM_COVER} 
        placeholder={CUSTOM_COVER}
        style={{ width: size, height: size, borderRadius: size / 2 }} 
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
      />
    </Animated.View>
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

  const panY = useSharedValue(0);
  const barHeights = useMemo(() => Array.from({length: 24}, () => Math.random() * 20 + 4), [currentSong?.id]);

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

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panY.value }],
  }));

  if (!currentSong) return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const artworkSize = width * 0.75;

  return (
    <GestureDetector gesture={verticalGesture}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <PremiumBackground colors={colors} />

        <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + Theme.spacing.md }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
              <ChevronDown color="#FFF" size={32} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerSub}>PLAYING FROM LIBRARY</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <MoreVertical color="#FFF" size={24} />
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
                    <Text style={styles.lyricLine}>Synced lyrics appearing soon in V2...</Text>
                    <View style={{height: 100}} />
                  </ScrollView>
                </GlassView>
              </Animated.View>
            ) : (
              <View style={styles.artworkCenter}>
                <PlayerArtwork artwork={currentSong.artwork} size={artworkSize} isPlaying={isPlaying} />
                
                <View style={styles.visualizerContainer}>
                  {barHeights.map((h, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.visualizerBar, 
                        { 
                          height: isPlaying ? h * (Math.random() * 0.5 + 0.8) : 4, 
                          backgroundColor: colors.primary || Theme.colors.primary, 
                        }
                      ]} 
                    />
                  ))}
                </View>

                {isBuffering && (
                  <View style={styles.bufferContainer}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={styles.bufferText}>Buffering...</Text>
                  </View>
                )}

                <View style={styles.songMeta}>
                  <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
                </View>
                
                <TouchableOpacity onPress={() => toggleFavorite(currentSong.id)} style={styles.heartBtnLarge}>
                  <Heart 
                    color={isFavorite(currentSong.id) ? Theme.colors.heart : 'rgba(255,255,255,0.4)'} 
                    size={28} 
                    fill={isFavorite(currentSong.id) ? Theme.colors.heart : 'transparent'} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <WaveformProgress position={position} duration={duration} onSeek={seekTo} activeColor={colors.primary || Theme.colors.primary} />
              <View style={styles.timeLabels}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.playbackControls}>
              <TouchableOpacity onPress={toggleShuffle} style={styles.sideControlBtn}>
                <Shuffle color={isShuffle ? Theme.colors.primary : 'rgba(255,255,255,0.5)'} size={20} />
              </TouchableOpacity>

              <TouchableOpacity onPress={prevSong} style={styles.skipBtn}>
                <SkipBack color="#FFF" size={32} fill="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={[styles.playBtn, { backgroundColor: colors.primary || Theme.colors.primary }]}
              >
                {isPlaying
                  ? <Pause color="#000" size={38} fill="#000" />
                  : <Play color="#000" size={38} fill="#000" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>

              <TouchableOpacity onPress={nextSong} style={styles.skipBtn}>
                <SkipForward color="#FFF" size={32} fill="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleLoop} style={styles.sideControlBtn}>
                <Repeat color={isLooping ? Theme.colors.primary : 'rgba(255,255,255,0.5)'} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity onPress={() => setShowLyrics(!showLyrics)} style={styles.footerBtn}>
                <Languages color="#FFF" size={22} />
                <Text style={styles.footerBtnText}>Lyrics</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPlaylist(!showPlaylist)} style={styles.footerBtn}>
                <ListMusic color="#FFF" size={22} />
                <Text style={styles.footerBtnText}>Queue</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEQ(true)} style={styles.footerBtn}>
                <Settings2 color="#FFF" size={22} />
                <Text style={styles.footerBtnText}>EQ</Text>
              </TouchableOpacity>
            </View>
          </View>
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
                <Text style={styles.eqComingSoon}>Vibrant EQ Coming Soon!</Text>
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
  content: { flex: 1, paddingHorizontal: Theme.spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  iconBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  mainLayout: { flex: 1, justifyContent: 'center' },
  artworkCenter: { alignItems: 'center' },
  artworkContainer: { 
    borderRadius: 999, 
    overflow: 'hidden', 
    borderWidth: 8, 
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  visualizerContainer: { flexDirection: 'row', height: 30, alignItems: 'center', gap: 4, marginTop: 40, marginBottom: 20 },
  visualizerBar: { width: 3, borderRadius: 2, backgroundColor: '#FFF' },
  bufferContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  bufferText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginLeft: 8 },
  songMeta: { alignItems: 'center', marginTop: 10 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  artist: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  heartBtnLarge: { marginTop: 20 },
  bottomControls: { marginTop: 'auto' },
  progressContainer: { marginBottom: 30 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
  playbackControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  sideControlBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  skipBtn: { width: 54, height: 54, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  footerActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerBtn: { alignItems: 'center' },
  footerBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', marginTop: 4 },
  overlayWrapper: { ...StyleSheet.absoluteFillObject, padding: Theme.spacing.md },
  overlayContainer: { flex: 1, borderRadius: Theme.radius.lg, padding: Theme.spacing.lg, overflow: 'hidden' },
  overlayTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: Theme.spacing.lg },
  playlistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md },
  playlistText: { marginLeft: Theme.spacing.md, flex: 1 },
  playlistTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  playlistArtist: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  lyricLine: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '700', marginTop: 40, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  eqModal: { height: height * 0.45, borderTopLeftRadius: Theme.radius.xl, borderTopRightRadius: Theme.radius.xl, padding: Theme.spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  eqContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eqComingSoon: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600' },
});
