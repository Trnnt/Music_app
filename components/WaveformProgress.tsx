import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const WAVE_WIDTH = width - 48;
const BAR_COUNT = 60;
const BAR_GAP = 2;
const BAR_WIDTH = (WAVE_WIDTH - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;

interface WaveformProgressProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  activeColor: string;
}

export default function WaveformProgress({ position, duration, onSeek, activeColor }: WaveformProgressProps) {
  const isPressed = useSharedValue(false);
  const touchX = useSharedValue(0);

  const barHeights = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const factor = Math.sin((i / BAR_COUNT) * Math.PI);
      return 10 + 25 * factor + Math.random() * 15;
    });
  }, []);

  const progressPercent = duration > 0 ? position / duration : 0;
  const activeBars = Math.floor(progressPercent * BAR_COUNT);

  const gesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      isPressed.value = true;
      touchX.value = e.allTouches[0].x;
      const ratio = Math.max(0, Math.min(1, touchX.value / WAVE_WIDTH));
      runOnJS(onSeek)(ratio * duration);
    })
    .onUpdate((e) => {
      touchX.value = e.x;
      const ratio = Math.max(0, Math.min(1, touchX.value / WAVE_WIDTH));
      runOnJS(onSeek)(ratio * duration);
    })
    .onEnd(() => {
      isPressed.value = false;
    })
    .onTouchesMove((_, state) => {
      state.activate();
    });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    touchX.value = e.x;
    const ratio = Math.max(0, Math.min(1, touchX.value / WAVE_WIDTH));
    runOnJS(onSeek)(ratio * duration);
  });

  const composed = Gesture.Exclusive(gesture, tapGesture);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isPressed.value ? 1.02 : 1) }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <View style={styles.waveformRow}>
          {barHeights.map((h, i) => {
            const isActive = i <= activeBars;
            return (
              <View 
                key={i} 
                style={[
                  styles.bar, 
                  { 
                    height: h, 
                    width: BAR_WIDTH,
                    backgroundColor: isActive ? activeColor : 'rgba(255,255,255,0.15)',
                    opacity: isActive ? 1 : 0.4
                  }
                ]} 
              />
            );
          })}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_GAP,
  },
  bar: {
    borderRadius: 2,
  }
});
