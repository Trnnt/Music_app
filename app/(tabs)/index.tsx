import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Image, Dimensions, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Search, Download, Heart, X, Music, ChevronRight, Disc3, Users, Check, Sliders, Shuffle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useAudioLibrary, ArtistData, AlbumData } from '@/hooks/useAudioLibrary';
import { useOnlineDownloader } from '@/hooks/useOnlineDownloader';
import { useFavorites } from '@/hooks/useFavorites';
import Skeleton from '@/components/Skeleton';
import SongArtwork from '@/components/SongArtwork';
import { Song } from '@/constants/data';
import { PremiumBackground } from '@/components/PremiumBackground';
import { GlassView } from '@/components/ui/GlassView';

const { width } = Dimensions.get('window');
const RIMURU_LOGO = require('../../assets/images/rimuru.jpg');

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
          color={isLiked ? '#FF4B6E' : 'rgba(255,255,255,0.2)'} 
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
      <ChevronRight color="rgba(255,255,255,0.2)" size={20} />
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
      <ChevronRight color="rgba(255,255,255,0.2)" size={20} />
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
    >
      {downloading ? (
        <ActivityIndicator size="small" color="#1DB954" />
      ) : isDownloaded ? (
        <Check color="#1DB954" size={20} />
      ) : (
        <Download color="#FFF" size={20} />
      )}
    </TouchableOpacity>
  </TouchableOpacity>
));

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
  
  const [expandedArtist, setExpandedArtist] = useState<ArtistData | null>(null);
  const [expandedAlbum, setExpandedAlbum] = useState<AlbumData | null>(null);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (onlineQuery) {
        search(onlineQuery);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [onlineQuery]);

  const allSongs = useMemo(() => {
    const masterMap = new Map<string, Song>();
    [...(user?.library || []), ...downloadedSongs, ...songs].forEach(s => masterMap.set(s.id, s));
    return Array.from(masterMap.values());
  }, [songs, downloadedSongs, user?.library]);

  const processedSongs = useMemo(() => {
    let list = [...allSongs];
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }
    return list;
  }, [allSongs, searchQuery]);

  const handleSongPress = useCallback((song: Song, index: number, list?: Song[]) => {
    const playlist = list || processedSongs;
    setPlaylistAndPlay(playlist, index);
    openPlayer();
    router.navigate('/player');
  }, [processedSongs, setPlaylistAndPlay, openPlayer, router]);

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
          contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]}
        />
      );
    }

    if (activeTab === 'Online') {
      return (
        <View style={{ flex: 1 }}>
          <GlassView style={styles.onlineSearchContainer} intensity={20}>
            <Search color="rgba(255,255,255,0.4)" size={18} />
            <TextInput 
              style={styles.onlineSearchInput}
              placeholder="Search full songs..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={onlineQuery}
              onChangeText={setOnlineQuery}
            />
            {onlineQuery.length > 0 && (
              <TouchableOpacity onPress={() => setOnlineQuery('')}>
                <X color="#FFF" size={18} />
              </TouchableOpacity>
            )}
          </GlassView>
          
          {isOnlineSearching ? (
            <ActivityIndicator size="large" color="#1DB954" style={{marginTop: 40}} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]}
              renderItem={({item, index}) => (
                <OnlineItem
                  item={item}
                  isDownloaded={downloadedSongs.some(s => s.id === item.id)}
                  downloading={isDownloading[item.id] || false}
                  progress={downloadProgress[item.id] || 0}
                  onPress={() => handleSongPress(item, index, searchResults)}
                  onDownload={() => downloadTrack(item)}
                />
              )}
            />
          )}
        </View>
      );
    }

    if (activeTab === 'Artists') {
      return expandedArtist ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.backRow} onPress={() => setExpandedArtist(null)}>
            <ChevronRight color="#FFF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backText}>{expandedArtist.name}</Text>
          </TouchableOpacity>
          <FlatList data={expandedArtist.songs} keyExtractor={(s) => s.id} contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]} renderItem={({item, index}) => <SongItem item={item} isPlayingThis={currentSong?.id === item.id} isLiked={isFavorite(item.id)} onPress={() => handleSongPress(item, index, expandedArtist.songs)} onToggleFavorite={() => toggleFavorite(item.id)} />} />
        </View>
      ) : (
        <FlatList data={libraryArtists} keyExtractor={(item) => item.name} contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]} renderItem={({ item }) => <ArtistItem item={item} onPress={() => setExpandedArtist(item)} />} />
      );
    }

    if (activeTab === 'Albums') {
      return expandedAlbum ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.backRow} onPress={() => setExpandedAlbum(null)}>
            <ChevronRight color="#FFF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backText}>{expandedAlbum.name}</Text>
          </TouchableOpacity>
          <FlatList data={expandedAlbum.songs} keyExtractor={(s) => s.id} contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]} renderItem={({item, index}) => <SongItem item={item} isPlayingThis={currentSong?.id === item.id} isLiked={isFavorite(item.id)} onPress={() => handleSongPress(item, index, expandedAlbum.songs)} onToggleFavorite={() => toggleFavorite(item.id)} />} />
        </View>
      ) : (
        <FlatList data={libraryAlbums} keyExtractor={(item) => item.name} contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]} renderItem={({ item }) => <AlbumItem item={item} onPress={() => setExpandedAlbum(item)} />} />
      );
    }

    const currentList = activeTab === 'Favorites' ? allSongs.filter(s => isFavorite(s.id)) 
                     : activeTab === 'Downloads' ? downloadedSongs 
                     : processedSongs;

    return (
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sortRow}>
            <Text style={styles.songCount}>{currentList.length} songs</Text>
          </View>
        }
        refreshControl={
          activeTab === 'Songs' ? <RefreshControl refreshing={isRefreshing} onRefresh={refreshLibrary} tintColor="#1DB954" /> : undefined
        }
        renderItem={({item, index}) => (
          <SongItem
            item={item}
            isPlayingThis={currentSong?.id === item.id}
            isLiked={isFavorite(item.id)}
            onPress={() => handleSongPress(item, index, currentList)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
      />
    );
  };

  const tabs: TabName[] = ['Songs', 'Artists', 'Albums', 'Online', 'Downloads', 'Favorites'];
  const colors = { background: '#1a1a2e', primary: '#1DB954', secondary: '#16213e', detail: '#888' };

  return (
    <View style={styles.container}>
      <PremiumBackground colors={colors} />
      
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          {isSearching ? (
            <GlassView style={styles.searchBarContainer} intensity={30}>
              <Search color="#888" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search library..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => setIsSearching(false)}>
                <X color="#FFF" size={22} />
              </TouchableOpacity>
            </GlassView>
          ) : (
            <>
              <View style={styles.logoHeader}>
                <Image source={RIMURU_LOGO} style={styles.logoIcon} />
                <Text style={styles.headerTitle}>Rimuru</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSortSheetOpen(true)}>
                  <Sliders color="#FFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearching(true)}>
                  <Search color="#FFF" size={22} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
                  <LinearGradient colors={['#1DB954', '#17a34a']} style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.tabsWrapper}>
          <FlatList 
            horizontal 
            showsHorizontalScrollIndicator={false}
            data={tabs}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({item: tab}) => (
              <TouchableOpacity 
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {renderContent()}

      <TouchableOpacity 
        style={[styles.shuffleFab, {backgroundColor: colors.primary, bottom: insets.bottom + 85}]}
        onPress={() => {
          const list = activeTab === 'Songs' ? processedSongs : allSongs;
          setPlaylistAndPlay(list, Math.floor(Math.random() * list.length));
          router.push('/player');
        }}
      >
        <Shuffle color="#000" size={24} />
      </TouchableOpacity>

      <Modal visible={isSortSheetOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsSortSheetOpen(false)}>
          <GlassView style={styles.bottomSheet} intensity={80}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sort by</Text>
            {['TITLE', 'DATE_ADDED'].map((opt) => (
              <TouchableOpacity key={opt} style={styles.sheetOption} onPress={() => { setSortBy(opt.toLowerCase() as any); setIsSortSheetOpen(false); }}>
                <Text style={[styles.optionText, sortBy === opt.toLowerCase() && {color: colors.primary}]}>{opt.replace('_', ' ')}</Text>
                {sortBy === opt.toLowerCase() && <Check color={colors.primary} size={20} />}
              </TouchableOpacity>
            ))}
          </GlassView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, height: 75 },
  logoHeader: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginLeft: 10, letterSpacing: -1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 15, padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  avatarBtn: { marginLeft: 15 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  searchBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 45 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, marginLeft: 10 },
  tabsWrapper: { height: 50, marginBottom: 10 },
  tab: { marginRight: 10, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  activeTab: { backgroundColor: '#1DB954' },
  tabText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'bold' },
  activeTabText: { color: '#000' },
  listContainer: { paddingHorizontal: 20 },
  songItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  songInfo: { flex: 1, marginLeft: 15 },
  title: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  activeText: { color: '#1DB954' },
  artist: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  heartBtn: { padding: 10 },
  sortRow: { paddingVertical: 10 },
  songCount: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  onlineSearchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 15, height: 50, marginBottom: 15 },
  onlineSearchInput: { flex: 1, color: '#FFF', fontSize: 16, marginLeft: 12 },
  shuffleFab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#161b22' },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  optionText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600' },
  artistAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  albumCover: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  progressBarBg: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, marginTop: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#1DB954', borderRadius: 1 },
  downloadBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  downloadedBtn: { backgroundColor: 'rgba(29,185,84,0.1)' },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  backText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
});
