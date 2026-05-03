import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassView } from './ui/GlassView';
import { Theme } from '@/constants/Theme';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width * 0.92;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const numTabs = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / numTabs;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + Theme.spacing.sm }]}>
      <GlassView intensity={70} style={styles.container}>
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              width: tabWidth * 0.4,
              left: (tabWidth - (tabWidth * 0.4)) / 2,
              transform: [{ translateX }] 
            }
          ]} 
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.selectionAsync();
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
              android_ripple={{ color: 'rgba(29, 185, 84, 0.1)', borderless: true }}
            >
              <IconSymbol 
                name={getIcon(route.name) as any} 
                size={22} 
                color={isFocused ? Theme.colors.primary : Theme.colors.textSecondary} 
              />
              <Text style={[
                styles.label, 
                { color: isFocused ? Theme.colors.primary : Theme.colors.textSecondary }
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
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    height: Theme.dimensions.tabBarHeight,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 10, 12, 0.8)', // Darker background for legibility
  },
  indicator: {
    position: 'absolute',
    bottom: 10,
    height: 3,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.full,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
