import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  useSharedValue, 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface PremiumBackgroundProps {
  colors?: {
    background: string;
    primary: string;
    secondary: string;
    detail: string;
  };
}

const DEFAULT_COLORS = {
  background: '#0a0a0c',
  primary: '#1DB954',
  secondary: '#1f1f28',
  detail: '#rgba(255,255,255,0.5)',
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const FloatingBlob = ({ color, size, initialX = 0, initialY = 0 }: { 
  color: string; 
  size: number; 
  initialX?: number;
  initialY?: number;
}) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(initialX + (Math.random() * 100 - 50), { duration: 8000 + Math.random() * 4000 }),
      -1,
      true
    );
    translateY.value = withRepeat(
      withTiming(initialY + (Math.random() * 100 - 50), { duration: 9000 + Math.random() * 4000 }),
      -1,
      true
    );
    scale.value = withRepeat(
      withTiming(1.3, { duration: 7000 + Math.random() * 4000 }),
      -1,
      true
    );
  }, [initialX, initialY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    backgroundColor: color,
  }));

  return (
    <Animated.View 
      style={[
        styles.blob, 
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle
      ]} 
    />
  );
};

export const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ colors = DEFAULT_COLORS }) => {
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 1500 });
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedContainerStyle]}>
      {/* Base Dark Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />

      {/* Primary Gradient based on Artwork */}
      <AnimatedLinearGradient
        colors={[colors.background, '#000000']}
        locations={[0, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Dynamic Blobs */}
      <View style={StyleSheet.absoluteFill}>
        <FloatingBlob 
          color={colors.primary} 
          size={width * 1.2} 
          initialX={-width * 0.3} 
          initialY={-height * 0.1} 
        />
        <FloatingBlob 
          color={colors.secondary} 
          size={width * 1.0} 
          initialX={width * 0.3} 
          initialY={height * 0.3} 
        />
        <FloatingBlob 
          color={colors.primary} 
          size={width * 0.8} 
          initialX={-width * 0.1} 
          initialY={height * 0.6} 
        />
      </View>

      {/* Heavy Blur for the "Mesh" effect */}
      <BlurView intensity={100} style={StyleSheet.absoluteFill} tint="dark" />
      
      {/* Semi-transparent overlay to ensure content is readable */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    opacity: 0.15,
  },
});
