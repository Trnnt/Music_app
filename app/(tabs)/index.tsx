import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Search, Sliders, User, Heart } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { OptimizedSongItem } from '../../components/design-system/OptimizedSongItem';
import { useAudioLibrary } from '../../hooks/useAudioLibrary';
import { usePlayer } from '../../context/PlayerContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumBackground } from '../../components/PremiumBackground';
import { GlassView } from '../../components/ui/GlassView';
import { useRouter } from 'expo-router';

type CategoryType = 'Songs' | 'Artists' | 'Albums' | 'Online';

export default function LibraryScreen() {
  const { songs, artists, albums, isLoading, refreshLibrary } = useAudioLibrary();
  const { playSong, currentSong } = usePlayer();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const ListHeader = useMemo(() => (
    <View style={styles.headerSection}>
      <View style={styles.brandingRow}>
        <Text style={styles.brandingTitle}>Rimuru Music</Text>
        <View style={styles.brandingIcons}>
          <TouchableOpacity style={styles.brandingIconBtn}>
            <Sliders color="#FFF" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.brandingIconBtn}>
            <Search color="#FFF" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatarBtn}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>N</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={['Songs', 'Artists', 'Albums', 'Online']}
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
        <GlassView style={styles.searchBar} intensity={15}>
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
          {activeCategory === 'Songs' ? `${filteredSongs.length} songs` : 
           activeCategory === 'Artists' ? `${artists.length} artists` : 
           `${albums.length} albums`}
        </Text>
        <TouchableOpacity style={styles.shuffleBtn}>
          <Heart color={Theme.colors.primary} size={16} style={{marginRight: 6}} />
          <Text style={styles.shuffleText}>Shuffle All</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [activeCategory, filteredSongs.length, artists.length, albums.length, searchQuery]);

  return (
    <PremiumBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <FlatList
          data={filteredSongs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ 
            paddingBottom: Theme.dimensions.tabBarHeight + 100
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={refreshLibrary} 
              tintColor={Theme.colors.primary} 
            />
          }
        />
      </View>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingBottom: Theme.spacing.md,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  brandingTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandingIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandingIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarBtn: {
    marginLeft: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoryContainer: {
    marginBottom: Theme.spacing.md,
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeCategoryBtn: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.6)',
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
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFF',
    fontSize: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: 8,
  },
  statsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  shuffleText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
