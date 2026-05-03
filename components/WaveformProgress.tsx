import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TRACK_WIDTH = width - 64; // Matches content padding
const THUMB_SIZE = 18;
const TRACK_HEIGHT = 5;

interface WaveformProgressProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  activeColor: string;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function WaveformProgress({ position, duration, onSeek, activeColor }: WaveformProgressProps) {
  const isPressed = useSharedValue(false);
  const scrubX = useSharedValue(-1); // -1 = not scrubbing
  const thumbScale = useSharedValue(1);

  const progressPercent = duration > 0 ? Math.min(position / duration, 1) : 0;
  const progressX = progressPercent * TRACK_WIDTH;

  const handleSeek = useCallback((x: number) => {
    const clampedX = Math.max(0, Math.min(x, TRACK_WIDTH));
    const ratio = clampedX / TRACK_WIDTH;
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      isPressed.value = true;
      thumbScale.value = withSpring(1.4, { damping: 15, stiffness: 200 });
      scrubX.value = e.x;
      runOnJS(handleSeek)(e.x);
    })
    .onUpdate((e) => {
      scrubX.value = e.x;
      runOnJS(handleSeek)(e.x);
    })
    .onEnd(() => {
      isPressed.value = false;
      thumbScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      scrubX.value = withTiming(-1, { duration: 300 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      runOnJS(handleSeek)(e.x);
    });

  const composed = Gesture.Exclusive(gesture, tapGesture);

  // The thumb (draggable circle) animated style
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progressX - THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
    shadowOpacity: interpolate(thumbScale.value, [1, 1.4], [0.3, 0.7], Extrapolation.CLAMP),
  }));

  // Glow effect on the track when pressed
  const trackStyle = useAnimatedStyle(() => ({
    shadowOpacity: withTiming(isPressed.value ? 0.8 : 0.3, { duration: 200 }),
    shadowRadius: withTiming(isPressed.value ? 12 : 6, { duration: 200 }),
  }));

  // Scrub time bubble
  const scrubBubbleStyle = useAnimatedStyle(() => {
    const showBubble = scrubX.value >= 0;
    return {
      opacity: withTiming(showBubble ? 1 : 0, { duration: 150 }),
      transform: [
        {
          translateX: showBubble
            ? Math.max(24, Math.min(scrubX.value - 8, TRACK_WIDTH - 24))
            : 0,
        },
        { translateY: withTiming(showBubble ? 0 : 10, { duration: 150 }) },
      ],
    };
  });

  const scrubTime = useMemo(() => {
    if (scrubX.value < 0 || duration === 0) return formatTime(position);
    const ratio = Math.max(0, Math.min(scrubX.value / TRACK_WIDTH, 1));
    return formatTime(ratio * duration);
  }, [scrubX.value, duration, position]);

  return (
    <View style={styles.outerContainer}>
      {/* Scrub Time Bubble */}
      <Animated.View style={[styles.scrubBubble, scrubBubbleStyle, { backgroundColor: activeColor }]}>
        <Text style={styles.scrubText}>{scrubTime}</Text>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <View style={styles.touchArea}>
          {/* Track Background */}
          <View style={styles.trackBg}>
            {/* Active Progress Track */}
            <Animated.View
              style={[
                styles.trackActive,
                {
                  width: progressX,
                  backgroundColor: activeColor,
                  shadowColor: activeColor,
                },
                trackStyle,
              ]}
            />
          </View>

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: '#fff',
                shadowColor: activeColor,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingTop: 28,
    paddingBottom: 4,
  },
  touchArea: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + 16,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  trackBg: {
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'visible',
  },
  trackActive: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    // Glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  thumb: {
    position: 'absolute',
    top: (THUMB_SIZE + 16) / 2 - THUMB_SIZE / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  scrubBubble: {
    position: 'absolute',
    top: -4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    zIndex: 10,
  },
  scrubText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
});
