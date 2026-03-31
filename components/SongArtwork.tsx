import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Music } from 'lucide-react-native';

const DEFAULT_ARTWORK = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17';

interface SongArtworkProps {
  artwork: string;
  size?: number;
  borderRadius?: number;
  songTitle?: string; // Used to generate a unique gradient color
}

// Generate a unique gradient based on song title hash
function getGradientColors(title: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return [
    `hsl(${hue}, 60%, 35%)`,
    `hsl(${(hue + 40) % 360}, 70%, 20%)`,
  ];
}

function isLocalArtwork(artwork: string): boolean {
  if (!artwork) return true;
  if (artwork === '') return true;
  if (artwork.includes('unsplash.com')) return true;
  // If it starts with http, it is definitely NOT local placeholder artwork
  if (artwork.startsWith('http')) return false;
  return false;
}

const CUSTOM_COVER = require('@/assets/images/rimuru.jpg');

function SongArtworkComponent({ artwork, size = 56, borderRadius = 12, songTitle = 'Song' }: SongArtworkProps) {
  const isRemote = artwork && artwork.startsWith('http');
  
  if (!isRemote && (isLocalArtwork(artwork) || !artwork)) {
    // Show Rimuru logo for local files with no art
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        <Image
          source={CUSTOM_COVER}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
      <Image
        source={{ uri: artwork }}
        placeholder={CUSTOM_COVER}
        placeholderContentFit="cover"
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const SongArtwork = memo(SongArtworkComponent);
export default SongArtwork;
