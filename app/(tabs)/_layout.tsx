import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { CustomTabBar } from '@/components/CustomTabBar';
import MiniPlayer from '@/components/MiniPlayer';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{ title: 'Home' }}
        />
        <Tabs.Screen
          name="explore"
          options={{ title: 'Explore' }}
        />
        <Tabs.Screen
          name="library"
          options={{ title: 'Library' }}
        />
        <Tabs.Screen
          name="account"
          options={{ title: 'Account' }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}

