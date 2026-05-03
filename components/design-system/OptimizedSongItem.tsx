import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import SongArtwork from '../../components/SongArtwork';
import { Song } from '../../constants/data';

interface OptimizedSongItemProps {
  item: Song;
  isPlayingThis: boolean;
  isLiked: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  style?: ViewStyle;
}

const OptimizedSongItemComponent: React.FC<OptimizedSongItemProps> = ({
  item,
  isPlayingThis,
  isLiked,
  onPress,
  onToggleFavorite,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <SongArtwork 
        artwork={item.artwork} 
        size={56} 
        borderRadius={Theme.radius.md} 
        songTitle={item.title} 
      />
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.title, isPlayingThis && styles.activeText]} 
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={onToggleFavorite} 
        style={styles.heartBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Heart 
          color={isLiked ? Theme.colors.heart : Theme.colors.textSecondary} 
          size={20} 
          fill={isLiked ? Theme.colors.heart : 'transparent'} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const OptimizedSongItem = memo(OptimizedSongItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  infoContainer: {
    flex: 1,
    marginLeft: Theme.spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeText: {
    color: Theme.colors.primary,
  },
  artist: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginTop: Theme.spacing.xs / 2,
  },
  heartBtn: {
    padding: Theme.spacing.sm,
  },
});
