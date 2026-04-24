import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

export const GlassView: React.FC<GlassViewProps> = ({ 
  children, 
  style, 
  intensity = 40, 
  tint = 'dark',
  borderRadius = 20,
  ...props 
}) => {
  return (
    <View style={[styles.container, { borderRadius }, style]} {...props}>
      <BlurView intensity={intensity} tint={tint} style={[StyleSheet.absoluteFill, { borderRadius }]} />
      <View style={[styles.border, { borderRadius }]} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },
});
