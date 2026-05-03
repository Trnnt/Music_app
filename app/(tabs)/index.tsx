import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Search, Heart, Music, Mic, Disc, Globe, DownloadCloud } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { PremiumHeader } from '../../components/design-system/PremiumHeader';
import { OptimizedSongItem } from '../../components/design-system/OptimizedSongItem';
import { useAudioLibrary } from '../../hooks/useAudioLibrary';
import { usePlayer } from '../../context/PlayerContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumBackground } from '../../components/PremiumBackground';
import Skeleton from '../../components/Skeleton';
import { GlassView } from '../../components/ui/GlassView';

type CategoryType = 'Songs' | 'Artists' | 'Albums' | 'Online' | 'Downloads' | 'Favorites';

export default function LibraryScreen() {
  const { songs, artists, albums, isLoading, isRefreshing, refreshLibrary } = useAudioLibrary();
  const { playSong, currentSong } = usePlayer();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<CategoryType>('Songs');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    return songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [songs, searchQuery]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isPlaying = currentSong?.id === item.id;
    return (
      <OptimizedSongItem
        item={item}
        isPlayingThis={isPlaying}
        isLiked={false} 
        onPress={() => playSong(item, songs)}
        onToggleFavorite={() => {}}
      />
    );
  }, [currentSong, songs, playSong]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListHeader = useMemo(() => (
    <View style={styles.headerSection}>
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={['Songs', 'Artists', 'Albums', 'Online', 'Downloads', 'Favorites']}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => {
            const isActive = activeCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryBtn, isActive && styles.activeCategoryBtn]}
                onPress={() => setActiveCategory(item as CategoryType)}
              >
                <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: Theme.spacing.md }}
        />
      </View>

      <View style={styles.searchSection}>
        <GlassView style={styles.searchBar} intensity={20}>
          <Search color={Theme.colors.textSecondary} size={18} />
          <TextInput
            placeholder={`Search ${activeCategory.toLowerCase()}...`}
            placeholderTextColor={Theme.colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </GlassView>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.statsText}>
          {activeCategory === 'Songs' ? `${filteredSongs.length} SONGS` : 
           activeCategory === 'Artists' ? `${artists.length} ARTISTS` : 
           `${albums.length} ALBUMS`}
        </Text>
        <TouchableOpacity style={styles.shuffleBtn}>
          <View style={styles.shuffleIcon}>
            <Music color={Theme.colors.primary} size={16} />
          </View>
          <Text style={styles.shuffleText}>Shuffle All</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [activeCategory, filteredSongs.length, artists.length, albums.length, searchQuery]);

  if (isLoading && !isRefreshing) {
    return (
      <PremiumBackground>
        <PremiumHeader title="Rimuru" />
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <Skeleton width={56} height={56} borderRadius={Theme.radius.md} />
              <View style={styles.skeletonText}>
                <Skeleton width="70%" height={16} borderRadius={4} />
                <View style={{ height: 8 }} />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <PremiumHeader title="Rimuru" />
      
      <FlatList
        data={filteredSongs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ 
          paddingBottom: Theme.dimensions.tabBarHeight + Theme.dimensions.miniPlayerHeight + insets.bottom + 60 
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={12}
        updateCellsBatchingPeriod={50}
        getItemLayout={(_, index) => ({
          length: 72,
          offset: 72 * index + 200, // Header approx height
          index,
        })}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={refreshLibrary} 
            tintColor={Theme.colors.primary} 
          />
        }
      />
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingVertical: Theme.spacing.md,
  },
  categoryContainer: {
    marginBottom: Theme.spacing.md,
  },
  categoryBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.surface,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  activeCategoryBtn: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  activeCategoryText: {
    color: '#FFF',
  },
  searchSection: {
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  statsText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
  },
  shuffleIcon: {
    marginRight: 6,
  },
  shuffleText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  loadingContainer: {
    padding: Theme.spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  skeletonText: {
    marginLeft: Theme.spacing.md,
    flex: 1,
  },
});
