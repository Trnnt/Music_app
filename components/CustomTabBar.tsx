import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassView } from './ui/GlassView';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH_PERCENT = 0.9;
const TAB_BAR_WIDTH = width * TAB_BAR_WIDTH_PERCENT;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [state.index]);

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 10 }]}>
      <GlassView intensity={60} style={styles.container}>
        <Animated.View 
          style={[
            styles.indicator, 
            { transform: [{ translateX }] }
          ]} 
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const label = 
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const getIcon = (name: string) => {
            switch (name) {
              case 'index': return 'house.fill';
              case 'explore': return 'safari.fill';
              case 'library': return 'music.note.list';
              case 'account': return 'person.fill';
              default: return 'house.fill';
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <IconSymbol 
                name={getIcon(route.name) as any} 
                size={22} 
                color={isFocused ? '#1DB954' : 'rgba(255,255,255,0.3)'} 
              />
              <Text style={[
                styles.label, 
                { color: isFocused ? '#1DB954' : 'rgba(255,255,255,0.3)' }
              ]}>
                {label as string}
              </Text>
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: (width - TAB_BAR_WIDTH) / 2,
    width: TAB_BAR_WIDTH,
    zIndex: 100,
  },
  container: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    left: (TAB_WIDTH - 20) / 2,
    width: 20,
    height: 3,
    backgroundColor: '#1DB954',
    borderRadius: 2,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

