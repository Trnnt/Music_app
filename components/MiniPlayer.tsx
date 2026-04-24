import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipForward, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePlayer } from '@/context/PlayerContext';
import { useImageColors } from '@/hooks/useImageColors';
import SongArtwork from '@/components/SongArtwork';
import { GlassView } from './ui/GlassView';

function MiniPlayerComponent() {
  const { currentSong, isPlaying, togglePlayPause, nextSong, prevSong, position, duration, stopAndClear } = usePlayer();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useImageColors(currentSong?.artwork, currentSong?.id);

  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX > 50 || e.velocityX > 300) {
        runOnJS(nextSong)();
      } else if (e.translationX < -50 || e.velocityX < -300) {
        runOnJS(prevSong)();
      }
    });

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={FadeInDown.springify().damping(20).stiffness(150)}
        exiting={FadeOutDown}
        style={[styles.container, { bottom: 84 + insets.bottom }]}
      >
        <TouchableOpacity 
          onPress={() => router.push('/player')} 
          style={styles.pressable}
          activeOpacity={0.9}
        >
          <GlassView intensity={60} style={styles.glass}>
            {/* Dynamic Tint Overlay */}
            <View style={[StyleSheet.absoluteFill, { 
              backgroundColor: colors.background, 
              opacity: 0.3
            }]} />
            
            <View style={styles.content}>
              <SongArtwork artwork={currentSong.artwork} size={44} borderRadius={8} songTitle={currentSong.title} />
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
                >
                  <SkipForward color="#FFF" size={24} fill="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={stopAndClear} 
                  style={[styles.controlBtn, {marginLeft: 4}]}
                >
                  <X color="rgba(255,255,255,0.4)" size={20} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { 
                width: `${progressPercent}%`, 
                backgroundColor: colors.primary 
              }]} />
            </View>
          </GlassView>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const MiniPlayer = memo(MiniPlayerComponent);
export default MiniPlayer;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 64,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  pressable: {
    flex: 1,
  },
  glass: {
    flex: 1,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
  },
});

