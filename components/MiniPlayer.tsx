import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipForward, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePlayer } from '@/context/PlayerContext';
import { useImageColors } from '@/hooks/useImageColors';
import SongArtwork from '@/components/SongArtwork';

function MiniPlayerComponent() {
  const { currentSong, isPlaying, togglePlayPause, nextSong, position, duration, stopAndClear } = usePlayer();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useImageColors(currentSong?.artwork);

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={[styles.container, { bottom: 50 + insets.bottom }]}
    >
      <TouchableOpacity 
        onPress={() => router.push('/player')} 
        style={styles.pressable}
        activeOpacity={0.85}
      >
        <View style={styles.blurContainer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Dynamic Tint Overlay */}
          <View style={[StyleSheet.absoluteFill, { 
            backgroundColor: colors.background, 
            opacity: 0.2 // Very subtle atmospheric tint
          }]} />
          
          <View style={styles.content}>
            <SongArtwork artwork={currentSong.artwork} size={48} borderRadius={8} songTitle={currentSong.title} />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={[styles.artist, { color: colors.primary }]} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>
            <View style={styles.controls}>
              <TouchableOpacity 
                onPress={togglePlayPause} 
                style={styles.controlBtn}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isPlaying ? (
                  <Pause color={colors.primary} size={24} fill={colors.primary} />
                ) : (
                  <Play color={colors.primary} size={24} fill={colors.primary} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={nextSong} 
                style={styles.controlBtn}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SkipForward color={colors.primary} size={24} fill={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={stopAndClear} 
                style={styles.controlBtn}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.miniProgress, { 
            width: `${progressPercent}%`, 
            backgroundColor: colors.primary 
          }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const MiniPlayer = memo(MiniPlayerComponent);
export default MiniPlayer;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pressable: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(50, 50, 50, 0.4)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
});
