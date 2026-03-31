import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Download, Heart, X, Music, ChevronRight, Disc3, Users, Clock, Check, Sliders } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable } from 'react-native';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useAudioLibrary, ArtistData, AlbumData } from '@/hooks/useAudioLibrary';
import { useOnlineDownloader } from '@/hooks/useOnlineDownloader';
import { useFavorites } from '@/hooks/useFavorites';
import Skeleton from '@/components/Skeleton';
import SongArtwork from '@/components/SongArtwork';
import { Song } from '@/constants/data';

type SortOrder = 'TITLE' | 'DATE_ADDED';
type TabName = 'Songs' | 'Artists' | 'Albums' | 'Online' | 'Downloads' | 'Favorites';

// ===== MEMOIZED SONG ITEM =====
const SongItem = memo(({ 
  item, 
  isPlayingThis, 
  isLiked, 
  onPress, 
  onToggleFavorite,
}: { 
  item: Song; 
  isPlayingThis: boolean; 
  isLiked: boolean; 
  onPress: () => void; 
  onToggleFavorite: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={styles.songItem}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <SongArtwork artwork={item.artwork} size={56} borderRadius={12} songTitle={item.title} />
      <View style={styles.songInfo}>
        <Text style={[styles.title, isPlayingThis && styles.activeText]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity onPress={onToggleFavorite} style={styles.heartBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Heart 
          color={isLiked ? '#FF4B6E' : 'rgba(255,255,255,0.25)'} 
          size={20} 
          fill={isLiked ? '#FF4B6E' : 'transparent'} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ===== ARTIST ITEM =====
const ArtistItem = memo(({ 
  item, 
  onPress,
}: { 
  item: ArtistData; 
  onPress: () => void;
}) => {
  // Generate gradient from artist name
  let hash = 0;
  for (let i = 0; i < item.name.length; i++) {
    hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <TouchableOpacity style={styles.songItem} onPress={onPress} activeOpacity={0.6}>
      <LinearGradient
        colors={[`hsl(${hue}, 55%, 40%)`, `hsl(${(hue + 30) % 360}, 45%, 25%)`]}
        style={styles.artistAvatar}
      >
        <Users color="rgba(255,255,255,0.9)" size={22} />
      </LinearGradient>
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.songCount} {item.songCount === 1 ? 'song' : 'songs'}</Text>
      </View>
      <ChevronRight color="rgba(255,255,255,0.3)" size={20} />
    </TouchableOpacity>
  );
});

// ===== ALBUM ITEM =====
const AlbumItem = memo(({ 
  item, 
  onPress,
}: { 
  item: AlbumData; 
  onPress: () => void;
}) => {
  let hash = 0;
  for (let i = 0; i < item.name.length; i++) {
    hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <TouchableOpacity style={styles.songItem} onPress={onPress} activeOpacity={0.6}>
      <LinearGradient
        colors={[`hsl(${hue}, 50%, 35%)`, `hsl(${(hue + 45) % 360}, 55%, 22%)`]}
        style={styles.albumCover}
      >
        <Disc3 color="rgba(255,255,255,0.9)" size={24} />
      </LinearGradient>
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.songs.length} {item.songs.length === 1 ? 'song' : 'songs'}</Text>
      </View>
      <ChevronRight color="rgba(255,255,255,0.3)" size={20} />
    </TouchableOpacity>
  );
});

// ===== ONLINE RESULT ITEM =====
const OnlineItem = memo(({
  item,
  isDownloaded,
  downloading,
  progress,
  onPress,
  onDownload,
}: {
  item: Song;
  isDownloaded: boolean;
  downloading: boolean;
  progress: number;
  onPress: () => void;
  onDownload: () => void;
}) => (
  <TouchableOpacity 
    style={styles.songItem} 
    onPress={onPress}
    activeOpacity={0.6}
  >
    <SongArtwork artwork={item.artwork} size={56} borderRadius={12} songTitle={item.title} />
    <View style={styles.songInfo}>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      {downloading && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
    <TouchableOpacity 
      style={[styles.downloadBtn, isDownloaded && styles.downloadedBtn]} 
      onPress={onDownload}
      disabled={isDownloaded || downloading}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {downloading ? (
        <ActivityIndicator size="small" color="#1DB954" />
      ) : isDownloaded ? (
        <Text style={{ color: '#1DB954', fontWeight: 'bold', fontSize: 16 }}>✓</Text>
      ) : (
        <Download color="#FFF" size={20} />
      )}
    </TouchableOpacity>
  </TouchableOpacity>
));

// ===== ITEM HEIGHT for getItemLayout =====
const ITEM_HEIGHT = 76; // songItem paddingVertical(10)*2 + artwork(56) = 76

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { currentSong, setPlaylistAndPlay, openPlayer } = usePlayer();
  const router = useRouter();
  
  const { 
    songs, artists: libraryArtists, albums: libraryAlbums, 
    isLoading, isRefreshing, sortBy, setSortBy, refreshLibrary 
  } = useAudioLibrary();
  const { searchResults, isSearching: isOnlineSearching, downloadedSongs, isDownloading, downloadProgress, search, downloadTrack } = useOnlineDownloader();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabName>('Songs');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineQuery, setOnlineQuery] = useState('');
  
  // Expanded artist/album views
  const [expandedArtist, setExpandedArtist] = useState<ArtistData | null>(null);
  const [expandedAlbum, setExpandedAlbum] = useState<AlbumData | null>(null);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Debounced live search for Online tab
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (onlineQuery) {
        search(onlineQuery);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [onlineQuery]);

  const allSongs = useMemo(() => [...songs, ...downloadedSongs.filter(ds => !songs.find(s => s.id === ds.id))], [songs, downloadedSongs]);

  const processedSongs = useMemo(() => {
    let list = [...allSongs];
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.artist.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allSongs, searchQuery]);

  const favoriteSongs = useMemo(() => {
    return allSongs.filter(s => isFavorite(s.id));
  }, [allSongs, favorites]);

  // Song press handler — plays immediately, no setTimeout
  const handleSongPress = useCallback((song: Song, index: number, list?: Song[]) => {
    const playlist = list || processedSongs;
    setPlaylistAndPlay(playlist, index);
    openPlayer();
    router.navigate('/player');
  }, [processedSongs, setPlaylistAndPlay, openPlayer, router]);

  // FlatList optimization
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Song) => item.id, []);

  const renderSkeleton = useCallback(() => (
    <View style={styles.songItem}>
      <Skeleton width={56} height={56} borderRadius={12} />
      <View style={styles.songInfo}>
        <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
    </View>
  ), []);

  const renderContent = () => {
    if (isLoading && activeTab === 'Songs') {
      return (
        <FlatList
          data={[1,2,3,4,5,6,7,8]}
          keyExtractor={(item) => item.toString()}
          renderItem={renderSkeleton}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
        />
      );
    }

    // ===== ONLINE TAB =====
    if (activeTab === 'Online') {
      return (
        <View style={{ flex: 1 }}>
          <View style={styles.onlineSearchContainer}>
            <Search color="#888" size={18} />
            <TextInput 
              style={styles.onlineSearchInput}
              placeholder="Search full songs..."
              placeholderTextColor="#666"
              value={onlineQuery}
              onChangeText={setOnlineQuery}
            />
            {onlineQuery.length > 0 && (
              <TouchableOpacity onPress={() => setOnlineQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X color="#888" size={18} />
              </TouchableOpacity>
            )}
          </View>
          
          {isOnlineSearching ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <ActivityIndicator size="large" color="#1DB954" />
              <Text style={{ color: '#888', marginTop: 12, fontSize: 14 }}>Finding songs...</Text>
            </View>
          ) : searchResults.length === 0 && onlineQuery.length > 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Music color="#444" size={48} />
              <Text style={{ color: '#888', marginTop: 12 }}>No results found</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={keyExtractor}
              contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={true}
              renderItem={({item, index}) => (
                <OnlineItem
                  item={item}
                  isDownloaded={downloadedSongs.some(s => s.id === item.id)}
                  downloading={isDownloading[item.id] || false}
                  progress={downloadProgress[item.id] || 0}
                  onPress={() => setPlaylistAndPlay(searchResults, index)}
                  onDownload={() => downloadTrack(item)}
                />
              )}
            />
          )}
        </View>
      );
    }

    // ===== DOWNLOADS TAB =====
    if (activeTab === 'Downloads') {
      return downloadedSongs.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Download color="#444" size={48} />
          <Text style={{ color: '#888', marginTop: 12, fontSize: 16 }}>No downloaded songs yet</Text>
          <Text style={{ color: '#555', marginTop: 4 }}>Go to Online tab to search & download</Text>
        </View>
      ) : (
        <FlatList
          data={downloadedSongs}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          renderItem={({item, index}) => (
            <SongItem
              item={item}
              isPlayingThis={currentSong?.id === item.id}
              isLiked={isFavorite(item.id)}
              onPress={() => handleSongPress(item, index, downloadedSongs)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      );
    }

    // ===== FAVORITES TAB =====
    if (activeTab === 'Favorites') {
      return favoriteSongs.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Heart color="#444" size={48} />
          <Text style={{ color: '#888', marginTop: 12, fontSize: 16 }}>No favorites yet</Text>
          <Text style={{ color: '#555', marginTop: 4 }}>Tap the ♥ icon on any song</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteSongs}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          renderItem={({item, index}) => (
            <SongItem
              item={item}
              isPlayingThis={currentSong?.id === item.id}
              isLiked={true}
              onPress={() => handleSongPress(item, index, favoriteSongs)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      );
    }

    // ===== SONGS TAB =====
    if (activeTab === 'Songs') {
      return (
        <FlatList
          data={processedSongs}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={15}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews={true}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.sortRow}>
              <Text style={styles.songCount}>{processedSongs.length} songs</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshLibrary}
              tintColor="#1DB954"
              colors={['#1DB954']}
            />
          }
          renderItem={({item, index}) => (
            <SongItem
              item={item}
              isPlayingThis={currentSong?.id === item.id}
              isLiked={isFavorite(item.id)}
              onPress={() => handleSongPress(item, index)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      );
    }

    // ===== ARTISTS TAB =====
    if (activeTab === 'Artists') {
      // If an artist is expanded, show their songs
      if (expandedArtist) {
        return (
          <View style={{ flex: 1 }}>
            <TouchableOpacity 
              style={styles.backRow} 
              onPress={() => setExpandedArtist(null)}
              activeOpacity={0.6}
            >
              <ChevronRight color="#FFF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
              <Text style={styles.backText}>{expandedArtist.name}</Text>
              <Text style={styles.backCount}>{expandedArtist.songCount} songs</Text>
            </TouchableOpacity>
            <FlatList
              data={expandedArtist.songs}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={true}
              contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({item, index}) => (
                <SongItem
                  item={item}
                  isPlayingThis={currentSong?.id === item.id}
                  isLiked={isFavorite(item.id)}
                  onPress={() => handleSongPress(item, index, expandedArtist.songs)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              )}
            />
          </View>
        );
      }

      return (
        <FlatList
          data={libraryArtists}
          keyExtractor={(item) => item.name}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <Text style={styles.songCount}>{libraryArtists.length} artists</Text>
          }
          renderItem={({ item }) => (
            <ArtistItem
              item={item}
              onPress={() => setExpandedArtist(item)}
            />
          )}
        />
      );
    }

    // ===== ALBUMS TAB =====
    if (activeTab === 'Albums') {
      // If an album is expanded, show its songs
      if (expandedAlbum) {
        return (
          <View style={{ flex: 1 }}>
            <TouchableOpacity 
              style={styles.backRow} 
              onPress={() => setExpandedAlbum(null)}
              activeOpacity={0.6}
            >
              <ChevronRight color="#FFF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
              <Text style={styles.backText}>{expandedAlbum.name}</Text>
              <Text style={styles.backCount}>{expandedAlbum.songs.length} songs</Text>
            </TouchableOpacity>
            <FlatList
              data={expandedAlbum.songs}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={true}
              contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({item, index}) => (
                <SongItem
                  item={item}
                  isPlayingThis={currentSong?.id === item.id}
                  isLiked={isFavorite(item.id)}
                  onPress={() => handleSongPress(item, index, expandedAlbum.songs)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              )}
            />
          </View>
        );
      }

      return (
        <FlatList
          data={libraryAlbums}
          keyExtractor={(item) => item.name}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <Text style={styles.songCount}>{libraryAlbums.length} albums</Text>
          }
          renderItem={({ item }) => (
            <AlbumItem
              item={item}
              onPress={() => setExpandedAlbum(item)}
            />
          )}
        />
      );
    }
  };

  // Reset expanded views when switching tabs
  useEffect(() => {
    setExpandedArtist(null);
    setExpandedAlbum(null);
  }, [activeTab]);

  const tabs: TabName[] = ['Songs', 'Artists', 'Albums', 'Online', 'Downloads', 'Favorites'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* GRADIENT HEADER */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f0f']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          {isSearching ? (
            <View style={styles.searchBarContainer}>
              <Search color="#888" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search your library..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearching(false); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.headerTitle}>Rimuru Music</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSortSheetOpen(true)} activeOpacity={0.6}>
                  <Sliders color="#FFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearching(true)} activeOpacity={0.6}>
                  <Search color="#FFF" size={22} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')} activeOpacity={0.6}>
                  <LinearGradient colors={['#1DB954', '#17a34a']} style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </LinearGradient>

      {/* SCROLLABLE TABS */}
      <View style={styles.tabsContainer}>
        <FlatList 
          horizontal 
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({item: tab}) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.6}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {renderContent()}

      {/* SORT BY BOTTOM SHEET */}
      <Modal
        visible={isSortSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortSheetOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsSortSheetOpen(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sort by</Text>
            
            <TouchableOpacity 
              style={styles.sheetOption} 
              onPress={() => { setSortBy('title'); setIsSortSheetOpen(false); }}
            >
              <View style={styles.sheetOptionContent}>
                <Text style={[styles.optionText, sortBy === 'title' && styles.activeOptionText]}>Title (A-Z)</Text>
                {sortBy === 'title' && <Check color="#1DB954" size={20} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sheetOption} 
              onPress={() => { setSortBy('date'); setIsSortSheetOpen(false); }}
            >
              <View style={styles.sheetOptionContent}>
                <Text style={[styles.optionText, sortBy === 'date' && styles.activeOptionText]}>Recently Added</Text>
                {sortBy === 'date' && <Check color="#1DB954" size={20} />}
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerGradient: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    marginLeft: 10,
    padding: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 16,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
  },
  tabsContainer: {
    marginBottom: 8,
    marginTop: 4,
  },
  tab: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  activeTab: {
    backgroundColor: '#1DB954',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  onlineSearchContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginHorizontal: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  onlineSearchInput: {
    flex: 1, color: 'white', fontSize: 16, marginLeft: 10, padding: 0,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  songCount: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 10,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sortText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    height: ITEM_HEIGHT,
  },
  songInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  activeText: {
    color: '#1DB954',
  },
  artist: {
    fontSize: 13,
    color: '#999',
  },
  heartBtn: {
    padding: 8,
  },
  downloadBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  downloadedBtn: {
    backgroundColor: 'rgba(29,185,84,0.15)',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  avatarBtn: {
    marginLeft: 12,
  },
  avatarSmall: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarSmallText: {
    color: '#FFF', fontSize: 16, fontWeight: '800',
  },
  artistAvatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  albumCover: {
    width: 56, height: 56, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },
  backCount: {
    color: '#888',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 250,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 24,
  },
  sheetOption: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionText: {
    fontSize: 16,
    color: '#DDD',
    fontWeight: '500',
  },
  activeOptionText: {
    color: '#1DB954',
    fontWeight: '700',
  },
});
