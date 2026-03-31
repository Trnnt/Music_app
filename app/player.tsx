import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, TouchableOpacity, PanResponder, TextInput, Animated as RNAnimated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withTiming, withRepeat, Easing, useSharedValue } from 'react-native-reanimated';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, ChevronDown, ListMusic, Search, Heart, Music } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Image } from 'expo-image';

import { usePlayer } from '@/context/PlayerContext';
import { useImageColors } from '@/hooks/useImageColors';
import { useFavorites } from '@/hooks/useFavorites';
import SongArtwork from '@/components/SongArtwork';
import { Song } from '@/constants/data';

const { width, height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Check if artwork is a local song (no real artwork)
function isLocalArtwork(artwork: string): boolean {
  if (!artwork) return true;
  if (artwork === '') return true;
  if (artwork.includes('unsplash.com')) return true;
  if (artwork.startsWith('http')) return false;
  return false;
}

const CUSTOM_COVER = require('@/assets/images/rimuru.jpg');

// Player artwork: large version with gradient for local songs
const PlayerArtwork = memo(({ artwork, songTitle, size }: { artwork: string; songTitle: string; size: number }) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sleep Timer
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepTimerId, setSleepTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  // Audio visualizer bar heights
  const barHeights = useRef(Array.from({length: 20}, () => new RNAnimated.Value(4))).current;
  
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        barHeights.forEach(bar => {
          RNAnimated.timing(bar, {
            toValue: Math.random() * 30 + 4,
            duration: 150,
            useNativeDriver: false,
          }).start();
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      barHeights.forEach(bar => {
        RNAnimated.timing(bar, { toValue: 4, duration: 300, useNativeDriver: false }).start();
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
    RNAnimated.timing(panY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      panY.setValue(0);
      closePlayer();
      router.back();
    });
  }, [closePlayer, router]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 800 }),
  }));

  // Rotation Animation
  const rotation = useSharedValue(0);
  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 25000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      const currentRotation = rotation.value;
      rotation.value = currentRotation; 
    }
  }, [isPlaying]);

  const animatedArtworkStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Gesture system
  const panY = useRef(new RNAnimated.Value(0)).current;
  const artworkX = useRef(new RNAnimated.Value(0)).current;
  const directionLocked = useRef<'none' | 'horizontal' | 'vertical'>('none');
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 12 || Math.abs(gs.dy) > 12;
      },
      onPanResponderGrant: () => {
        directionLocked.current = 'none';
      },
      onPanResponderMove: (_, gs) => {
        if (directionLocked.current === 'none') {
          if (Math.abs(gs.dx) > Math.abs(gs.dy)) {
            directionLocked.current = 'horizontal';
          } else {
            directionLocked.current = 'vertical';
          }
        }
        
        if (directionLocked.current === 'vertical' && gs.dy > 0) {
          panY.setValue(gs.dy);
        } else if (directionLocked.current === 'horizontal') {
          artworkX.setValue(gs.dx * 0.5);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (directionLocked.current === 'vertical' && gs.dy > 120) {
          handleClose();
          return;
        }
        
        if (directionLocked.current === 'horizontal') {
          if (gs.dx < -80 && gs.vx < -0.3) {
            RNAnimated.timing(artworkX, {
              toValue: -width, duration: 200, useNativeDriver: true,
            }).start(() => {
              nextSong();
              artworkX.setValue(width);
              RNAnimated.spring(artworkX, {
                toValue: 0, useNativeDriver: true, tension: 50, friction: 9,
              }).start();
            });
            return;
          }
          if (gs.dx > 80 && gs.vx > 0.3) {
            RNAnimated.timing(artworkX, {
              toValue: width, duration: 200, useNativeDriver: true,
            }).start(() => {
              prevSong();
              artworkX.setValue(-width);
              RNAnimated.spring(artworkX, {
                toValue: 0, useNativeDriver: true, tension: 50, friction: 9,
              }).start();
            });
            return;
          }
        }

        RNAnimated.parallel([
          RNAnimated.spring(panY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
          RNAnimated.spring(artworkX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        ]).start();
        directionLocked.current = 'none';
      }
    })
  ).current;

  const screenOpacity = panY.interpolate({
    inputRange: [0, height * 0.4],
    outputRange: [1, 0.4],
    extrapolate: 'clamp',
  });
  const screenScale = panY.interpolate({
    inputRange: [0, height * 0.5],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const formatTime = (ms: number) => {
    if (ms <= 0) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: any) => {
    if (duration <= 0) return;
    const { pageX } = event.nativeEvent;
    const barWidth = width - 48;
    const touchX = pageX - 24;
    const ratio = Math.max(0, Math.min(1, touchX / barWidth));
    seekTo(ratio * duration);
  };

  const filteredPlaylist = playlist.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const artworkSize = width - 48;

  return (
    <RNAnimated.View 
      style={[styles.container, { 
        transform: [{ translateY: panY }, { scale: screenScale }],
        opacity: screenOpacity,
      }]} 
      {...panResponder.panHandlers}
    >
      <AnimatedLinearGradient
        colors={[
          colors.background, 
          colors.secondary, 
          '#000000'
        ]}
        locations={[0, 0.4, 0.9]}
        style={[StyleSheet.absoluteFill, animatedGradientStyle]}
      />

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.iconBtn} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronDown color="#FFFFFF" size={32} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.headerText}>
              {isBuffering ? 'Loading...' : 'Now Playing'}
            </Text>
            {sleepMinutes > 0 && (
              <Text style={styles.sleepIndicator}>Sleep in {sleepMinutes}m</Text>
            )}
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={() => setShowSleepMenu(!showSleepMenu)} style={[styles.iconBtn, {marginRight: 8}]} activeOpacity={0.6}>
              <Text style={{fontSize: 18}}>{sleepMinutes > 0 ? '⏰' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPlaylist(!showPlaylist)} style={styles.iconBtn} activeOpacity={0.6}>
              <ListMusic color={showPlaylist ? colors.primary : "#FFFFFF"} size={28} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep Timer Menu */}
        {showSleepMenu && (
          <View style={styles.sleepMenu}>
            {[5, 10, 15, 30, 45, 60, 0].map(mins => (
              <TouchableOpacity key={mins} style={styles.sleepOption} onPress={() => setSleepTimer(mins)} activeOpacity={0.6}>
                <Text style={[styles.sleepOptionText, sleepMinutes === mins && {color: '#1DB954'}]}>
                  {mins === 0 ? 'Off' : `${mins} min`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showPlaylist ? (
          /* PLAYLIST DRAWER VIEW */
          <View style={{flex: 1, marginTop: 20}}>
            <Text style={{color:'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16}}>Playlist</Text>
            
            <View style={styles.searchBar}>
              <Search color="gray" size={20} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search playlist..."
                placeholderTextColor="gray"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredPlaylist}
              keyExtractor={(s) => s.id}
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={true}
              renderItem={({item}) => {
                const isPlayingThis = currentSong.id === item.id;
                const originalIndex = playlist.findIndex(s => s.id === item.id);
                return (
                  <TouchableOpacity 
                    style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}
                    onPress={() => { setPlaylistAndPlay(playlist, originalIndex); setShowPlaylist(false); }}
                    activeOpacity={0.6}
                  >
                    <SongArtwork artwork={item.artwork} size={50} borderRadius={25} songTitle={item.title} />
                    <View style={{marginLeft: 16, flex: 1}}>
                       <Text style={{color: isPlayingThis ? colors.primary : 'white', fontWeight: 'bold'}}>{item.title}</Text>
                       <Text style={{color: 'gray'}}>{item.artist}</Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        ) : (
          /* MAIN PLAYER VIEW */
          <>
            <RNAnimated.View 
              style={[styles.artworkContainer, { 
                width: artworkSize, height: artworkSize, borderRadius: artworkSize / 2,
                transform: [{ translateX: artworkX }],
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 30,
                elevation: 20,
              }]} 
            >
              <Animated.View style={[{width: '100%', height: '100%'}, animatedArtworkStyle]}>
                <PlayerArtwork artwork={currentSong.artwork} songTitle={currentSong.title} size={artworkSize} />
              </Animated.View>
            </RNAnimated.View>

            {/* Audio Visualizer */}
            <View style={styles.visualizerContainer}>
              {barHeights.map((h, i) => (
                <RNAnimated.View key={i} style={[styles.visualizerBar, { 
                  height: h, 
                  backgroundColor: colors.primary,
                  opacity: 0.6 + (i / barHeights.length) * 0.4,
                }]} />
              ))}
            </View>

            {/* Buffering indicator */}
            {isBuffering && (
              <View style={styles.bufferingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.bufferingText}>Buffering...</Text>
              </View>
            )}

            <View style={{flex: 1, justifyContent: 'flex-end'}}>
              <View style={styles.songInfoContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Text style={[styles.title, {flex: 1}]} numberOfLines={1}>{currentSong.title}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(currentSong.id)} style={{padding: 8}} activeOpacity={0.6}>
                    <Heart 
                      color={isFavorite(currentSong.id) ? '#FF4B6E' : 'rgba(255,255,255,0.5)'} 
                      size={24} 
                      fill={isFavorite(currentSong.id) ? '#FF4B6E' : 'transparent'} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.artist, { color: colors.detail }]} numberOfLines={1}>
                  {currentSong.artist}
                </Text>
              </View>

              <Pressable style={styles.progressContainer} onPress={handleSeek}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]}>
                    <View style={[styles.progressKnob, { backgroundColor: colors.primary }]} />
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={[styles.timeText, { color: colors.detail }]}>{formatTime(position)}</Text>
                  <Text style={[styles.timeText, { color: colors.detail }]}>{formatTime(duration)}</Text>
                </View>
              </Pressable>

              <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.secondaryControlButton} onPress={toggleShuffle} activeOpacity={0.6}>
                  <Shuffle color={isShuffle ? colors.primary : "rgba(255,255,255,0.7)"} size={24} />
                </TouchableOpacity>

                <TouchableOpacity onPress={prevSong} style={styles.controlButton} activeOpacity={0.6}>
                  <SkipBack color={colors.primary} size={32} fill={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={togglePlayPause} style={[styles.playButton, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
                  {isPlaying ? (
                    <Pause color="#000000" size={32} fill="#000000" />
                  ) : (
                    <Play color="#000000" size={32} fill="#000000" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={nextSong} style={styles.controlButton} activeOpacity={0.6}>
                  <SkipForward color={colors.primary} size={32} fill={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryControlButton} onPress={toggleLoop} activeOpacity={0.6}>
                  <Repeat color={isLooping ? colors.primary : "rgba(255,255,255,0.7)"} size={24} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: {
    flex: 1, paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16,
  },
  iconBtn: { padding: 4 },
  headerText: {
    color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase',
  },
  sleepIndicator: {
    color: '#1DB954', fontSize: 11, fontWeight: '500', marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16
  },
  searchInput: {
    flex: 1, color: 'white', marginLeft: 12, fontSize: 16
  },
  artworkContainer: {
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20,
    alignSelf: 'center', marginVertical: 20, overflow: 'hidden'
  },
  songInfoContainer: { marginVertical: 10 },
  title: {
    color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 8,
  },
  artist: {
    color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '500',
  },
  progressContainer: { marginVertical: 20, paddingVertical: 10 },
  progressBarBackground: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, width: '100%', marginBottom: 10,
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2, justifyContent: 'center', alignItems: 'flex-end',
  },
  progressKnob: {
    width: 14, height: 14, borderRadius: 7, position: 'absolute', right: -7, top: -5,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  timeContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  timeText: {
    color: 'rgba(255,255,255,0.6)', fontSize: 12, fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20,
  },
  playButton: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  controlButton: { padding: 10 },
  secondaryControlButton: { padding: 10 },
  dragHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center', marginTop: 8, marginBottom: 4,
  },
  sleepMenu: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12,
    marginHorizontal: 24, marginBottom: 10,
  },
  sleepOption: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', margin: 4,
  },
  sleepOptionText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  visualizerContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    height: 36, marginBottom: 8, gap: 2,
  },
  visualizerBar: {
    width: 3, borderRadius: 2, minHeight: 4,
  },
  bufferingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6,
  },
  bufferingText: {
    color: 'rgba(255,255,255,0.6)', fontSize: 12, marginLeft: 8,
  },
});
