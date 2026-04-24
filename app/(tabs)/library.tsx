import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Library as LibraryIcon, Music, Heart, Clock, ListMusic, FolderHeart, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useAudioLibrary } from '@/hooks/useAudioLibrary';
import { PremiumBackground } from '@/components/PremiumBackground';
import { GlassView } from '@/components/ui/GlassView';

export default function LibraryTabScreen() {
  const insets = useSafeAreaInsets();
  const { listeningHistory, totalListeningMs } = useAuth();
  const { albums, artists } = useAudioLibrary();
  const router = useRouter();

  const mainActions = [
    { id: 'fav', title: 'Favorites', icon: Heart, color: '#FF4B6E', count: 'All' },
    { id: 'recent', title: 'Recently Played', icon: Clock, color: '#00B4D8', count: listeningHistory?.length || 0 },
    { id: 'playlists', title: 'My Playlists', icon: ListMusic, color: '#1DB954', count: 0 },
    { id: 'folders', title: 'Local Folders', icon: FolderHeart, color: '#FFD700', count: 'Scan' },
  ];

  const colors = {
    background: '#1a1a2e',
    primary: '#1DB954',
    secondary: '#16213e',
    detail: '#888',
  };

  return (
    <View style={styles.container}>
      <PremiumBackground colors={colors} />
      
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Library</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Plus color="#FFF" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {mainActions.map((item) => (
            <TouchableOpacity key={item.id} style={styles.cardWrapper} activeOpacity={0.8}>
              <GlassView style={styles.card} intensity={20}>
                <item.icon color={item.color} size={28} />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardCount}>{item.count} items</Text>
              </GlassView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COLLECTIONS</Text>
          <TouchableOpacity style={styles.rowItem} onPress={() => {}}>
            <GlassView style={styles.rowIcon} intensity={30}>
              <Music color="#FFF" size={20} />
            </GlassView>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>All Songs</Text>
              <Text style={styles.rowSub}>{albums.reduce((acc, a) => acc + a.songs.length, 0)} tracks</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem}>
            <GlassView style={styles.rowIcon} intensity={30}>
              <LibraryIcon color="#FFF" size={20} />
            </GlassView>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Albums</Text>
              <Text style={styles.rowSub}>{albums.length} collections</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem}>
            <GlassView style={styles.rowIcon} intensity={30}>
              <ListMusic color="#FFF" size={20} />
            </GlassView>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Artists</Text>
              <Text style={styles.rowSub}>{artists.length} artists</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recently Played List */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>LAST PLAYED</Text>
          {listeningHistory.slice(0, 5).map((item, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.songTitle}</Text>
                <Text style={styles.historyArtist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <Text style={styles.historyTime}>Recently</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 30 },
  cardWrapper: { width: '50%', padding: 6 },
  card: { padding: 20, borderRadius: 20, minHeight: 120, justifyContent: 'center' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  cardCount: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 30 },
  sectionHeader: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
  rowItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rowText: { marginLeft: 16 },
  rowTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  rowSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingLeft: 10 },
  historyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1DB954', marginRight: 15 },
  historyContent: { flex: 1 },
  historyTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  historyArtist: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  historyTime: { color: 'rgba(255,255,255,0.2)', fontSize: 11 },
});
