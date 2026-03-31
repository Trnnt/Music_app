import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH_PERCENT = 0.95; // Slightly narrower than screen for premium look
const TAB_BAR_WIDTH = width * TAB_BAR_WIDTH_PERCENT;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [state.index]);

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 4 }]}>
      <View style={styles.container}>
        {/* Active Indicator Line */}
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

          // Mapping icons to your symbols
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
                size={24} 
                color={isFocused ? '#00B4D8' : 'rgba(255,255,255,0.4)'} 
              />
              <Text style={[
                styles.label, 
                { color: isFocused ? '#00B4D8' : 'rgba(255,255,255,0.4)' }
              ]}>
                {label as string}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: (TAB_WIDTH - 40) / 2,
    width: 40,
    height: 3,
    backgroundColor: '#00B4D8',
    borderRadius: 2,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
